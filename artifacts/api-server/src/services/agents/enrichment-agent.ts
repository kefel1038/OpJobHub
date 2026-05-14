import { db, discoveredCandidates, candidateEnrichments } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { logger } from "../../lib/logger";
import { openrouter } from "../../lib/openai";
import { eventBus, RecruitmentEventTypes } from "./event-bus";

const ENRICHMENT_PROMPT = `You are OpJobHub's Enrichment Agent — an AI that enriches candidate profiles.
Analyze the candidate data and add inferred skills, normalize experience,
detect languages, assess migration likelihood, and classify industry.
Return ONLY valid JSON.`;

export interface EnrichmentResult {
  normalizedSkills: string[];
  experienceLevel: string;
  industry: string;
  inferredSkills: string[];
  missingSkills: string[];
  migrationLikelihood: number;
  sponsorshipReadiness: number;
  languageProficiencies: Array<{ language: string; level: string }>;
  careerStage: string;
  recommendedRoles: string[];
}

class EnrichmentAgent {
  async enrichCandidate(candidateId: number): Promise<EnrichmentResult | null> {
    try {
      const [candidate] = await db.select()
        .from(discoveredCandidates)
        .where(eq(discoveredCandidates.id, candidateId))
        .limit(1);

      if (!candidate) return null;

      let enrichment: EnrichmentResult | null = null;

      try {
        const completion = await openrouter().chat.completions.create({
          model: "openrouter/free",
          messages: [
            { role: "system", content: ENRICHMENT_PROMPT },
            {
              role: "user",
              content: `Enrich this candidate profile:

Name: ${candidate.fullName || "Unknown"}
Headline: ${candidate.headline || "N/A"}
Location: ${candidate.location || "N/A"}
Skills: ${JSON.stringify(candidate.skills || [])}
Experience: ${JSON.stringify(((candidate.experience || []) as Array<Record<string, unknown>>).slice(0, 3))}
Education: ${JSON.stringify(((candidate.education || []) as Array<Record<string, unknown>>).slice(0, 2))}
Certifications: ${JSON.stringify(candidate.certifications || [])}
Languages: ${JSON.stringify(candidate.languages || [])}
Current Employer: ${candidate.currentEmployer || "N/A"}
Profile Summary: ${(candidate.profileSummary || "").slice(0, 500)}

Return ONLY this JSON:
{
  "normalizedSkills": ["skill1", "skill2", ...] (normalized/formatted skill names),
  "experienceLevel": "entry|junior|mid|senior|lead|executive",
  "industry": "most likely industry",
  "inferredSkills": ["skill1", "skill2", ...] (skills implied by experience but not listed),
  "missingSkills": ["skill1", "skill2", ...] (gaps for typical roles in their industry),
  "migrationLikelihood": 0.0-1.0,
  "sponsorshipReadiness": 0.0-1.0,
  "languageProficiencies": [{"language": "English", "level": "native|fluent|intermediate|basic"}],
  "careerStage": "early|mid|senior|executive",
  "recommendedRoles": ["role1", "role2", "role3"]
}`,
            },
          ],
          temperature: 0.3,
          max_tokens: 1500,
        });

        const raw = completion.choices[0].message.content || "{}";
        enrichment = JSON.parse(stripJsonFences(raw));
      } catch {
        enrichment = {
          normalizedSkills: ((candidate.skills || []) as string[]).map((s: string) => s.trim()),
          experienceLevel: this.inferExperienceLevel((candidate.experience || []) as Array<Record<string, unknown>>),
          industry: candidate.industry || "Unknown",
          inferredSkills: [],
          missingSkills: [],
          migrationLikelihood: candidate.location?.toLowerCase().includes("qatar") || candidate.location?.toLowerCase().includes("uae") ? 0.6 : 0.3,
          sponsorshipReadiness: 0.5,
          languageProficiencies: (candidate.languages || []).map((l: string) => ({ language: l, level: "fluent" })),
          careerStage: "mid",
          recommendedRoles: [],
        };
      }

      if (enrichment) {
        await this.storeEnrichment(candidateId, "skill_inference", { normalizedSkills: enrichment.normalizedSkills, inferredSkills: enrichment.inferredSkills, missingSkills: enrichment.missingSkills }, 0.8);
        await this.storeEnrichment(candidateId, "experience_normalization", { experienceLevel: enrichment.experienceLevel, careerStage: enrichment.careerStage }, 0.7);
        await this.storeEnrichment(candidateId, "industry_classification", { industry: enrichment.industry, recommendedRoles: enrichment.recommendedRoles }, 0.7);
        await this.storeEnrichment(candidateId, "migration_analysis", { migrationLikelihood: enrichment.migrationLikelihood, sponsorshipReadiness: enrichment.sponsorshipReadiness }, 0.6);
        await this.storeEnrichment(candidateId, "language_detection", { languageProficiencies: enrichment.languageProficiencies }, 0.7);

        await db.update(discoveredCandidates)
          .set({
            normalizedSkills: enrichment.normalizedSkills as any,
            experienceLevel: enrichment.experienceLevel,
            industry: enrichment.industry,
            status: "enriched",
            updatedAt: new Date(),
          } as any)
          .where(eq(discoveredCandidates.id, candidateId));

        await eventBus.emitEvent({
          type: RecruitmentEventTypes.AGENT_ACTION,
          source: "enrichment-agent",
          payload: { candidateId, experienceLevel: enrichment.experienceLevel, industry: enrichment.industry },
          timestamp: new Date(),
        });
      }

      return enrichment;
    } catch (err) {
      logger.error({ err, candidateId }, "Enrichment agent failed");
      return null;
    }
  }

  private inferExperienceLevel(experience: Array<Record<string, unknown>> | undefined | null): string {
    if (!experience || !Array.isArray(experience) || experience.length === 0) return "entry";
    const totalYears = experience.reduce((sum, exp) => {
      const duration = (exp.duration as string) || "";
      const years = duration.match(/(\d+)\s*years?/i);
      return sum + (years ? parseInt(years[1]) : 1);
    }, 0);
    if (totalYears >= 10) return "senior";
    if (totalYears >= 5) return "mid";
    if (totalYears >= 2) return "junior";
    return "entry";
  }

  private async storeEnrichment(candidateId: number, type: string, data: Record<string, unknown>, confidence: number): Promise<void> {
    await db.insert(candidateEnrichments).values({
      candidateId,
      enrichmentType: type,
      enrichmentData: data,
      confidence,
      enrichmentSource: "ai",
      modelUsed: "openrouter/free",
    });
  }

  async batchEnrich(candidateIds: number[]): Promise<number> {
    let enriched = 0;
    for (const id of candidateIds.slice(0, 20)) {
      const result = await this.enrichCandidate(id);
      if (result) enriched++;
    }
    return enriched;
  }

  async getEnrichments(candidateId: number): Promise<any[]> {
    return db.select()
      .from(candidateEnrichments)
      .where(eq(candidateEnrichments.candidateId, candidateId))
      .orderBy(sql`created_at DESC`);
  }
}

export const enrichmentAgent = new EnrichmentAgent();

function stripJsonFences(raw: string): string {
  return raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
}
