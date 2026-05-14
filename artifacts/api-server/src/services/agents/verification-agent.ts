import { db, discoveredCandidates } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { logger } from "../../lib/logger";
import { openrouter } from "../../lib/openai";
import { eventBus, RecruitmentEventTypes } from "./event-bus";
import { safetyEngine } from "./safety-engine";

export interface VerificationResult {
  authenticityScore: number;
  profileQualityScore: number;
  spamProbability: number;
  fraudProbability: number;
  verificationStatus: "verified" | "suspicious" | "rejected";
  concerns: string[];
  redFlags: string[];
}

class VerificationAgent {
  async verifyCandidate(candidateId: number): Promise<VerificationResult | null> {
    try {
      const [candidate] = await db.select()
        .from(discoveredCandidates)
        .where(eq(discoveredCandidates.id, candidateId))
        .limit(1);

      if (!candidate) return null;

      let result: VerificationResult;

      try {
        const completion = await openrouter().chat.completions.create({
          model: "openrouter/free",
          messages: [
            {
              role: "system",
              content: "You are a verification AI that assesses candidate profile authenticity. Detect spam, fraud, and low-quality profiles. Return ONLY valid JSON.",
            },
            {
              role: "user",
              content: `Verify this candidate profile:

Name: ${candidate.fullName || "Unknown"}
Headline: ${candidate.headline || "N/A"}
Location: ${candidate.location || "N/A"}
Email: ${candidate.email || "N/A"}
Skills: ${JSON.stringify(candidate.skills || [])}
Experience: ${JSON.stringify(((candidate.experience || []) as Array<Record<string, unknown>>).slice(0, 3))}
Education: ${JSON.stringify(((candidate.education || []) as Array<Record<string, unknown>>).slice(0, 2))}
Certifications: ${JSON.stringify(candidate.certifications || [])}
Current Employer: ${candidate.currentEmployer || "N/A"}

Rate on a scale of 0.0 to 1.0:
1. authenticityScore — is this a real person?
2. profileQualityScore — how complete/detailed is the profile?
3. spamProbability — how likely is this a spam profile?
4. fraudProbability — how likely is this a fraudulent profile?

Return ONLY this JSON:
{
  "authenticityScore": 0.0-1.0,
  "profileQualityScore": 0.0-1.0,
  "spamProbability": 0.0-1.0,
  "fraudProbability": 0.0-1.0,
  "verificationStatus": "verified|suspicious|rejected",
  "concerns": ["concern1", "concern2"],
  "redFlags": ["flag1", "flag2"]
}`,
            },
          ],
          temperature: 0.2,
          max_tokens: 800,
        });

        const raw = completion.choices[0].message.content || "{}";
        result = JSON.parse(raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim());

        if (result.fraudProbability > 0.7 || result.spamProbability > 0.8) {
          result.verificationStatus = "rejected";
        } else if (result.authenticityScore < 0.4 || result.spamProbability > 0.5) {
          result.verificationStatus = "suspicious";
        } else {
          result.verificationStatus = "verified";
        }
      } catch {
        const candidateSkills = (candidate.skills || []) as string[];
        const candidateExperience = (candidate.experience || []) as Array<Record<string, unknown>>;
        const candidateEducation = (candidate.education || []) as Array<Record<string, unknown>>;
        const hasSkills = candidateSkills.length > 0;
        const hasExperience = candidateExperience.length > 0;
        const hasEducation = candidateEducation.length > 0;

        const completeness = [hasSkills, hasExperience, hasEducation, !!candidate.headline, !!candidate.location]
          .filter(Boolean).length / 5;

        result = {
          authenticityScore: completeness > 0.6 ? 0.8 : 0.5,
          profileQualityScore: completeness,
          spamProbability: 0.1,
          fraudProbability: 0.1,
          verificationStatus: completeness > 0.6 ? "verified" : "suspicious",
          concerns: completeness < 0.4 ? ["Incomplete profile"] : [],
          redFlags: [],
        };
      }

      await db.update(discoveredCandidates)
        .set({
          authenticityScore: result.authenticityScore,
          profileQualityScore: result.profileQualityScore,
          spamProbability: result.spamProbability,
          fraudProbability: result.fraudProbability,
          verificationStatus: result.verificationStatus,
          status: result.verificationStatus === "verified" ? "verified" : "discovered",
          updatedAt: new Date(),
        })
        .where(eq(discoveredCandidates.id, candidateId));

      if (result.verificationStatus === "suspicious" || result.verificationStatus === "rejected") {
        await safetyEngine.raiseFlag({
          employerId: candidate.matchedByEmployerId || undefined,
          flagType: result.verificationStatus === "rejected" ? "fraud_detection" as any : "data_quality" as any,
          severity: result.verificationStatus === "rejected" ? "critical" : "warning",
          title: `${result.verificationStatus === "rejected" ? "Fraud" : "Suspicious"} candidate detected`,
          description: `Candidate "${candidate.fullName || candidate.email}" flagged: ${result.concerns.join("; ")}`,
          affectedAgent: "verification-agent",
          affectedEntityId: candidateId,
          affectedEntityType: "discovered_candidate",
          metadata: { verificationResult: result },
        });
      }

      await eventBus.emitEvent({
        type: RecruitmentEventTypes.AGENT_ACTION,
        source: "verification-agent",
        payload: { candidateId, verificationStatus: result.verificationStatus, authenticityScore: result.authenticityScore },
        timestamp: new Date(),
      });

      return result;
    } catch (err) {
      logger.error({ err, candidateId }, "Verification agent failed");
      return null;
    }
  }

  async batchVerify(candidateIds: number[]): Promise<number> {
    let verified = 0;
    for (const id of candidateIds) {
      const result = await this.verifyCandidate(id);
      if (result) verified++;
    }
    return verified;
  }
}

export const verificationAgent = new VerificationAgent();
