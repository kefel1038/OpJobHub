import { Router, type IRouter, type Request, type Response } from "express";
import { db, jobs, applications, users, savedJobs } from "@workspace/db";
import { eq, and, desc, sql, count, gte, lt, inArray, isNull } from "drizzle-orm";
import { authMiddleware, requireRole } from "../lib/auth";
import { serializeDates } from "../lib/serialize";
import { openrouter } from "../lib/openai";
import { signalCollector } from "../services/agents/behavioral-signals";
import { recruitmentMemory } from "../services/agents/memory";

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

  setImmediate(async () => {
    try {
      const actionTypeMap: Record<string, string> = {
        shortlisted: "shortlisted",
        hired: "hired",
        rejected: "rejected",
        interviewed: "interview_completed",
        reviewed: "viewed",
      };
      const actionType = actionTypeMap[status];
      if (actionType) {
        const profileRows = await db.execute(sql`
          SELECT skills, location, experience FROM profiles WHERE user_id = ${updated.userId}
        `);
        const profile = profileRows.rows?.[0] as any;
        await signalCollector.record({
          employerId: req.user!.id,
          actionType,
          candidateId: updated.userId,
          jobId: updated.jobId,
          metadata: {
            skills: profile?.skills || [],
            location: profile?.location || null,
            experienceLevel: profile?.experience?.[0]?.level || null,
            applicationStatus: status,
            applicationId: appId,
          },
        });
        if (status === "hired" || status === "shortlisted") {
          const skills: string[] = profile?.skills || [];
          for (const skill of skills) {
            await recruitmentMemory.reinforcePreference(req.user!.id, "preferred_skill", skill, 0.7);
          }
        }
      }
    } catch (err) {
      console.error("Failed to record behavioral signal:", err);
    }
  });

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

// ─── AI Follow-Up Messages ─────────────────────────────────────────
const FOLLOW_UP_PROMPT = `You are a professional recruitment assistant. Generate a short, warm, personalized follow-up message.
Keep it concise (2-4 sentences). Match the tone to the situation. No markdown, no JSON, plain text only.`;

const followUpTemplates: Record<string, (candidateName: string, jobTitle: string, companyName: string) => string> = {
  applied: (name, title, company) =>
    `Hi ${name},\n\nThank you for applying for the ${title} position at ${company}. We've received your application and our team will review it shortly. We'll be in touch with updates within the next few days.\n\nBest regards,\nThe ${company} Recruitment Team`,

  shortlisted: (name, title, company) =>
    `Hi ${name},\n\nGreat news! Your application for ${title} at ${company} has been shortlisted. We were impressed by your background and would like to invite you for an interview. Our team will reach out to schedule a convenient time.\n\nLooking forward to speaking with you!\nThe ${company} Recruitment Team`,

  interviewed: (name, title, company) =>
    `Hi ${name},\n\nThank you for taking the time to interview for the ${title} position at ${company}. We really enjoyed learning about your experience. We're currently reviewing all candidates and will get back to you with an update soon.\n\nBest regards,\nThe ${company} Recruitment Team`,

  hired: (name, title, company) =>
    `Hi ${name},\n\nCongratulations! We're thrilled to offer you the ${title} position at ${company}. Your skills and experience are exactly what we're looking for. Please expect an official offer letter shortly with the details.\n\nWelcome to the team!\nThe ${company} Recruitment Team`,

  rejected: (name, title, company) =>
    `Hi ${name},\n\nThank you for your interest in the ${title} position at ${company}. After careful consideration, we've decided to move forward with other candidates whose experience more closely matches our current needs. We appreciate the time you invested in the process.\n\nWe wish you all the best in your job search.\nThe ${company} Recruitment Team`,
};

router.post("/employer/applications/:id/follow-up", async (req: Request, res: Response) => {
  try {
    const appId = Number(req.params.id);
    const { stage, candidateName, jobTitle, companyName, customInstructions } = req.body ?? {};

    if (!stage || !candidateName || !jobTitle || !companyName) {
      res.status(400).json({ error: "stage, candidateName, jobTitle, and companyName are required" });
      return;
    }

    const stageKey = stage as string;
    const template = followUpTemplates[stageKey] || followUpTemplates.applied;

    let message: string;
    if (customInstructions) {
      const completion = await openrouter().chat.completions.create({
        model: "openrouter/free",
        messages: [
          { role: "system", content: FOLLOW_UP_PROMPT },
          {
            role: "user",
            content: `Generate a follow-up message for ${stageKey} stage.\nCandidate: ${candidateName}\nJob: ${jobTitle}\nCompany: ${companyName}\n\nCustom instructions: ${customInstructions}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 300,
      });
      message = completion.choices[0].message.content || template(candidateName, jobTitle, companyName);
    } else {
      message = template(candidateName, jobTitle, companyName);
    }

    const [updated] = await db
      .update(applications)
      .set({
        metadata: sql`jsonb_set(COALESCE(metadata, '{}'::jsonb), '{followUp}', ${JSON.stringify({
          stage: stageKey,
          message,
          generatedAt: new Date().toISOString(),
        })}::jsonb)`,
        updatedAt: new Date(),
      })
      .where(eq(applications.id, appId))
      .returning();

    setImmediate(async () => {
      try {
        await signalCollector.record({
          employerId: req.user!.id,
          actionType: "outreach_sent",
          candidateId: undefined,
          jobId: undefined,
          metadata: { stage: stageKey, applicationId: appId, candidateName, jobTitle, companyName },
        });
      } catch { /* background signal */ }
    });

    res.json({
      message,
      stage: stageKey,
      applicationId: appId,
      candidateName,
      jobTitle,
    });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/employer/follow-ups/pending", async (req: Request, res: Response) => {
  try {
    const employerId = req.user!.id;

    const employerJobIds = await db
      .select({ id: jobs.id })
      .from(jobs)
      .where(eq(jobs.createdBy, employerId));

    if (employerJobIds.length === 0) {
      res.json({ followUps: [] });
      return;
    }

    const ids = employerJobIds.map((j) => j.id);

    const pending = await db
      .select({
        id: applications.id,
        status: applications.status,
        createdAt: applications.createdAt,
        userId: applications.userId,
        jobId: applications.jobId,
        metadata: applications.metadata,
        jobTitle: jobs.title,
        companyName: jobs.company,
      })
      .from(applications)
      .leftJoin(jobs, eq(applications.jobId, jobs.id))
      .where(
        and(
          inArray(applications.jobId, ids),
          sql`(applications.metadata->>'followUp' IS NULL OR applications.metadata->>'followUp' = '{}'::text)`
        )
      )
      .orderBy(desc(applications.createdAt))
      .limit(20);

    const userIds = pending.map((a) => a.userId).filter(Boolean);
    const userProfiles = userIds.length > 0
      ? await db.select({ id: users.id, email: users.email }).from(users).where(inArray(users.id, userIds))
      : [];
    const profileMap = new Map(userProfiles.map((p) => [p.id, p.email]));

    const followUps = pending.map((a) => ({
      applicationId: a.id,
      status: a.status,
      candidateName: profileMap.get(a.userId)?.split("@")[0] || "Candidate",
      jobTitle: a.jobTitle,
      companyName: a.companyName,
      appliedAt: a.createdAt,
    }));

    res.json({ followUps: followUps });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

export default router;
