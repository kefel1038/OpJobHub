import { Router, type IRouter, type Request, type Response } from "express";
import { db, jobs } from "@workspace/db";
import { eq, and, or, like, ilike, sql, count, desc, gte, lt, inArray } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (req: Request, res: Response) => {
  const {
    q,
    location,
    industry,
    employmentType,
    experienceLevel,
    salaryMin,
    salaryMax,
    visaSponsored,
    isRemote,
    isUrgent,
    nationality,
    source,
    sort = "newest",
    page = "1",
    limit = "20",
  } = req.query as Record<string, string>;

  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 20));
  const offset = (pageNum - 1) * limitNum;

  const conditions: any[] = [eq(jobs.status, "active")];

  if (q) {
    const searchTerm = `%${q}%`;
    conditions.push(
      or(
        ilike(jobs.title, searchTerm),
        ilike(jobs.company, searchTerm),
        ilike(jobs.description, searchTerm),
        ilike(jobs.tags, searchTerm),
        ilike(jobs.skills, searchTerm),
        ilike(jobs.category, searchTerm),
        ilike(jobs.industry, searchTerm),
      ),
    );
  }

  if (location) {
    conditions.push(ilike(jobs.location, `%${location}%`));
  }

  if (industry) {
    const industries = industry.split(",");
    if (industries.length === 1) {
      conditions.push(ilike(jobs.industry, `%${industries[0]}%`));
    } else {
      conditions.push(
        or(...industries.map((ind) => ilike(jobs.industry, `%${ind}%`))),
      );
    }
  }

  if (employmentType) {
    const types = employmentType.split(",");
    if (types.length === 1) {
      conditions.push(ilike(jobs.employmentType, `%${types[0]}%`));
    } else {
      conditions.push(or(...types.map((t) => ilike(jobs.employmentType, `%${t}%`))));
    }
  }

  if (experienceLevel) {
    conditions.push(ilike(jobs.experienceLevel, `%${experienceLevel}%`));
  }

  if (salaryMin) {
    conditions.push(gte(jobs.salaryMax, parseInt(salaryMin)));
  }

  if (salaryMax) {
    conditions.push(lt(jobs.salaryMin, parseInt(salaryMax)));
  }

  if (visaSonsored === "true") {
    conditions.push(eq(jobs.visaSonsored, true));
  }

  if (isRemote === "true") {
    conditions.push(eq(jobs.isRemote, true));
  }

  if (isUrgent === "true") {
    conditions.push(eq(jobs.isUrgent, true));
  }

  if (source) {
    conditions.push(ilike(jobs.source, `%${source}%`));
  }

  const orderBy =
    sort === "oldest"
      ? desc(jobs.createdAt)
      : sort === "salary"
        ? desc(jobs.salaryMax)
        : sort === "views"
          ? desc(jobs.viewCount)
          : desc(jobs.createdAt);

  const [{ total }] = await db
    .select({ total: count() })
    .from(jobs)
    .where(and(...conditions));

  const results = await db
    .select()
    .from(jobs)
    .where(and(...conditions))
    .orderBy(orderBy)
    .limit(limitNum)
    .offset(offset);

  res.json({
    jobs: results,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: Number(total),
      totalPages: Math.ceil(Number(total) / limitNum),
      hasMore: offset + limitNum < Number(total),
    },
  });
});

router.get("/suggestions", async (req: Request, res: Response) => {
  const { q } = req.query as { q?: string };
  if (!q || q.length < 2) {
    res.json({ suggestions: [] });
    return;
  }

  const searchTerm = `%${q}%`;
  const results = await db
    .select({ title: jobs.title })
    .from(jobs)
    .where(and(eq(jobs.status, "active"), ilike(jobs.title, searchTerm)))
    .limit(10);

  const uniqueTitles = [...new Set(results.map((r) => r.title))];
  res.json({ suggestions: uniqueTitles });
});

router.get("/trending", async (req: Request, res: Response) => {
  const recent = await db
    .select({ title: jobs.title, count: count() })
    .from(jobs)
    .where(and(eq(jobs.status, "active"), gte(jobs.createdAt, sql`NOW() - INTERVAL '7 days'`)))
    .groupBy(jobs.title)
    .orderBy(desc(sql`count`))
    .limit(20);

  const uniqueIndustries = [...new Set(recent.map((r) => r.title))];
  res.json({ trending: uniqueIndustries.slice(0, 10) });
});

router.get("/stats", async (req: Request, res: Response) => {
  const [{ total }] = await db
    .select({ total: count() })
    .from(jobs)
    .where(eq(jobs.status, "active"));

  const industries = await db
    .select({ industry: jobs.industry, count: count() })
    .from(jobs)
    .where(and(eq(jobs.status, "active"), sql`${jobs.industry} IS NOT NULL`))
    .groupBy(jobs.industry)
    .orderBy(desc(sql`count`))
    .limit(20);

  const locations = await db
    .select({ location: jobs.location, count: count() })
    .from(jobs)
    .where(and(eq(jobs.status, "active"), sql`${jobs.location} IS NOT NULL`))
    .groupBy(jobs.location)
    .orderBy(desc(sql`count`))
    .limit(20);

  const recentCount = await db
    .select({ count: count() })
    .from(jobs)
    .where(and(eq(jobs.status, "active"), gte(jobs.createdAt, sql`NOW() - INTERVAL '24 hours'`)));

  res.json({
    totalJobs: Number(total),
    recentJobs: Number(recentCount[0]?.count ?? 0),
    industries,
    locations,
  });
});

export default router;
