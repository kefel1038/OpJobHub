import { Router, type Request, type Response } from "express";
import { db, jobs, applications, users, profiles } from "@workspace/db";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { authMiddleware } from "../lib/auth";
import { logger } from "../lib/logger";

const router = Router();

function scoreProfileAgainstJob(profile: any, job: any) {
  const candidateSkills = (profile.skills || []).map((s: string) => s.toLowerCase().trim());
  const jobSkills = ((job.skills ?? []) as string[]).map((s: string) => s.toLowerCase().trim());

  if (candidateSkills.length === 0 && jobSkills.length === 0) return { score: 50, matchedSkills: [], skillGaps: [] };

  const matchedSkills = candidateSkills.filter((cs: string) => jobSkills.includes(cs));
  const skillGaps = jobSkills.filter((js: string) => !candidateSkills.includes(js));

  const skillScore = jobSkills.length > 0
    ? Math.round((matchedSkills.length / Math.max(jobSkills.length, 1)) * 60)
    : 30;

  const headline = (profile.headline || "").toLowerCase();
  const title = (job.title || "").toLowerCase();
  const titleWords = title.split(/\s+/);
  const headlineMatch = titleWords.filter((w: string) => w.length > 2 && headline.includes(w)).length;
  const titleScore = Math.min(20, Math.round((headlineMatch / Math.max(titleWords.length, 1)) * 20));

  const locCandidate = (profile.location || "").toLowerCase();
  const locJob = (job.location || "").toLowerCase();
  const locationScore = (locCandidate && locJob && (locCandidate.includes(locJob) || locJob.includes(locCandidate)))
    ? 10 : 5;

  const expYears = profile.experience?.length || 0;
  const expScore = Math.min(10, expYears * 2);

  const totalScore = Math.min(100, skillScore + titleScore + locationScore + expScore);

  return {
    score: totalScore,
    matchedSkills,
    skillGaps: skillGaps.slice(0, 8),
    reasons: [
      ...(matchedSkills.length > 0 ? [`${matchedSkills.length} matching skills found`] : []),
      ...(titleScore > 10 ? ["Headline aligns with role"] : []),
      ...(locationScore === 10 ? ["Location matches"] : []),
      ...(expScore > 5 ? [`${expYears}+ years experience`] : []),
    ],
  };
}

router.post("/extension/score-candidate", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const profile = req.body;

    if (!profile || !profile.name) {
      res.status(400).json({ error: "Candidate profile with name is required" });
      return;
    }

    const employerJobs = await db
      .select({ id: jobs.id, title: jobs.title, skills: jobs.skills, location: jobs.location })
      .from(jobs)
      .where(and(eq(jobs.createdBy, userId), eq(jobs.status, "active")))
      .orderBy(desc(jobs.createdAt))
      .limit(20);

    if (employerJobs.length === 0) {
      res.json({
        score: 0,
        matchedSkills: [],
        skillGaps: [],
        recommendedRole: "",
        reasons: ["No active job postings found. Post a job to enable candidate scoring."],
      });
      return;
    }

    const scored = employerJobs.map((job) => {
      const result = scoreProfileAgainstJob(profile, job);
      return { ...result, jobId: job.id, jobTitle: job.title };
    });

    scored.sort((a, b) => b.score - a.score);
    const best = scored[0];

    res.json({
      score: best.score,
      matchedSkills: best.matchedSkills,
      skillGaps: best.skillGaps,
      recommendedRole: best.jobTitle,
      reasons: best.reasons,
    });
  } catch (error: unknown) {
    logger.error({ err: error }, "Error in score-candidate");
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.post("/extension/save-candidate", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { profile, matchScore } = req.body;

    if (!profile || !profile.name) {
      res.status(400).json({ error: "Candidate profile is required" });
      return;
    }

    const [candidate] = await db
      .insert(users)
      .values({
        email: `candidate_${Date.now()}@sourced.opjobhub.com`,
        password: "",
        role: "jobseeker",
      })
      .returning();

    const [candidateProfile] = await db
      .insert(profiles)
      .values({
        userId: candidate.id,
        fullName: profile.name,
        headline: profile.headline,
        location: profile.location,
        avatarUrl: profile.photoUrl,
        skills: profile.skills,
        experience: profile.experience,
        education: profile.education,
        metadata: { sourceUrl: profile.profileUrl, source: "extension-linkedin", importedAt: new Date().toISOString() },
      })
      .returning();

    const bestJobs = await db
      .select({ id: jobs.id, title: jobs.title })
      .from(jobs)
      .where(and(eq(jobs.createdBy, userId), eq(jobs.status, "active")))
      .limit(1);

    const [application] = await db
      .insert(applications)
      .values({
        userId: candidate.id,
        jobId: bestJobs[0]?.id || 0,
        status: "sourced",
        notes: `Sourced via OpJobHub browser extension. AI Match Score: ${matchScore}%`,
      })
      .returning();

    res.json({
      candidateId: candidate.id,
      pipelineId: application.id,
      status: "sourced",
    });
  } catch (error: unknown) {
    logger.error({ err: error }, "Error in save-candidate");
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/extension/auth-check", authMiddleware, async (req: Request, res: Response) => {
  res.json({ authenticated: true, user: { email: req.user!.email, role: req.user!.role } });
});

router.get("/extension/employer-jobs", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const employerJobs = await db
      .select({ id: jobs.id, title: jobs.title, skills: jobs.skills })
      .from(jobs)
      .where(and(eq(jobs.createdBy, userId), eq(jobs.status, "active")))
      .orderBy(desc(jobs.createdAt))
      .limit(50);

    res.json(employerJobs);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

export default router;
