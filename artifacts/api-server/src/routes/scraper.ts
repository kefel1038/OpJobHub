import { Router, type IRouter, type Request, type Response } from "express";
import { db, jobs, scrapeLogs, jobSources, sourceHealth } from "@workspace/db";
import { eq, desc, sql, count, and, or, gte, lt, like, inArray } from "drizzle-orm";
import { authMiddleware, requireRole } from "../lib/auth";
import { ScraperEngine } from "../lib/scraper-engine";
import { allScrapers } from "../scrapers";
import { logger } from "../lib/logger";
import { freshnessEngine } from "../services/jobs/freshness-engine";
import { sourceHealthMonitor } from "../services/jobs/source-health";
import { scrapeReporter } from "../services/jobs/reporting";

const router: IRouter = Router();

router.get("/scraper/sources", async (_req: Request, res: Response) => {
  const sources = await db.select().from(jobSources).orderBy(desc(jobSources.createdAt));
  res.json(sources);
});

router.post("/scraper/sources", authMiddleware, requireRole("admin"), async (req: Request, res: Response) => {
  const { name, displayName, type, baseUrl, scraperType } = req.body ?? {};
  if (!name || !displayName) {
    res.status(400).json({ error: "name and displayName are required" });
    return;
  }
  const [created] = await db.insert(jobSources).values({ name, displayName, type, baseUrl, scraperType }).returning();
  res.status(201).json(created);
});

router.get("/scraper/logs", async (_req: Request, res: Response) => {
  const logs = await db.select().from(scrapeLogs).orderBy(desc(scrapeLogs.startedAt)).limit(50);
  res.json(logs);
});

router.get("/scraper/logs/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [log] = await db.select().from(scrapeLogs).where(eq(scrapeLogs.id, id)).limit(1);
  if (!log) {
    res.status(404).json({ error: "Log not found" });
    return;
  }
  res.json(log);
});

router.post("/scraper/run", authMiddleware, requireRole("admin"), async (req: Request, res: Response) => {
  const { source } = req.body ?? {};

  try {
    const engine = new ScraperEngine();

    if (source) {
      const scraper = allScrapers.find((s) => s.name === source);
      if (!scraper) {
        res.status(400).json({ error: `Unknown source: ${source}` });
        return;
      }
      await engine.initialize(scraper.name, scraper.displayName);
      const jobs = await scraper.scrape();
      await engine.processJobs(jobs);
    } else {
      await engine.initialize("bulk-run", "Bulk Scrape Run");
      for (const scraper of allScrapers) {
        try {
          const scraperEngine = new ScraperEngine();
          await scraperEngine.initialize(scraper.name, scraper.displayName);
          const scrapedJobs = await scraper.scrape();
          await scraperEngine.processJobs(scrapedJobs);
          await scraperEngine.finalize();
        } catch (err: any) {
          logger.error({ err, scraper: scraper.name }, "Scraper failed");
        }
      }
    }

    await engine.cleanupExpired();
    await engine.finalize();

    res.json({
      success: true,
      message: `Scrape completed for ${source || "all sources"}`,
    });
  } catch (err: any) {
    logger.error({ err }, "Scrape run failed");
    res.status(500).json({ error: err.message });
  }
});

router.post("/scraper/schedule", authMiddleware, requireRole("admin"), async (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Scraping is scheduled via GitHub Actions cron at 08:00 AM Qatar time daily.",
    cron: "0 8 * * *",
    timezone: "Asia/Qatar",
  });
});

router.post("/scraper/cleanup", authMiddleware, requireRole("admin"), async (req: Request, res: Response) => {
  const engine = new ScraperEngine();
  const deleted = await engine.cleanupExpired();
  res.json({ success: true, deleted });
});

router.get("/scraper/stats", async (req: Request, res: Response) => {
  const totalJobs = await db.select({ count: count() }).from(jobs).where(and(eq(jobs.status, "active"), eq(jobs.isArchived, false)));
  const expiredJobs = await db.select({ count: count() }).from(jobs).where(eq(jobs.status, "expired"));
  const archivedJobs = await db.select({ count: count() }).from(jobs).where(eq(jobs.isArchived, true));
  const lastScrape = await db.select().from(scrapeLogs).orderBy(desc(scrapeLogs.startedAt)).limit(1);

  const sources = await db.select({
    source: jobs.source,
    count: count(),
  }).from(jobs).where(and(eq(jobs.status, "active"), eq(jobs.isArchived, false))).groupBy(jobs.source);

  const recentJobs = await db.select({ count: count() }).from(jobs)
    .where(and(eq(jobs.status, "active"), eq(jobs.isArchived, false), gte(jobs.createdAt, sql`NOW() - INTERVAL '24 hours'`)));

  const healthSummary = await db.select({
    source: sourceHealth.sourceName,
    level: sourceHealth.healthLevel,
    score: sourceHealth.healthScore,
  }).from(sourceHealth).where(or(eq(sourceHealth.healthLevel, "warning"), eq(sourceHealth.healthLevel, "broken")));

  res.json({
    totalJobs: Number(totalJobs[0]?.count ?? 0),
    expiredJobs: Number(expiredJobs[0]?.count ?? 0),
    archivedJobs: Number(archivedJobs[0]?.count ?? 0),
    recentJobs: Number(recentJobs[0]?.count ?? 0),
    lastScrape: lastScrape[0] ?? null,
    sources,
    healthWarnings: healthSummary,
  });
});

router.post("/scraper/refresh-freshness", authMiddleware, requireRole("admin"), async (_req: Request, res: Response) => {
  try {
    const count = await freshnessEngine.recomputeAll();
    res.json({ success: true, updated: count });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/scraper/source-health", async (_req: Request, res: Response) => {
  const health = await sourceHealthMonitor.getAllSourceHealth();
  res.json(health);
});

router.get("/scraper/source-health/:sourceName", async (req: Request, res: Response) => {
  const sourceName = String(req.params.sourceName);
  const health = await sourceHealthMonitor.getSourceHealth(sourceName);
  if (!health) {
    res.status(404).json({ error: "Source health not found" });
    return;
  }
  res.json(health);
});

router.post("/scraper/update-health", authMiddleware, requireRole("admin"), async (_req: Request, res: Response) => {
  try {
    await sourceHealthMonitor.updateAllSources();
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/scraper/daily-report", async (_req: Request, res: Response) => {
  const report = await scrapeReporter.getLatestReport();
  res.json(report ?? { error: "No report available" });
});

router.post("/scraper/generate-report", authMiddleware, requireRole("admin"), async (_req: Request, res: Response) => {
  try {
    const report = await scrapeReporter.generateDailyReport();
    res.json({ success: true, report });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
