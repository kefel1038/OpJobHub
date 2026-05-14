import { db, jobs, users, applications, profiles } from "@workspace/db";
import { eq, and, desc, sql, not, inArray } from "drizzle-orm";
import { logger } from "../../lib/logger";
import { openrouter } from "../../lib/openai";
import { eventBus, RecruitmentEventTypes } from "./event-bus";
import { recruitmentMemory } from "./memory";

const SYSTEM_PROMPT = `You are OpJobHub's Sourcing Agent — an autonomous recruitment AI.
Your role is to find the best candidates for open positions.
You analyze job requirements and generate candidate search criteria.
Return ONLY valid JSON.`;

export class SourcingAgent {
  async sourceForJob(jobId: number, employerId: number): Promise<{
    sourcedCount: number;
    candidates: Array<{ name: string; email: string; matchReason: string; score: number }>;
  }> {
    try {
      const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
      if (!job) throw new Error(`Job ${jobId} not found`);

      const employerBrief = await recruitmentMemory.generateEmployerBrief(employerId);

      let searchCriteria: { requiredSkills: string[]; preferredRoles: string[]; experienceLevel: string } = {
        requiredSkills: [],
        preferredRoles: [],
        experienceLevel: "mid",
      };

      try {
        const completion = await openrouter().chat.completions.create({
          model: "openrouter/free",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: `Analyze this job posting and generate candidate search criteria:

Job Title: ${job.title}
Description: ${(job.description || "").slice(0, 1500)}
Required Skills: ${JSON.stringify(job.skills || [])}
Experience Level: ${job.experienceLevel || "Not specified"}
Industry: ${job.industry || "Not specified"}
Location: ${job.location || "Not specified"}

${employerBrief}

Respond with ONLY this JSON:
{
  "requiredSkills": ["skill1", "skill2", ...] (extract and expand on required skills),
  "preferredRoles": ["role1", "role2", ...] (related job titles to search for),
  "experienceLevel": "entry|mid|senior|lead"
}`,
            },
          ],
          temperature: 0.3,
          max_tokens: 500,
        });

        const raw = completion.choices[0].message.content || "{}";
        searchCriteria = JSON.parse(stripJsonFences(raw));
      } catch {
        searchCriteria.requiredSkills = (job.skills || []) as string[];
      }

      const skillFilter = searchCriteria.requiredSkills.slice(0, 5);

      const existingApplicants = await db
        .select({ userId: applications.userId })
        .from(applications)
        .where(eq(applications.jobId, jobId));

      const existingIds = existingApplicants.map((a) => a.userId).filter(Boolean);
      const excludeCondition = existingIds.length > 0 ? not(inArray(users.id, existingIds)) : sql`1=1`;

      let candidates: Array<{ name: string; email: string; matchReason: string; score: number }> = [];

      if (skillFilter.length > 0) {
        const candidateProfiles = await db
          .select({
            id: users.id,
            email: users.email,
            fullName: profiles.fullName,
            skills: profiles.skills,
            headline: profiles.headline,
          })
          .from(users)
          .innerJoin(profiles, eq(profiles.userId, users.id))
          .where(and(eq(users.role, "jobseeker"), excludeCondition))
          .orderBy(desc(users.createdAt))
          .limit(100);

        for (const profile of candidateProfiles) {
          const profileSkills: string[] = (profile.skills || []).map((s: string) => s.toLowerCase());
          const matchedSkills = skillFilter.filter((s) =>
            profileSkills.some((ps) => ps.includes(s.toLowerCase()) || s.toLowerCase().includes(ps))
          );

          if (matchedSkills.length > 0) {
            const score = Math.round((matchedSkills.length / skillFilter.length) * 100);
            candidates.push({
              name: profile.fullName || profile.email.split("@")[0],
              email: profile.email,
              matchReason: `${matchedSkills.length} matching skills: ${matchedSkills.slice(0, 3).join(", ")}`,
              score,
            });
          }
        }
      }

      candidates.sort((a, b) => b.score - a.score);
      const topCandidates = candidates.slice(0, 15);

      await eventBus.emitEvent({
        type: RecruitmentEventTypes.AGENT_ACTION,
        source: "sourcing-agent",
        payload: { jobId, employerId, sourcedCount: topCandidates.length, topScores: topCandidates.slice(0, 3).map((c) => c.score) },
        timestamp: new Date(),
      });

      logger.info({ jobId, employerId, sourcedCount: topCandidates.length }, "Sourcing agent completed");

      return { sourcedCount: topCandidates.length, candidates: topCandidates };
    } catch (error) {
      logger.error({ err: error, jobId }, "Sourcing agent failed");
      return { sourcedCount: 0, candidates: [] };
    }
  }
}

function stripJsonFences(raw: string): string {
  return raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
}

export const sourcingAgent = new SourcingAgent();
