import { ScraperEngine } from "../lib/scraper-engine";
import { allScrapers } from "../scrapers";
import { logger } from "../lib/logger";

async function main() {
  const sourceFilter = process.env.SCRAPE_SOURCE || "";

  logger.info({ sourceFilter: sourceFilter || "all" }, "Starting scrape session");

  const engine = new ScraperEngine();

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
        const jobs = await scraper.scrape();
        logger.info({ source: scraper.name, count: jobs.length }, "Scraped jobs");
        await engine.processJobs(jobs);
      } catch (err: any) {
        logger.error({ err, source: scraper.name }, "Scraper failed");
      }
    }
  }

  const deleted = await engine.cleanupExpired();
  logger.info({ deleted }, "Expired jobs cleaned up");

  await engine.finalize();
  logger.info("Scrape session completed");

  process.exit(0);
}

main().catch((err) => {
  logger.error({ err }, "Fatal error in scrape session");
  process.exit(1);
});
