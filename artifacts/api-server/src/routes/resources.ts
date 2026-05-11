import { Router, type IRouter, type Request, type Response } from "express";
import { db, resources } from "@workspace/db";
import { eq, and, ilike, sql, desc } from "drizzle-orm";

const router: IRouter = Router();

router.post("/seed", async (_req: Request, res: Response) => {
  try {
    const existing = await db.select({ count: sql<number>`count(*)` }).from(resources);
    if (Number(existing[0]?.count ?? 0) > 0) {
      res.json({ ok: true, message: "Resources already seeded" });
      return;
    }
    const seedData = [
      { title: "Electrical Engineering Handbook", description: "Professional engineering learning material", category: "Engineering", url: "https://example.com/resource1.pdf", featured: true },
      { title: "Telecommunications Guide", description: "Networking and telecom fundamentals", category: "Technology", url: "https://example.com/resource2.pdf", featured: false },
      { title: "Career Development Guide", description: "Career preparation and interview support", category: "Career", url: "https://example.com/resource3.pdf", featured: true },
      { title: "Resume Writing for Gulf Jobs", description: "Tips and templates for GCC resumes", category: "Resume & CV", url: "https://example.com/resume-guide.pdf", featured: false },
      { title: "Common Interview Questions", description: "Top 50 interview questions with answers", category: "Interview Prep", url: "https://example.com/interview-qa.pdf", featured: false },
      { title: "Qatar Labor Law Guide", description: "Complete guide to worker rights in Qatar", category: "Labor Laws", url: "https://example.com/qatar-labor.pdf", featured: true },
      { title: "Work Visa Application Steps", description: "Step-by-step visa guide for Gulf countries", category: "Visa Guides", url: "https://example.com/visa-guide.pdf", featured: false },
      { title: "AI Tools for Job Seekers", description: "Leverage AI to optimize your job search", category: "AI Tools", url: "https://example.com/ai-tools.pdf", featured: false },
      { title: "Video Interview Tips", description: "Master remote interviews with these tips", category: "Videos", url: "https://example.com/video-tips", featured: false },
    ];
    for (const item of seedData) {
      await db.insert(resources).values(item);
    }
    res.status(201).json({ ok: true, message: `Seeded ${seedData.length} resources` });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
});

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
