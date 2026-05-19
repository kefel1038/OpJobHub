import { db, jobs, jobSources, scrapeLogs, companies, jobEmbeddings } from "@workspace/db";
import { eq, and, sql, gte, lt, desc, inArray } from "drizzle-orm";
import { logger } from "./logger";
import { openrouter, getEmbedding } from "./openai";
import { FreshnessEngine } from "../services/jobs/freshness-engine";

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
  private freshnessEngine = new FreshnessEngine();

  setSourceId(id: number | null) {
    this.sourceId = id;
  }

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
    this.jobsScraped += scrapedJobs.length;

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

  async processSingleJob(sj: ScrapedJob, skipAI = false) {
    const normalizedTitle = sj.title.trim().toLowerCase();
    const normalizedCompany = sj.company.trim().toLowerCase();

    // ── Step 1: Exact title+company dedup ───────────────────────
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
      await this.mergeIntoJob(sj, existing[0], skipAI);
      this.jobsUpdated++;
      return;
    }

    // ── Step 2: Cross-source vector similarity dedup ────────────
    const vectorMatch = await this.findVectorDuplicate(sj);
    if (vectorMatch) {
      await this.mergeIntoJob(sj, vectorMatch, skipAI);
      this.jobsDuplicates++;
      return;
    }

    // ── Step 3: Insert new job ─────────────────────────────────
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

    let industry = sj.industry;
    let category = sj.category;
    let experienceLevel = sj.experienceLevel;
    let employmentType = sj.employmentType;
    let skills = sj.skills;
    let tags = sj.tags;
    let visaSponsored = sj.visaSponsored;
    let isRemote = sj.isRemote;
    let aiSummary: string | null = null;

    if (!skipAI) {
      const [aiResult, scamResult] = await Promise.allSettled([
        aiCategorizeJob({ title: sj.title, company: sj.company, description: sj.description }),
        aiDetectScam({ title: sj.title, company: sj.company, description: sj.description, salary: sj.salary }),
      ]);

      if (scamResult.status === "fulfilled" && scamResult.value?.isScam) {
        logger.warn(
          { job: sj.title, confidence: scamResult.value.confidence, reasons: scamResult.value.reasons },
          "Job flagged as potential scam",
        );
      }

      if (aiResult.status === "fulfilled" && aiResult.value) {
        const c = aiResult.value;
        industry = c.industry || industry;
        category = c.category || category;
        experienceLevel = c.experienceLevel || experienceLevel;
        employmentType = c.employmentType || employmentType;
        skills = c.skills || skills;
        tags = c.tags || tags;
        visaSponsored = c.visaSponsored ?? visaSponsored;
        isRemote = c.isRemote ?? isRemote;
        aiSummary = c.summary || null;
      }
    }

    const freshnessScore = await this.freshnessEngine.computeScore({
      id: 0,
      postedAt: sj.postedAt ?? new Date(),
      lastSeenAt: new Date(),
      scrapedAt: new Date(),
      createdAt: new Date(),
      viewCount: 0,
      applyCount: 0,
      saveCount: 0,
    });

    const [inserted] = await db
      .insert(jobs)
      .values({
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
        employmentType: employmentType ?? "Full-Time",
        experienceLevel,
        industry,
        category,
        tags: tags ?? [],
        skills: skills ?? [],
        visaSponsored: visaSponsored ?? false,
        isRemote: isRemote ?? false,
        isUrgent: sj.isUrgent ?? false,
        source: sj.source,
        sourceId: this.sourceId,
        sourceUrl: sj.sourceUrl,
        applyUrl: sj.applyUrl,
        postedAt: sj.postedAt ?? new Date(),
        expiresAt,
        scrapedAt: new Date(),
        lastSeenAt: new Date(),
        status: "active",
        isArchived: false,
        freshnessScore,
        aiSummary,
      })
      .returning({ id: jobs.id });

    this.jobsNew++;

    // ── Step 4: Generate embedding for the new job ─────────────
    if (inserted && process.env.OPENAI_API_KEY) {
      try {
        const text = `${sj.title} at ${sj.company}. ${sj.description.slice(0, 1000)} Location: ${sj.location}`;
        const embedding = await getEmbedding(text);
        await db
          .insert(jobEmbeddings)
          .values({ jobId: inserted.id, embedding })
          .onConflictDoNothing({ target: jobEmbeddings.jobId });
      } catch (err) {
        logger.warn({ err, job: sj.title }, "Failed to generate embedding");
      }
    }
  }

  async findVectorDuplicate(sj: ScrapedJob) {
    if (!process.env.OPENAI_API_KEY) return null;
    try {
      const text = `${sj.title} at ${sj.company}. ${sj.description.slice(0, 1000)} Location: ${sj.location}`;
      const embedding = await getEmbedding(text);

      const result = await db.execute(sql`
        SELECT j.id, j.title, j.company, j.source, j.source_url, j.description,
               j.salary, j.employment_type, j.industry, j.ai_summary,
               1 - (je.embedding <=> ${JSON.stringify(embedding)}::vector) as similarity
        FROM ${jobEmbeddings} je
        JOIN ${jobs} j ON j.id = je.job_id
        WHERE j.status = 'active'
          AND 1 - (je.embedding <=> ${JSON.stringify(embedding)}::vector) > 0.85
        ORDER BY similarity DESC
        LIMIT 1
      `);

      if (result.rows.length > 0) {
        const match = result.rows[0];
        logger.info(
          { job: sj.title, match: match.title, similarity: match.similarity, source: match.source },
          "Cross-source duplicate detected via vector similarity",
        );
        return match;
      }
    } catch (err) {
      logger.warn({ err, job: sj.title }, "Vector dedup check failed");
    }
    return null;
  }

  async mergeIntoJob(sj: ScrapedJob, target: any, skipAI = false) {
    const now = new Date();
    const newExpires = new Date();
    newExpires.setDate(newExpires.getDate() + 4);

    const updateData: Record<string, any> = {
      lastSeenAt: now,
      scrapedAt: now,
      expiresAt: newExpires,
      status: "active",
      sourceUrl: sj.sourceUrl || target.source_url || target.sourceUrl,
      applyUrl: sj.applyUrl || target.apply_url || target.applyUrl,
      salary: sj.salary || target.salary,
      salaryMin: sj.salaryMin ?? target.salary_min ?? target.salaryMin,
      salaryMax: sj.salaryMax ?? target.salary_max ?? target.salaryMax,
    };

    if (!skipAI && !target.ai_summary && !target.aiSummary) {
      const [aiResult] = await Promise.allSettled([
        aiCategorizeJob({ title: sj.title, company: sj.company, description: sj.description }),
      ]);

      if (aiResult.status === "fulfilled" && aiResult.value) {
        const c = aiResult.value;
        if (!target.industry && c.industry) updateData.industry = c.industry;
        if (!target.category && c.category) updateData.category = c.category;
        if (!target.experience_level && !target.experienceLevel && c.experienceLevel) updateData.experienceLevel = c.experienceLevel;
        if (!target.employment_type && !target.employmentType && c.employmentType) updateData.employmentType = c.employmentType;
        if ((!target.skills || (typeof target.skills === 'string' ? JSON.parse(target.skills).length : target.skills.length) === 0) && c.skills) updateData.skills = c.skills;
        if ((!target.tags || (typeof target.tags === 'string' ? JSON.parse(target.tags).length : target.tags.length) === 0) && c.tags) updateData.tags = c.tags;
        if (target.visa_sponsored == null && target.visaSponsored == null && c.visaSponsored != null) updateData.visaSponsored = c.visaSponsored;
        if (target.is_remote == null && target.isRemote == null && c.isRemote != null) updateData.isRemote = c.isRemote;
        if (!target.ai_summary && !target.aiSummary && c.summary) updateData.aiSummary = c.summary;
      }
    }

    updateData.freshnessScore = await this.freshnessEngine.computeScore({
      id: target.id,
      postedAt: sj.postedAt ?? target.posted_at ?? target.postedAt,
      lastSeenAt: now,
      scrapedAt: now,
      createdAt: target.created_at ?? target.createdAt,
      viewCount: target.view_count ?? target.viewCount ?? 0,
      applyCount: target.apply_count ?? target.applyCount ?? 0,
      saveCount: target.save_count ?? target.saveCount ?? 0,
    });
    updateData.isArchived = false;

    await db.update(jobs).set(updateData).where(eq(jobs.id, target.id));
  }

  async cleanupExpired() {
    const result = await db
      .update(jobs)
      .set({
        status: "expired",
        isArchived: true,
        archivedAt: new Date(),
        freshnessScore: 0,
      })
      .where(
        and(
          lt(jobs.expiresAt, new Date()),
          eq(jobs.status, "active"),
          eq(jobs.isArchived, false),
        ),
      )
      .returning({ id: jobs.id });

    logger.info({ archived: result.length }, "Expired jobs archived");
    return result.length;
  }

  async archiveStale(days: number = 7) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const result = await db
      .update(jobs)
      .set({
        status: "expired",
        isArchived: true,
        archivedAt: new Date(),
        freshnessScore: 0,
      })
      .where(
        and(
          lt(jobs.lastSeenAt, cutoff),
          eq(jobs.status, "active"),
          eq(jobs.isArchived, false),
        ),
      )
      .returning({ id: jobs.id });

    logger.info({ archived: result.length, days }, "Stale jobs archived");
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
      model: "openrouter/free",
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
      model: "openrouter/free",
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
