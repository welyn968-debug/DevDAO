import cron from "node-cron";
import { db } from "../lib/db";
import { finaliseContribution } from "../services/finalise.service";
import { logger } from "../lib/logger";

type Handler = () => Promise<void>;

function schedule(spec: string, handler: Handler) {
  cron.schedule(spec, () => {
    handler().catch((err) => logger.error({ err }, "cron failed"));
  });
}

async function runFinalise() {
  const expired = await db("contributions")
    .where("status", "PENDING")
    .andWhere("voting_deadline", "<", new Date())
    .select("id");

  for (const row of expired) {
    await finaliseContribution(row.id);
  }
}

const spec = process.env.FINALISE_CRON || "*/15 * * * *";
schedule(spec, runFinalise);
