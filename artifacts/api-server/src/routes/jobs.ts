import { Router, type IRouter, type Request, type Response } from "express";
import { db, jobs, companies, savedJobs } from "@workspace/db";
import { eq, desc, and, sql, count, gte, lt, inArray, or } from "drizzle-orm";
import { authMiddleware, requireRole } from "../lib/auth";
import { serializeDates } from "../lib/serialize";

const router: IRouter = Router();

router.get("/jobs", async (_req: Request, res: Response) => {
  try {
    const allJobs = await db
      .select()
      .from(jobs)
      .where(eq(jobs.status, "active"))
      .orderBy(desc(jobs.isFeatured), desc(jobs.createdAt));
    res.json(serializeDates(allJobs));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
});

router.get("/jobs/ping", (_req: Request, res: Response) => {
  res.json({ ok: true, msg: "jobs router works" });
});

router.get("/jobs/featured", async (_req: Request, res: Response) => {
  const featuredJobs = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.status, "active"), eq(jobs.isFeatured, true)))
    .orderBy(desc(jobs.createdAt))
    .limit(20);

  res.json(serializeDates(featuredJobs));
});

router.get("/jobs/recent", async (_req: Request, res: Response) => {
  const recentJobs = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.status, "active"), gte(jobs.createdAt, sql`NOW() - INTERVAL '24 hours'`)))
    .orderBy(desc(jobs.createdAt))
    .limit(50);

  res.json(serializeDates(recentJobs));
});

router.get("/jobs/urgent", async (_req: Request, res: Response) => {
  const urgentJobs = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.status, "active"), eq(jobs.isUrgent, true)))
    .orderBy(desc(jobs.createdAt))
    .limit(20);

  res.json(serializeDates(urgentJobs));
});

router.get("/jobs/visa-sponsored", async (_req: Request, res: Response) => {
  const visaJobs = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.status, "active"), eq(jobs.visaSponsored, true)))
    .orderBy(desc(jobs.createdAt))
    .limit(50);

  res.json(serializeDates(visaJobs));
});

router.get("/jobs/industry/:industry", async (req: Request, res: Response) => {
  const { industry } = req.params;
  const industryJobs = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.status, "active"), ilike(jobs.industry, `%${industry}%`)))
    .orderBy(desc(jobs.createdAt))
    .limit(50);

  res.json(serializeDates(industryJobs));
});

router.get("/jobs/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid job id." });
    return;
  }
  const [job] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  if (!job) {
    res.status(404).json({ error: "Job not found." });
    return;
  }

  await db.update(jobs).set({ viewCount: sql`${jobs.viewCount} + 1` }).where(eq(jobs.id, id));

  res.json(serializeDates(job));
});

router.get("/jobs/:id/similar", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid job id." });
    return;
  }
  const [job] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  if (!job) {
    res.status(404).json({ error: "Job not found." });
    return;
  }

  const similarJobs = await db
    .select()
    .from(jobs)
    .where(
      and(
        eq(jobs.status, "active"),
        sql`${jobs.id} != ${id}`,
        or(
          eq(jobs.industry, job.industry),
          eq(jobs.employmentType, job.employmentType),
          ilike(jobs.title, `%${job.title.split(" ").slice(0, 2).join(" ")}%`),
        ),
      ),
    )
    .orderBy(desc(jobs.createdAt))
    .limit(6);

  res.json(serializeDates(similarJobs));
});

router.post("/jobs", authMiddleware, requireRole("employer", "admin"), async (req: Request, res: Response) => {
  const { title, company, location, salary, description, responsibilities, requirements, benefits, companySize, companyOverview, employmentType, industry, isFeatured, visaSponsored, applyUrl } = req.body ?? {};

  if (!title || !company || !location || !description) {
    res.status(400).json({ error: "title, company, location, and description are required." });
    return;
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  const [created] = await db
    .insert(jobs)
    .values({
      title,
      company,
      location,
      salary: typeof salary === "string" ? salary : null,
      description,
      responsibilities: Array.isArray(responsibilities) ? responsibilities : [],
      requirements: Array.isArray(requirements) ? requirements : [],
      benefits: Array.isArray(benefits) ? benefits : [],
      companySize,
      companyOverview,
      aiResumeOptimization: Array.isArray(req.body.aiResumeOptimization) ? req.body.aiResumeOptimization : [],
      employmentType: employmentType ?? "Full-Time",
      industry,
      isFeatured: Boolean(isFeatured),
      visaSponsored: Boolean(visaSponsored),
      applyUrl,
      expiresAt,
      createdBy: req.user!.id,
      status: "active",
    })
    .returning();

  res.status(201).json(serializeDates(created));
});

router.patch("/jobs/:id", authMiddleware, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid job id." });
    return;
  }

  const [existing] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  if (!existing) {
    res.status(404).json({ error: "Job not found." });
    return;
  }

  if (req.user!.role !== "admin" && existing.createdBy !== req.user!.id) {
    res.status(403).json({ error: "Forbidden." });
    return;
  }

  const allowedFields = ["title", "company", "location", "salary", "description", "responsibilities", "requirements", "benefits", "companySize", "companyOverview", "employmentType", "industry", "isFeatured", "visaSonsored", "status", "isUrgent", "experienceLevel", "aiSummary", "aiCategory", "aiMatchScore", "aiResumeOptimization"];
  const updates: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }
  updates.updatedAt = new Date();

  const [updated] = await db
    .update(jobs)
    .set(updates)
    .where(eq(jobs.id, id))
    .returning();

  res.json(serializeDates(updated));
});

router.delete("/jobs/:id", authMiddleware, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid job id." });
    return;
  }
  const [job] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  if (!job) {
    res.status(404).json({ error: "Job not found." });
    return;
  }
  if (req.user!.role !== "admin" && job.createdBy !== req.user!.id) {
    res.status(403).json({ error: "Forbidden." });
    return;
  }
  await db.update(jobs).set({ status: "removed" }).where(eq(jobs.id, id));
  res.json({ success: true });
});

router.post("/jobs/:id/report", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid job id." });
    return;
  }
  await db
    .update(jobs)
    .set({ reportCount: sql`${jobs.reportCount} + 1` })
    .where(eq(jobs.id, id));

  res.json({ success: true, message: "Job reported. Our team will review it." });
});

router.post("/jobs/:id/save", authMiddleware, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const userId = req.user!.id;

  const [existing] = await db
    .select()
    .from(savedJobs)
    .where(and(eq(savedJobs.jobId, id), eq(savedJobs.userId, userId)))
    .limit(1);

  if (existing) {
    await db.delete(savedJobs).where(eq(savedJobs.id, existing.id));
    await db.update(jobs).set({ saveCount: sql`${jobs.saveCount} - 1` }).where(eq(jobs.id, id));
    res.json({ saved: false });
  } else {
    await db.insert(savedJobs).values({ jobId: id, userId });
    await db.update(jobs).set({ saveCount: sql`${jobs.saveCount} + 1` }).where(eq(jobs.id, id));
    res.json({ saved: true });
  }
});

router.get("/saved-jobs", authMiddleware, async (req: Request, res: Response) => {
  const userSavedJobs = await db
    .select()
    .from(savedJobs)
    .where(eq(savedJobs.userId, req.user!.id))
    .orderBy(desc(savedJobs.createdAt));

  const jobIds = userSavedJobs.map((sj) => sj.jobId);
  if (jobIds.length === 0) {
    res.json([]);
    return;
  }

  const savedJobDetails = await db
    .select()
    .from(jobs)
    .where(inArray(jobs.id, jobIds));

  res.json(serializeDates(savedJobDetails));
});

export default router;

function ilike(column: any, value: string) {
  return sql`${column} ILIKE ${value}`;
}
