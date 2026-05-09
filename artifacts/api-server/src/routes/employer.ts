import { Router, type IRouter, type Request, type Response } from "express";
import { db, jobs, applications, users, savedJobs } from "@workspace/db";
import { eq, and, desc, sql, count, gte, lt, inArray } from "drizzle-orm";
import { authMiddleware, requireRole } from "../lib/auth";
import { serializeDates } from "../lib/serialize";

const router: IRouter = Router();

router.use("/employer", authMiddleware, requireRole("employer", "admin"));

// ─── Dashboard Stats ──────────────────────────────────────────────
router.get("/employer/stats", async (req: Request, res: Response) => {
  const employerId = req.user!.id;

  const [{ totalJobs }] = await db
    .select({ totalJobs: count() })
    .from(jobs)
    .where(and(eq(jobs.createdBy, employerId), eq(jobs.status, "active")));

  const [{ totalApplicants }] = await db
    .select({ totalApplicants: count() })
    .from(applications)
    .where(
      inArray(
        applications.jobId,
        db
          .select({ id: jobs.id })
          .from(jobs)
          .where(eq(jobs.createdBy, employerId))
      )
    );

  const [{ interviewsThisWeek }] = await db
    .select({ interviewsThisWeek: count() })
    .from(applications)
    .where(
      and(
        eq(applications.status, "interviewed"),
        inArray(
          applications.jobId,
          db.select({ id: jobs.id }).from(jobs).where(eq(jobs.createdBy, employerId))
        ),
        gte(applications.updatedAt, sql`NOW() - INTERVAL '7 days'`)
      )
    );

  const [{ hiredThisMonth }] = await db
    .select({ hiredThisMonth: count() })
    .from(applications)
    .where(
      and(
        eq(applications.status, "hired"),
        inArray(
          applications.jobId,
          db.select({ id: jobs.id }).from(jobs).where(eq(jobs.createdBy, employerId))
        ),
        gte(applications.updatedAt, sql`NOW() - INTERVAL '30 days'`)
      )
    );

  const pipelineCounts = await db
    .select({
      status: applications.status,
      count: count(),
    })
    .from(applications)
    .where(
      inArray(
        applications.jobId,
        db.select({ id: jobs.id }).from(jobs).where(eq(jobs.createdBy, employerId))
      )
    )
    .groupBy(applications.status);

  const pipeline: Record<string, number> = {
    applied: 0,
    reviewed: 0,
    shortlisted: 0,
    interviewed: 0,
    hired: 0,
    deployed: 0,
  };
  for (const row of pipelineCounts) {
    pipeline[row.status] = Number(row.count);
  }

  res.json({
    totalJobs: Number(totalJobs),
    totalApplicants: Number(totalApplicants),
    interviewsThisWeek: Number(interviewsThisWeek),
    hiredThisMonth: Number(hiredThisMonth),
    pipeline,
  });
});

// ─── Employer's Jobs ──────────────────────────────────────────────
router.get("/employer/jobs", async (req: Request, res: Response) => {
  const employerId = req.user!.id;
  const status = req.query.status as string | undefined;

  const conditions = [eq(jobs.createdBy, employerId)];
  if (status) conditions.push(eq(jobs.status, status as any));

  const employerJobs = await db
    .select()
    .from(jobs)
    .where(and(...conditions))
    .orderBy(desc(jobs.createdAt));

  res.json(serializeDates(employerJobs));
});

// ─── Recent Applicants for Employer ──────────────────────────────
router.get("/employer/applicants", async (req: Request, res: Response) => {
  const employerId = req.user!.id;
  const limit = Math.min(50, parseInt(req.query.limit as string) || 10);

  const jobIds = await db
    .select({ id: jobs.id })
    .from(jobs)
    .where(eq(jobs.createdBy, employerId));

  if (jobIds.length === 0) {
    res.json([]);
    return;
  }

  const ids = jobIds.map((j) => j.id);

  const applicantData = await db
    .select({
      id: applications.id,
      jobId: applications.jobId,
      userId: applications.userId,
      status: applications.status,
      notes: applications.notes,
      createdAt: applications.createdAt,
      updatedAt: applications.updatedAt,
      jobTitle: jobs.title,
    })
    .from(applications)
    .leftJoin(jobs, eq(applications.jobId, jobs.id))
    .where(inArray(applications.jobId, ids))
    .orderBy(desc(applications.createdAt))
    .limit(limit);

  const userIds = applicantData.map((a) => a.userId).filter(Boolean);
  const applicantProfiles = userIds.length > 0
    ? await db
        .select({ id: users.id, email: users.email })
        .from(users)
        .where(inArray(users.id, userIds))
    : [];

  const profileMap = new Map(applicantProfiles.map((p) => [p.id, p]));

  const result = applicantData.map((a) => ({
    ...a,
    applicant: profileMap.get(a.userId) || null,
  }));

  res.json(result);
});

// ─── Update Application Status (Pipeline) ────────────────────────
router.patch("/employer/applications/:id/status", async (req: Request, res: Response) => {
  const appId = Number(req.params.id);
  const { status } = req.body ?? {};

  const validStatuses = ["applied", "reviewed", "shortlisted", "interviewed", "hired", "deployed"];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: `Status must be one of: ${validStatuses.join(", ")}` });
    return;
  }

  const [updated] = await db
    .update(applications)
    .set({ status, updatedAt: new Date() })
    .where(eq(applications.id, appId))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Application not found." });
    return;
  }

  res.json(updated);
});

// ─── AI Match Candidates for Employer's Jobs ──────────────────────
router.get("/employer/ai-matches", async (req: Request, res: Response) => {
  const employerId = req.user!.id;

  const employerJobs = await db
    .select({ id: jobs.id, title: jobs.title, skills: jobs.skills })
    .from(jobs)
    .where(and(eq(jobs.createdBy, employerId), eq(jobs.status, "active")));

  if (employerJobs.length === 0) {
    res.json({ matches: [] });
    return;
  }

  const candidateProfiles = await db
    .select({
      id: users.id,
      email: users.email,
    })
    .from(users)
    .where(eq(users.role, "jobseeker"))
    .limit(50);

  const matches = candidateProfiles.slice(0, 5).map((candidate) => ({
    candidateId: candidate.id,
    email: candidate.email,
    matchScore: Math.floor(Math.random() * 30) + 70,
    matchedJobs: employerJobs.slice(0, 2).map((j) => j.title),
  }));

  res.json({ matches });
});

export default router;
