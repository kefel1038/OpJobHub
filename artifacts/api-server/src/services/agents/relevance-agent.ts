import { db, discoveredCandidates, jobs, candidateEnrichments, intentSignals, opportunityGraphEdges } from "@workspace/db";
import { eq, and, sql, inArray, gte, lte } from "drizzle-orm";
import { logger } from "../../lib/logger";
import { openrouter } from "../../lib/openai";
import { eventBus, RecruitmentEventTypes } from "./event-bus";
import { recruitmentMemory } from "./memory";

export interface MatchResult {
  candidateId: number;
  jobId: number;
  score: number;
  skillMatch: number;
  locationMatch: number;
  experienceMatch: number;
  intentMatch: number;
  reasoning: string;
  recommendation: string;
}

const FALLBACK_RECOMMENDATIONS = [
  { minScore: 85, recommendation: "strong_yes" },
  { minScore: 70, recommendation: "yes" },
  { minScore: 50, recommendation: "maybe" },
  { minScore: 0, recommendation: "no" },
];

class RelevanceAgent {
  async matchCandidateToJob(candidateId: number, jobId: number, employerId: number): Promise<MatchResult | null> {
    try {
      const [candidate] = await db.select()
        .from(discoveredCandidates)
        .where(eq(discoveredCandidates.id, candidateId))
        .limit(1);

      const [job] = await db.select()
        .from(jobs)
        .where(eq(jobs.id, jobId))
        .limit(1);

      if (!candidate || !job) return null;

      const jobSkills: string[] = (job.skills || []).map((s: string) => s.toLowerCase());
      const candidateSkills: string[] = [
        ...(candidate.normalizedSkills || []).map((s: string) => s.toLowerCase()),
        ...(candidate.skills || []).map((s: string) => s.toLowerCase()),
      ];
      const uniqueSkills = [...new Set(candidateSkills)];

      const matchedSkills = jobSkills.filter(js =>
        uniqueSkills.some(cs => cs.includes(js) || js.includes(cs))
      );
      const skillMatch = jobSkills.length > 0 ? (matchedSkills.length / jobSkills.length) : 0;

      const locationMatch = this.calculateLocationMatch(job.location, candidate.location);
      const candidateExperience = (candidate.experience || []) as Array<Record<string, unknown>>;
      const experienceMatch = this.calculateExperienceMatch(
        job.experienceLevel || "",
        candidate.experienceLevel || "",
        candidateExperience,
      );

      const candidateIntentSignals = await db.select({ signalType: intentSignals.signalType })
        .from(intentSignals)
        .where(and(
          eq(intentSignals.candidateId, candidateId),
          eq(intentSignals.signalType, "relocation_intent"),
        ));

      const hasRelocationIntent = candidateIntentSignals.length > 0;
      const intentMatch = hasRelocationIntent && !this.locationMatches(job.location, candidate.location) ? 0.6 : 0.9;

      const employerPrefs = await recruitmentMemory.getPreferences(employerId);
      const prefBonus = this.calculatePreferenceBonus(employerPrefs, candidate, matchedSkills);

      const rawScore = ((skillMatch * 0.4) + (locationMatch * 0.2) + (experienceMatch * 0.2) + (intentMatch * 0.1) + prefBonus) * 100;
      const score = Math.round(Math.min(100, Math.max(0, rawScore)));

      let reasoning: string;
      let recommendation: string;

      try {
        const completion = await openrouter().chat.completions.create({
          model: "openrouter/free",
          messages: [
            { role: "system", content: "You evaluate candidate-job fit for recruitment. Return ONLY valid JSON." },
            {
              role: "user",
              content: `Evaluate fit between candidate and job:

Job: ${job.title} at ${job.company}
Job Location: ${job.location}
Job Skills: ${JSON.stringify(job.skills || [])}

Candidate: ${candidate.fullName || "Unknown"}
Location: ${candidate.location}
Skills: ${JSON.stringify(uniqueSkills)}
Experience: ${JSON.stringify(((candidate.experience || []) as Array<Record<string, unknown>>).slice(0, 2))}

Match Score: ${score}/100
Skills Matched: ${matchedSkills.slice(0, 5).join(", ")}

Return ONLY JSON:
{
  "reasoning": "1-2 sentence explanation of fit",
  "recommendation": "strong_yes|yes|maybe|no"
}`,
            },
          ],
          temperature: 0.3,
          max_tokens: 500,
        });

        const raw = completion.choices[0].message.content || "{}";
        const parsed = JSON.parse(raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim());
        reasoning = parsed.reasoning || `${matchedSkills.length} skills matched, ${experienceMatch > 0.5 ? "experience aligns" : "experience gap"}`;
        recommendation = parsed.recommendation || "maybe";
      } catch {
        const matchPct = Math.round(skillMatch * 100);
        reasoning = `${matchedSkills.length}/${jobSkills.length} skills matched (${matchPct}%). ${locationMatch > 0.5 ? "Location compatible." : "Location mismatch."}`;
        const found = FALLBACK_RECOMMENDATIONS.find(r => score >= r.minScore);
        recommendation = found ? found.recommendation : "no";
      }

      await db.update(discoveredCandidates)
        .set({
          matchedJobId: jobId,
          status: "matched",
          updatedAt: new Date(),
        })
        .where(eq(discoveredCandidates.id, candidateId));

      await eventBus.emitEvent({
        type: RecruitmentEventTypes.CANDIDATE_SCORED,
        source: "relevance-agent",
        payload: { candidateId, jobId, employerId, score, recommendation },
        timestamp: new Date(),
      });

      return {
        candidateId,
        jobId,
        score,
        skillMatch: Math.round(skillMatch * 100),
        locationMatch: Math.round(locationMatch * 100),
        experienceMatch: Math.round(experienceMatch * 100),
        intentMatch: Math.round(intentMatch * 100),
        reasoning,
        recommendation,
      };
    } catch (err) {
      logger.error({ err, candidateId, jobId }, "Relevance agent failed");
      return null;
    }
  }

  async batchMatch(candidateIds: number[], jobId: number, employerId: number): Promise<MatchResult[]> {
    const results: MatchResult[] = [];
    for (const candidateId of candidateIds) {
      const result = await this.matchCandidateToJob(candidateId, jobId, employerId);
      if (result) results.push(result);
    }
    return results.sort((a, b) => b.score - a.score);
  }

  async findBestMatchesForJob(jobId: number, employerId: number, limit = 20): Promise<MatchResult[]> {
    const verifiedCandidates = await db.select({ id: discoveredCandidates.id })
      .from(discoveredCandidates)
      .where(and(
        eq(discoveredCandidates.matchedByEmployerId, employerId),
        eq(discoveredCandidates.verificationStatus, "verified"),
        sql`${discoveredCandidates.status} IN ('verified', 'enriched', 'matched')`,
      ))
      .orderBy(sql`${discoveredCandidates.profileQualityScore} DESC`)
      .limit(limit);

    const results: MatchResult[] = [];
    for (const c of verifiedCandidates) {
      const result = await this.matchCandidateToJob(c.id, jobId, employerId);
      if (result) results.push(result);
    }
    return results.sort((a, b) => b.score - a.score);
  }

  private calculateLocationMatch(jobLocation?: string | null, candidateLocation?: string | null): number {
    if (!jobLocation || !candidateLocation) return 0.5;
    const jl = jobLocation.toLowerCase();
    const cl = candidateLocation.toLowerCase();

    if (jl.includes(cl) || cl.includes(jl)) return 1.0;

    const countries: Record<string, string[]> = {
      qatar: ["doha", "al wakrah", "al khor"],
      uae: ["dubai", "abu dhabi", "sharjah"],
      saudi: ["riyadh", "jeddah", "dammam"],
    };
    for (const [country, cities] of Object.entries(countries)) {
      if ((jl.includes(country) && cities.some(c => cl.includes(c))) ||
          (cl.includes(country) && cities.some(c => jl.includes(c)))) {
        return 0.8;
      }
    }

    return 0.3;
  }

  private locationMatches(jobLocation?: string | null, candidateLocation?: string | null): boolean {
    return this.calculateLocationMatch(jobLocation, candidateLocation) > 0.5;
  }

  private calculateExperienceMatch(jobLevel: string, candidateLevel: string, experience: Array<Record<string, unknown>> | null | undefined): number {
    const levels = ["entry", "junior", "mid", "senior", "lead", "executive"];
    const jobIdx = levels.indexOf(jobLevel.toLowerCase());
    const candIdx = levels.indexOf(candidateLevel.toLowerCase());

    if (jobIdx === -1 || candIdx === -1) {
      const totalYears = (experience || []).reduce((sum, exp) => {
        const duration = (exp.duration as string) || "";
        return sum + (parseInt(duration.match(/(\d+)/)?.[1] || "0") || 1);
      }, 0);
      if (totalYears >= 8) return 0.8;
      if (totalYears >= 4) return 0.6;
      if (totalYears >= 1) return 0.4;
      return 0.2;
    }

    const diff = Math.abs(jobIdx - candIdx);
    if (diff === 0) return 1.0;
    if (diff === 1) return 0.7;
    if (diff === 2) return 0.4;
    return 0.2;
  }

  private calculatePreferenceBonus(employerPrefs: Array<{ key: string; value: string; confidence: number }>, candidate: any, matchedSkills: string[]): number {
    let bonus = 0;
    for (const pref of employerPrefs) {
      if (pref.key === "industry" && candidate.industry?.toLowerCase() === pref.value.toLowerCase()) {
        bonus += pref.confidence * 0.1;
      }
      if (pref.key === "location" && candidate.location?.toLowerCase() === pref.value.toLowerCase()) {
        bonus += pref.confidence * 0.08;
      }
      if (pref.key === "skill" && matchedSkills.some(s => s.toLowerCase() === pref.value.toLowerCase())) {
        bonus += pref.confidence * 0.05;
      }
    }
    return Math.min(0.2, bonus);
  }
}

export const relevanceAgent = new RelevanceAgent();
