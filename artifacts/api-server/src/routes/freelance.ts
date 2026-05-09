import { Router, type IRouter, type Request, type Response } from "express";
import { db, jobs } from "@workspace/db";
import { eq, desc, and, sql } from "drizzle-orm";
import { serializeDates } from "../lib/serialize";

const router: IRouter = Router();

router.get("/freelance/gigs", async (req: Request, res: Response) => {
  const { category, limit: limitParam } = req.query;
  const limit = Math.min(50, parseInt(limitParam as string) || 20);

  const conditions = [
    eq(jobs.status, "active"),
    sql`${jobs.employmentType} IN ('Freelance', 'Contract', 'Part-Time')`,
  ];

  if (category && typeof category === "string") {
    conditions.push(sql`${jobs.industry} ILIKE ${`%${category}%`}`);
  }

  const gigs = await db
    .select()
    .from(jobs)
    .where(and(...conditions))
    .orderBy(desc(jobs.createdAt))
    .limit(limit);

  res.json(serializeDates(gigs));
});

router.get("/freelance/stats", async (_req: Request, res: Response) => {
  const [{ total }] = await db
    .select({ total: sql<number>`COUNT(*)` })
    .from(jobs)
    .where(
      and(
        eq(jobs.status, "active"),
        sql`${jobs.employmentType} IN ('Freelance', 'Contract', 'Part-Time')`,
      )
    );

  res.json({ totalGigs: Number(total) });
});

router.get("/freelance/categories", async (_req: Request, res: Response) => {
  const results = await db
    .select({
      industry: jobs.industry,
      count: sql<number>`COUNT(*)`,
    })
    .from(jobs)
    .where(
      and(
        eq(jobs.status, "active"),
        sql`${jobs.employmentType} IN ('Freelance', 'Contract', 'Part-Time')`,
      ),
    )
    .groupBy(jobs.industry)
    .orderBy(sql`COUNT(*) DESC`);

  res.json(results.map((r) => ({ category: r.industry, count: Number(r.count) })));
});

export default router;
