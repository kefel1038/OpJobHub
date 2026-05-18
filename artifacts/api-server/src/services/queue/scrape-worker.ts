import { Job } from "bullmq";
import { logger } from "../../lib/logger";
import { getQueue, createWorker, QueueNames } from "../../lib/queue";
import { ScraperEngine, ScrapedJob } from "../../lib/scraper-engine";
import { allScrapers, ScraperDefinition } from "../../scrapers";
import { db, jobs, jobSources } from "@workspace/db";
import { eq, lt, and } from "drizzle-orm";

// ─── Dispatchers ────────────────────────────────────────────────────

export async function dispatchScrapeSource(sourceName: string): Promise<void> {
  await getQueue(QueueNames.SCRAPE).add("scrape-source", { sourceName }, {
    jobId: `scrape-${sourceName}-${Date.now()}`,
    priority: 1,
  });
}

export async function dispatchScrapeEnrich(job: ScrapedJob): Promise<void> {
  await getQueue(QueueNames.SCRAPE_ENRICH).add("enrich-job", { job }, {
    priority: 2,
    attempts: 3,
  });
}

export async function dispatchScrapePublish(job: ScrapedJob): Promise<void> {
  await getQueue(QueueNames.SCRAPE_PUBLISH).add("publish-job", { job }, {
    priority: 3,
    attempts: 3,
  });
}

export async function dispatchScrapeCleanup(): Promise<void> {
  await getQueue(QueueNames.SCRAPE_CLEANUP).add("cleanup", {}, {
    jobId: `cleanup-${Date.now()}`,
    priority: 5,
  });
}

// ─── Workers ────────────────────────────────────────────────────────

export function startScrapeWorkers(): void {
  // Scrape source worker — runs a scraper, dispatches each job to enrich
  createWorker(QueueNames.SCRAPE, async (job: Job) => {
    const { sourceName } = job.data;
    logger.info({ jobId: job.id, sourceName }, "Scrape worker: scraping source");

    const scraperDef = allScrapers.find((s: ScraperDefinition) => s.name === sourceName);
    if (!scraperDef) throw new Error(`Unknown scraper: ${sourceName}`);

    const scrapedJobs = await scraperDef.scrape();
    logger.info({ sourceName, count: scrapedJobs.length }, "Scrape worker: scraped jobs");

    if (scrapedJobs.length > 0) {
      await getQueue(QueueNames.SCRAPE_ENRICH).addBulk(
        scrapedJobs.map((sj) => ({
          name: "enrich-job",
          data: { job: sj, sourceName },
          opts: { priority: 2, attempts: 3 },
        })),
      );
    }

    return { sourceName, scraped: scrapedJobs.length, dispatched: scrapedJobs.length };
  });

  // Enrich worker — runs AI categorization + scam detection, forwards to publish
  createWorker(QueueNames.SCRAPE_ENRICH, async (job: Job) => {
    const { job: sj }: { job: ScrapedJob } = job.data;
    logger.info({ jobId: job.id, title: sj.title }, "Enrich worker: enriching job");

    const { aiCategorizeJob, aiDetectScam } = await import("../../lib/scraper-engine");

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

    const enriched: ScrapedJob & {
      aiSummary?: string;
    } = { ...sj };

    if (aiResult.status === "fulfilled" && aiResult.value) {
      const c = aiResult.value;
      if (c.industry) enriched.industry = c.industry;
      if (c.category) enriched.category = c.category;
      if (c.experienceLevel) enriched.experienceLevel = c.experienceLevel;
      if (c.employmentType) enriched.employmentType = c.employmentType;
      if (c.skills) enriched.skills = c.skills;
      if (c.tags) enriched.tags = c.tags;
      if (c.visaSponsored != null) enriched.visaSponsored = c.visaSponsored;
      if (c.isRemote != null) enriched.isRemote = c.isRemote;
      if (c.summary) (enriched as any).aiSummary = c.summary;
    }

    await dispatchScrapePublish(enriched);

    return { title: sj.title, enriched: true };
  });

  // Publish worker — deduplicates and inserts the job into the database
  createWorker(QueueNames.SCRAPE_PUBLISH, async (job: Job) => {
    const { job: sj }: { job: ScrapedJob } = job.data;
    logger.info({ jobId: job.id, title: sj.title }, "Publish worker: publishing job");

    const engine = new ScraperEngine();

    const [sourceRow] = await db
      .select()
      .from(jobSources)
      .where(eq(jobSources.name, sj.source))
      .limit(1);

    if (sourceRow) {
      engine.setSourceId(sourceRow.id);
    }

    await engine.processSingleJob(sj, true); // skipAI — already enriched

    return { title: sj.title, published: true };
  });

  // Cleanup worker — marks expired + stale jobs
  createWorker(QueueNames.SCRAPE_CLEANUP, async (_job: Job) => {
    logger.info("Cleanup worker: cleaning up expired jobs");

    const expired = await db
      .update(jobs)
      .set({ status: "expired" })
      .where(
        and(
          lt(jobs.expiresAt, new Date()),
          eq(jobs.status, "active"),
        ),
      )
      .returning({ id: jobs.id });

    const staleCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const stale = await db
      .update(jobs)
      .set({ status: "expired" })
      .where(
        and(
          lt(jobs.lastSeenAt, staleCutoff),
          eq(jobs.status, "active"),
        ),
      )
      .returning({ id: jobs.id });

    logger.info({ expired: expired.length, stale: stale.length }, "Cleanup worker complete");
    return { expired: expired.length, stale: stale.length };
  });

  logger.info("All scrape pipeline workers registered");
}

// ─── Orchestrated pipeline — dispatches scrape sources to queues ───

export async function runScrapePipelineViaQueue(sourceName?: string): Promise<{ dispatched: number }> {
  if (sourceName) {
    const scraper = allScrapers.find((s: ScraperDefinition) => s.name === sourceName);
    if (!scraper) throw new Error(`Unknown scraper source: ${sourceName}`);
    await dispatchScrapeSource(sourceName);
    return { dispatched: 1 };
  }

  for (const scraper of allScrapers) {
    await dispatchScrapeSource(scraper.name);
  }
  return { dispatched: allScrapers.length };
}
