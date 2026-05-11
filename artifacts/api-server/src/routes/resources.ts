import { Router, type IRouter, type Request, type Response } from "express";
import { db, resources } from "@workspace/db";
import { eq, and, ilike, sql, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const { category, search, featured, page = "1", limit = "20" } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 20));
    const offset = (pageNum - 1) * limitNum;

    const conditions: any[] = [eq(resources.status, "active")];

    if (category && category !== "All") {
      conditions.push(eq(resources.category, category));
    }

    if (search) {
      conditions.push(ilike(resources.title, `%${search}%`));
    }

    if (featured === "true") {
      conditions.push(eq(resources.featured, true));
    }

    const [{ total }] = await db
      .select({ total: sql<number>`count(*)` })
      .from(resources)
      .where(and(...conditions));

    const rows = await db
      .select()
      .from(resources)
      .where(and(...conditions))
      .orderBy(desc(resources.featured), desc(resources.createdAt))
      .limit(limitNum)
      .offset(offset);

    res.json({
      resources: rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: Number(total),
        totalPages: Math.ceil(Number(total) / limitNum),
        hasMore: offset + limitNum < Number(total),
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
});

export default router;
