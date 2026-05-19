import { logger } from "../lib/logger";
import { scrapeReporter } from "../services/jobs/reporting";

async function main() {
  logger.info("Starting daily report generation");

  const report = await scrapeReporter.generateDailyReport();

  logger.info(report, "Daily report generated");

  if (process.env.REPORT_WEBHOOK_URL) {
    await scrapeReporter.sendNotification(report);
  }

  process.exit(0);
}

main().catch((err) => {
  logger.error({ err }, "Daily report generation failed");
  process.exit(1);
});
