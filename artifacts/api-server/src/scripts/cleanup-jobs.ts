import { ScraperEngine } from "../lib/scraper-engine";
import { logger } from "../lib/logger";

async function main() {
  logger.info("Starting expired jobs cleanup");

  const engine = new ScraperEngine();
  const deleted = await engine.cleanupExpired();

  logger.info({ deleted }, "Cleanup completed");
  process.exit(0);
}

main().catch((err) => {
  logger.error({ err }, "Cleanup failed");
  process.exit(1);
});
