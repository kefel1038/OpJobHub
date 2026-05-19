import { logger } from "../lib/logger";
import { sourceHealthMonitor } from "../services/jobs/source-health";

async function main() {
  logger.info("Starting source health update");

  await sourceHealthMonitor.updateAllSources();

  logger.info("Source health update completed");
  process.exit(0);
}

main().catch((err) => {
  logger.error({ err }, "Source health update failed");
  process.exit(1);
});
