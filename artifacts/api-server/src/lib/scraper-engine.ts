import { db, jobs, jobSources, scrapeLogs, companies } from "@workspace/db";
import { eq, and, sql, gte, lt, desc, inArray } from "drizzle-orm";
import { logger } from "./logger";
import { openrouter } from "./openai";

export interface ScrapedJob {
  title: string;
  company: string;
  companyLogo?: string;
  location: string;
  salary?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  description: string;
  employmentType?: string;
  experienceLevel?: string;
  industry?: string;
  category?: string;
  tags?: string[];
  skills?: string[];
  visaSponsored?: boolean;
  isRemote?: boolean;
  isUrgent?: boolean;
  nationalityFriendly?: string[];
  source: string;
  sourceUrl?: string;
  applyUrl?: string;
  postedAt?: Date;
}

export interface ScraperConfig {
  name: string;
  baseUrl: string;
  type: "playwright" | "cheerio" | "rss" | "api";
  schedule: string;
  selectors?: Record<string, string>;
}

export class ScraperEngine {
  private sourceId: number | null = null;
  private logId: number | null = null;
  private jobsScraped = 0;
  private jobsNew = 0;
  private jobsUpdated = 0;
  private jobsDuplicates = 0;
  private jobsFailed = 0;
  private errors: string[] = [];

  async initialize(sourceName: string, sourceDisplayName: string) {
    const [existing] = await db
      .select()
      .from(jobSources)
      .where(eq(jobSources.name, sourceName))
      .limit(1);

    if (existing) {
      this.sourceId = existing.id;
    } else {
      const [created] = await db
        .insert(jobSources)
        .values({
          name: sourceName,
          displayName: sourceDisplayName,
          isActive: true,
        })
        .returning();
      this.sourceId = created.id;
    }

    const [log] = await db
      .insert(scrapeLogs)
      .values({
        sourceId: this.sourceId,
        sourceName,
        status: "running",
        startedAt: new Date(),
      })
      .returning();
    this.logId = log.id;

    logger.info({ source: sourceName }, "Scrape session started");
  }

  async processJobs(scrapedJobs: ScrapedJob[]) {
    this.jobsScraped = scrapedJobs.length;

    for (const sj of scrapedJobs) {
      try {
        await this.processSingleJob(sj);
      } catch (err: any) {
        this.jobsFailed++;
        this.errors.push(`Failed to process job "${sj.title}": ${err.message}`);
        logger.error({ err, job: sj.title }, "Failed to process job");
      }
    }
  }

  private async processSingleJob(sj: ScrapedJob) {
    const normalizedTitle = sj.title.trim().toLowerCase();
    const normalizedCompany = sj.company.trim().toLowerCase();

    const existing = await db
      .select()
      .from(jobs)
      .where(
        and(
          sql`LOWER(${jobs.title}) = ${normalizedTitle}`,
          sql`LOWER(${jobs.company}) = ${normalizedCompany}`,
          inArray(jobs.status, ["active", "expired"]),
          gte(jobs.createdAt, sql`NOW() - INTERVAL '7 days'`),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      this.jobsDuplicates++;
      return;
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 4);

    const companySlug = sj.company.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    let companyId: number | null = null;

    const [existingCompany] = await db
      .select()
      .from(companies)
      .where(eq(companies.slug, companySlug))
      .limit(1);

    if (existingCompany) {
      companyId = existingCompany.id;
    }

    await db.insert(jobs).values({
      title: sj.title,
      company: sj.company,
      companyId,
      companyLogo: sj.companyLogo,
      location: sj.location,
      salary: sj.salary,
      salaryMin: sj.salaryMin ?? null,
      salaryMax: sj.salaryMax ?? null,
      salaryCurrency: sj.salaryCurrency ?? "QAR",
      description: sj.description,
      employmentType: sj.employmentType ?? "Full-Time",
      experienceLevel: sj.experienceLevel,
      industry: sj.industry,
      category: sj.category,
      tags: sj.tags ?? [],
      skills: sj.skills ?? [],
      visaSponsored: sj.visaSponsored ?? false,
      isRemote: sj.isRemote ?? false,
      isUrgent: sj.isUrgent ?? false,
      source: sj.source,
      sourceId: this.sourceId,
      sourceUrl: sj.sourceUrl,
      applyUrl: sj.applyUrl,
      postedAt: sj.postedAt ?? new Date(),
      expiresAt,
      scrapedAt: new Date(),
      status: "active",
    });

    this.jobsNew++;
  }

  async cleanupExpired() {
    const result = await db
      .delete(jobs)
      .where(lt(jobs.expiresAt, new Date()))
      .returning({ id: jobs.id });

    logger.info({ deleted: result.length }, "Expired jobs cleaned up");
    return result.length;
  }

  async finalize() {
    const completedAt = new Date();
    const duration = this.logId
      ? Math.round(
          (completedAt.getTime() -
            new Date(
              (
                await db
                  .select({ startedAt: scrapeLogs.startedAt })
                  .from(scrapeLogs)
                  .where(eq(scrapeLogs.id, this.logId))
                  .limit(1)
              )[0]?.startedAt ?? completedAt,
            ).getTime()) /
            1000,
        )
      : 0;

    if (this.logId) {
      await db
        .update(scrapeLogs)
        .set({
          status: this.errors.length > 0 ? "completed_with_errors" : "completed",
          jobsScraped: this.jobsScraped,
          jobsNew: this.jobsNew,
          jobsUpdated: this.jobsUpdated,
          jobsDuplicates: this.jobsDuplicates,
          jobsFailed: this.jobsFailed,
          errors: this.errors,
          completedAt,
          duration,
        })
        .where(eq(scrapeLogs.id, this.logId));
    }

    if (this.sourceId) {
      await db
        .update(jobSources)
        .set({ lastScrapedAt: new Date() })
        .where(eq(jobSources.id, this.sourceId));
    }

    logger.info(
      {
        source: (await db.select({ name: jobSources.name }).from(jobSources).where(eq(jobSources.id, this.sourceId!)).limit(1))[0]?.name,
        scraped: this.jobsScraped,
        new: this.jobsNew,
        duplicates: this.jobsDuplicates,
        failed: this.jobsFailed,
        duration: `${duration}s`,
      },
      "Scrape session completed",
    );
  }

  async runAll(scrapers: Array<() => Promise<ScrapedJob[]>>) {
    for (const scraper of scrapers) {
      try {
        const results = await scraper();
        await this.processJobs(results);
      } catch (err: any) {
        this.errors.push(`Scraper error: ${err.message}`);
        logger.error({ err }, "Scraper execution failed");
      }
    }
    await this.cleanupExpired();
    await this.finalize();
  }
}

export async function aiCategorizeJob(job: {
  title: string;
  company: string;
  description: string;
}) {
  try {
    const completion = await openrouter().chat.completions.create({
      model: "nvidia/nemotron-3-super:free",
      messages: [
        {
          role: "system",
          content: `You are a job categorization AI for Qatar's job market. 
          Analyze the job and return JSON with:
          - industry: one of [Construction, Oil & Gas, Healthcare, Hospitality, Engineering, IT, Security, Driving, Logistics, Education, Finance, Retail, Telecom, Manufacturing, Government, Other]
          - category: specific job category
          - experienceLevel: one of [Entry, Mid, Senior, Lead, Executive]
          - employmentType: one of [Full-Time, Part-Time, Contract, Temporary, Internship]
          - skills: array of relevant skills mentioned
          - tags: array of 3-5 relevant tags
          - visaSponsored: boolean (true if visa sponsorship is mentioned or implied)
          - isRemote: boolean
          - summary: one sentence job summary`,
        },
        {
          role: "user",
          content: `Title: ${job.title}\nCompany: ${job.company}\nDescription: ${job.description.slice(0, 2000)}`,
        },
      ],
    });

      return JSON.parse(completion.choices[0].message.content || "{}");
  } catch (err) {
    logger.error({ err }, "AI categorization failed");
    return null;
  }
}

export async function aiDetectScam(job: {
  title: string;
  company: string;
  description: string;
  salary?: string;
}): Promise<{ isScam: boolean; confidence: number; reasons: string[] }> {
  try {
    const completion = await openrouter().chat.completions.create({
      model: "nvidia/nemotron-3-super:free",
      messages: [
        {
          role: "system",
          content: `You are a scam detection AI for job listings. Analyze if a job posting appears to be a scam.
          Return JSON with:
          - isScam: boolean
          - confidence: number 0-100
          - reasons: array of strings explaining why`,
        },
        {
          role: "user",
          content: `Title: ${job.title}\nCompany: ${job.company}\nSalary: ${job.salary ?? "Not specified"}\nDescription: ${job.description.slice(0, 2000)}`,
        },
      ],
    });

    return JSON.parse(completion.choices[0].message.content || '{"isScam":false,"confidence":0,"reasons":[]}');
  } catch (err) {
    logger.error({ err }, "Scam detection failed");
    return { isScam: false, confidence: 0, reasons: ["AI analysis unavailable"] };
  }
}
