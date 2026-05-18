import { ScraperEngine } from "../lib/scraper-engine";
import { PlaywrightScraper } from "../lib/playwright-scraper";
import { allScrapers } from "../scrapers";
import { logger } from "../lib/logger";

async function main() {
  const sourceFilter = process.env.SCRAPE_SOURCE || "";
  const useQueues = !!process.env.REDIS_URL;

  logger.info({ sourceFilter: sourceFilter || "all", mode: useQueues ? "queue" : "inline" }, "Starting scrape session");

  if (useQueues) {
    const { runScrapePipelineViaQueue, startScrapeWorkers } = await import("../services/queue/scrape-worker");
    startScrapeWorkers();
    const result = await runScrapePipelineViaQueue(sourceFilter || undefined);
    logger.info({ dispatched: result.dispatched }, "Scrape jobs dispatched to queues");
    // Allow workers time to process before cleanup
    await new Promise((r) => setTimeout(r, 5000));
    const { dispatchScrapeCleanup } = await import("../services/queue/scrape-worker");
    await dispatchScrapeCleanup();
    logger.info("Queue-based scrape session complete");
    process.exit(0);
  }

  const pw = PlaywrightScraper.getInstance();
  await pw.init();

  const engine = new ScraperEngine();

  try {
    if (sourceFilter) {
      const scraper = allScrapers.find((s) => s.name === sourceFilter);
      if (!scraper) {
        logger.error({ source: sourceFilter }, "Unknown scraper source");
        process.exit(1);
      }
      await engine.initialize(scraper.name, scraper.displayName);
      const jobs = await scraper.scrape();
      await engine.processJobs(jobs);
    } else {
      await engine.initialize("bulk-scrape", "Bulk Scrape All Sources");
      for (const scraper of allScrapers) {
        try {
          logger.info({ source: scraper.name }, "Starting scraper");
          let jobs = await scraper.scrape();
          if (jobs.length === 0) {
            logger.warn({ source: scraper.name }, "Scraper returned 0 jobs, retrying once after 5s");
            await new Promise((r) => setTimeout(r, 5000));
            jobs = await scraper.scrape();
          }
          logger.info({ source: scraper.name, count: jobs.length }, "Scraped jobs");
          await engine.processJobs(jobs);
        } catch (err: any) {
          logger.error({ err, source: scraper.name }, "Scraper failed");
        }
      }
    }

    const deleted = await engine.cleanupExpired();
    logger.info({ deleted }, "Expired jobs cleaned up");

    const stale = await engine.archiveStale(7);
    logger.info({ stale }, "Stale jobs archived");

    await engine.finalize();
    logger.info("Scrape session completed");
  } finally {
    await pw.close();
  }

  process.exit(0);
}

main().catch((err) => {
  logger.error({ err }, "Fatal error in scrape session");
  process.exit(1);
});
