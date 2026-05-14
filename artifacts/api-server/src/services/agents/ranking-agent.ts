import { db, jobs, applications, users, profiles, jobEmbeddings } from "@workspace/db";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { logger } from "../../lib/logger";
import { openrouter, getEmbedding } from "../../lib/openai";
import { eventBus, RecruitmentEventTypes } from "./event-bus";
import { recruitmentMemory } from "./memory";

const SYSTEM_PROMPT = `You are OpJobHub's Ranking Agent — an autonomous candidate evaluation AI.
You analyze candidates against job requirements and produce detailed fit scores.
Be objective, data-driven, and specific.
Return ONLY valid JSON.`;

export class RankingAgent {
  async rankCandidatesForJob(jobId: number, employerId: number): Promise<{
    rankedCount: number;
    rankings: Array<{ candidateId: number; name: string; score: number; reasoning: string; recommendation: string }>;
  }> {
    try {
      const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
      if (!job) throw new Error(`Job ${jobId} not found`);

      const applicants = await db
        .select({
          applicationId: applications.id,
          userId: applications.userId,
          status: applications.status,
          notes: applications.notes,
        })
        .from(applications)
        .where(and(eq(applications.jobId, jobId), inArray(applications.status, ["applied", "reviewed", "shortlisted"])))
        .limit(50);

      if (applicants.length === 0) {
        return { rankedCount: 0, rankings: [] };
      }

      const userIds = applicants.map((a) => a.userId).filter(Boolean);
      const candidateProfiles = await db
        .select({ id: users.id, email: users.email, fullName: profiles.fullName, skills: profiles.skills, headline: profiles.headline, experience: profiles.experience, education: profiles.education })
        .from(users)
        .innerJoin(profiles, eq(profiles.userId, users.id))
        .where(inArray(users.id, userIds));

      const employerBrief = await recruitmentMemory.generateEmployerBrief(employerId);
      const profileMap = new Map(candidateProfiles.map((p) => [p.id, p]));

      const rankings: Array<{ candidateId: number; name: string; score: number; reasoning: string; recommendation: string }> = [];

      for (const applicant of applicants) {
        const profile = profileMap.get(applicant.userId);
        if (!profile) continue;

        let aiScore: { overallScore: number; reasoning: string; recommendation: string; strengths: string[]; concerns: string[] } = {
          overallScore: 50,
          reasoning: "Insufficient data",
          recommendation: "review",
          strengths: [],
          concerns: [],
        };

        try {
          const completion = await openrouter().chat.completions.create({
            model: "openrouter/free",
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              {
                role: "user",
                content: `Evaluate this candidate for the following role:

Job Title: ${job.title}
Job Description: ${(job.description || "").slice(0, 1000)}
Required Skills: ${JSON.stringify(job.skills || [])}
Experience Required: ${job.experienceLevel || "Not specified"}

Candidate Profile:
Name: ${profile.fullName || profile.email}
Headline: ${profile.headline || "Not specified"}
Skills: ${JSON.stringify(profile.skills || [])}
Experience: ${JSON.stringify((Array.isArray(profile.experience) ? profile.experience : []).slice(0, 3))}
Education: ${JSON.stringify((Array.isArray(profile.education) ? profile.education : []).slice(0, 2))}

${employerBrief}

Respond with ONLY this JSON:
{
  "overallScore": 0-100,
  "reasoning": "2-3 sentence evaluation",
  "recommendation": "strong_yes|yes|maybe|no",
  "strengths": ["strength1", "strength2", "strength3"],
  "concerns": ["concern1", "concern2"]
}`,
              },
            ],
            temperature: 0.3,
            max_tokens: 500,
          });

          const raw = completion.choices[0].message.content || "{}";
          aiScore = JSON.parse(stripJsonFences(raw));
        } catch {
          const jobSkills: string[] = (job.skills || []).map((s: string) => s.toLowerCase());
          const candidateSkills: string[] = (profile.skills || []).map((s: string) => s.toLowerCase());
          const matchedSkills = jobSkills.filter((js) => candidateSkills.includes(js));
          const score = jobSkills.length > 0 ? Math.round((matchedSkills.length / jobSkills.length) * 100) : 50;
          aiScore = {
            overallScore: score,
            reasoning: `${matchedSkills.length}/${jobSkills.length} skills matched`,
            recommendation: score >= 80 ? "strong_yes" : score >= 60 ? "yes" : score >= 40 ? "maybe" : "no",
            strengths: matchedSkills.slice(0, 3),
            concerns: jobSkills.filter((js) => !candidateSkills.includes(js)).slice(0, 3),
          };
        }

        rankings.push({
          candidateId: applicant.userId,
          name: profile.fullName || profile.email.split("@")[0],
          score: aiScore.overallScore,
          reasoning: aiScore.reasoning,
          recommendation: aiScore.recommendation,
        });

        await db
          .update(applications)
          .set({
            notes: `AI Ranked: ${aiScore.overallScore}/100 — ${aiScore.reasoning}\nRecommendation: ${aiScore.recommendation}\nStrengths: ${(aiScore.strengths || []).join(", ")}\nConcerns: ${(aiScore.concerns || []).join(", ")}`,
            metadata: sql`jsonb_set(COALESCE(metadata, '{}'::jsonb), '{aiRanking}', ${JSON.stringify({
              score: aiScore.overallScore,
              recommendation: aiScore.recommendation,
              strengths: aiScore.strengths,
              concerns: aiScore.concerns,
              rankedAt: new Date().toISOString(),
            })}::jsonb)`,
          })
          .where(eq(applications.id, applicant.applicationId));
      }

      rankings.sort((a, b) => b.score - a.score);

      await eventBus.emitEvent({
        type: RecruitmentEventTypes.CANDIDATE_SCORED,
        source: "ranking-agent",
        payload: { jobId, employerId, rankedCount: rankings.length, topScore: rankings[0]?.score || 0 },
        timestamp: new Date(),
      });

      logger.info({ jobId, rankedCount: rankings.length }, "Ranking agent completed");

      return { rankedCount: rankings.length, rankings };
    } catch (error) {
      logger.error({ err: error, jobId }, "Ranking agent failed");
      return { rankedCount: 0, rankings: [] };
    }
  }
}

function stripJsonFences(raw: string): string {
  return raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
}

export const rankingAgent = new RankingAgent();
