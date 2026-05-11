import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
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

router.post("/migrate", async (_req, res) => {
  try {
    const migrationFile = resolve(__dirname, "../../../lib/db/drizzle/0000_strong_colossus.sql");
    const sqlContent = readFileSync(migrationFile, "utf-8");
    const statements = sqlContent.split("--> statement-breakpoint").map((s) => s.trim()).filter(Boolean);

    for (const statement of statements) {
      await db.execute(sql.raw(statement));
    }
    res.json({ ok: true, message: "Migrations applied" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("already exists")) {
      res.json({ ok: true, message: "Tables already exist" });
    } else {
      res.status(500).json({ ok: false, message: msg });
    }
  }
});

export default router;
