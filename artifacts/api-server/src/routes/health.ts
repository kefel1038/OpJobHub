import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

router.get("/db-check", async (_req, res) => {
  try {
    await db.execute(sql`SELECT 1`);
    res.json({ db: "connected" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.json({ db: "error", message: msg });
  }
});

export default router;
