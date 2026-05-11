import { Router, type IRouter, type Request, type Response } from "express";
import { db, jobs } from "@workspace/db";
import { eq, and, or, like, ilike, sql, count, desc, gte, lt, inArray } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (req: Request, res: Response) => {
  const {
    q,
    location,
    locations,
    industry,
    categories: categoryParams,
    employmentType,
    experienceLevel,
    experienceLevels,
    workTypes,
    skills,
    nationality,
    nationalities,
    datePosted,
    aiMatchScore,
    salaryMin,
    salaryMax,
    visaSponsored,
    isRemote,
    isUrgent,
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
        ilike(sql`${jobs.tags}::text`, searchTerm),
        ilike(sql`${jobs.skills}::text`, searchTerm),
        ilike(jobs.category, searchTerm),
        ilike(jobs.industry, searchTerm),
      ),
    );
  }

  if (location) {
    conditions.push(ilike(jobs.location, `%${location}%`));
  }

  if (locations) {
    const locs = locations.split(",").map((l: string) => l.trim()).filter(Boolean);
    if (locs.length > 0) {
      conditions.push(or(...locs.map((loc: string) => ilike(jobs.location, `%${loc}%`))));
    }
  }

  const industryFilter = industry || categoryParams;
  if (industryFilter) {
    const industries = industryFilter.split(",").map((i: string) => i.trim()).filter(Boolean);
    if (industries.length === 1) {
      conditions.push(ilike(jobs.industry, `%${industries[0]}%`));
    } else {
      conditions.push(
        or(...industries.map((ind: string) => ilike(jobs.industry, `%${ind}%`))),
      );
    }
  }

  if (employmentType) {
    const types = employmentType.split(",").map((t: string) => t.trim()).filter(Boolean);
    if (types.length === 1) {
      conditions.push(ilike(jobs.employmentType, `%${types[0]}%`));
    } else {
      conditions.push(or(...types.map((t: string) => ilike(jobs.employmentType, `%${t}%`))));
    }
  }

  const expFilter = experienceLevels || experienceLevel;
  if (expFilter) {
    const levels = expFilter.split(",").map((l: string) => l.trim()).filter(Boolean);
    if (levels.length === 1) {
      conditions.push(ilike(jobs.experienceLevel, `%${levels[0]}%`));
    } else {
      conditions.push(or(...levels.map((l: string) => ilike(jobs.experienceLevel, `%${l}%`))));
    }
  }

  if (workTypes) {
    const types = workTypes.split(",").map((t: string) => t.trim().toLowerCase()).filter(Boolean);
    const workTypeConditions = types.map((type: string) => {
      if (type === "remote") return eq(jobs.isRemote, true);
      if (type === "on-site" || type === "onsite") return eq(jobs.isRemote, false);
      return null;
    }).filter(Boolean) as any[];
    if (workTypeConditions.length > 0) {
      conditions.push(or(...workTypeConditions));
    }
  }

  if (skills) {
    const skillList = skills.split(",").map((s: string) => s.trim()).filter(Boolean);
    if (skillList.length > 0) {
      conditions.push(or(...skillList.map((skill: string) => ilike(sql`${jobs.skills}::text`, `%${skill}%`))));
    }
  }

  if (nationalities) {
    const natList = nationalities.split(",").map((n: string) => n.trim()).filter(Boolean);
    if (natList.length > 0) {
      conditions.push(or(...natList.map((nat: string) => ilike(sql`${jobs.nationalityFriendly}::text`, `%${nat}%`))));
    }
  }

  if (nationality) {
    conditions.push(ilike(sql`${jobs.nationalityFriendly}::text`, `%${nationality}%`));
  }

  if (datePosted) {
    switch (datePosted) {
      case "24h": conditions.push(gte(jobs.createdAt, sql`NOW() - INTERVAL '24 hours'`)); break;
      case "3d": conditions.push(gte(jobs.createdAt, sql`NOW() - INTERVAL '3 days'`)); break;
      case "7d": conditions.push(gte(jobs.createdAt, sql`NOW() - INTERVAL '7 days'`)); break;
      case "14d": conditions.push(gte(jobs.createdAt, sql`NOW() - INTERVAL '14 days'`)); break;
      case "30d": conditions.push(gte(jobs.createdAt, sql`NOW() - INTERVAL '30 days'`)); break;
    }
  }

  if (aiMatchScore) {
    conditions.push(gte(jobs.aiMatchScore, parseInt(aiMatchScore)));
  }

  if (salaryMin) {
    conditions.push(gte(jobs.salaryMax, parseInt(salaryMin)));
  }

  if (salaryMax) {
    conditions.push(lt(jobs.salaryMin, parseInt(salaryMax)));
  }

  if (visaSponsored === "true") {
    conditions.push(eq(jobs.visaSponsored, true));
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
