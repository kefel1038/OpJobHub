import { logger } from "../lib/logger";
import { freshnessEngine } from "../services/jobs/freshness-engine";

async function main() {
  logger.info("Starting freshness score recomputation");

  const count = await freshnessEngine.recomputeAll();

  logger.info({ count }, "Freshness scores recomputed");
  process.exit(0);
}

main().catch((err) => {
  logger.error({ err }, "Freshness recomputation failed");
  process.exit(1);
});
