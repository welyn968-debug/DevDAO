import cron from "node-cron";
import { logger } from "../lib/logger";

const spec = process.env.SYNC_CRON || "0 * * * *";

cron.schedule(spec, async () => {
  try {
    // TODO: reconcile on-chain vote totals with DB
    logger.info("syncOnChain job stub");
  } catch (err) {
    logger.error({ err }, "syncOnChain job failed");
  }
});
