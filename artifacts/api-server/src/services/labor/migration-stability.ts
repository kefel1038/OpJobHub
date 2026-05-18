import { db, relocationProfiles, migrationEvents } from "@workspace/db";
import { eq, and, gte, lte, desc, sql, count } from "drizzle-orm";
import { logger } from "../../lib/logger";
import { runCypher } from "../../lib/neo4j";

export interface StabilityAssessment {
  candidateId: number;
  readinessScore: number;
  mobilityScore: number;
  relocationSuccessProbability: number;
  retentionAfterRelocationProbability: number;
  adaptationRisk: "low" | "medium" | "high";
  churnRiskAfterRelocation: number;
  corridorFriction: number;
  keyFactors: string[];
  suggestions: string[];
}

export interface RelocationProfileResult {
  candidateId: number;
  readinessScore: number;
  mobilityScore: number;
  preferredDestinations: string[];
  visaStatus: string;
  sponsorshipRequired: boolean;
  previousRelocations: number;
  relocationTimeline: string | null;
  financialReadiness: number;
}

class MigrationStabilityService {
  async assessCandidateStability(candidateId: number, destinationCountry?: string): Promise<StabilityAssessment> {
    const readiness = await this.computeReadiness(candidateId);
    const mobility = await this.computeMobility(candidateId);
    const relocationSuccessProbability = this.computeRelocationSuccess(readiness, mobility);
    const retentionAfterRelocation = await this.computeRetentionProbability(candidateId);
    const adaptationRisk = this.determineAdaptationRisk(readiness, mobility);
    const churnRiskAfterRelocation = 1 - retentionAfterRelocation;
    const corridorFriction = destinationCountry
      ? await this.computeCorridorFriction(candidateId, destinationCountry)
      : 0.3;

    const keyFactors: string[] = [];
    const suggestions: string[] = [];

    if (readiness < 0.4) {
      keyFactors.push("Low relocation readiness");
      suggestions.push("Begin relocation preparation early — financial and logistical");
    }
    if (mobility < 0.3) {
      keyFactors.push("Limited mobility history");
      suggestions.push("Consider short-term trial relocation before permanent move");
    }
    if (relocationSuccessProbability < 0.5) {
      keyFactors.push("Below-average relocation success likelihood");
      suggestions.push("Provide relocation support package — housing, schooling, family support");
    }
    if (retentionAfterRelocation < 0.5) {
      keyFactors.push("High post-relocation churn risk");
      suggestions.push("Establish integration program — mentorship, community, career progression");
    }
    if (corridorFriction > 0.6) {
      keyFactors.push("Significant corridor friction");
      suggestions.push("Engage relocation agency experienced with this corridor");
    }
    if (readiness > 0.7 && mobility > 0.6) {
      keyFactors.push("Strong relocation profile");
      suggestions.push("Prioritize for fast-track sponsorship processing");
    }

    await this.persistRelocationProfile(candidateId, readiness, mobility);

    return {
      candidateId,
      readinessScore: Math.round(readiness * 100) / 100,
      mobilityScore: Math.round(mobility * 100) / 100,
      relocationSuccessProbability: Math.round(relocationSuccessProbability * 100) / 100,
      retentionAfterRelocationProbability: Math.round(retentionAfterRelocation * 100) / 100,
      adaptationRisk,
      churnRiskAfterRelocation: Math.round(churnRiskAfterRelocation * 100) / 100,
      corridorFriction: Math.round(corridorFriction * 100) / 100,
      keyFactors,
      suggestions,
    };
  }

  async getRelocationProfile(candidateId: number): Promise<RelocationProfileResult | null> {
    const rows = await db
      .select()
      .from(relocationProfiles)
      .where(eq(relocationProfiles.candidateId, candidateId))
      .orderBy(desc(relocationProfiles.assessedAt))
      .limit(1);

    if (!rows[0]) return null;
    const r = rows[0];
    return {
      candidateId: r.candidateId,
      readinessScore: r.readinessScore ?? 0.5,
      mobilityScore: r.mobilityScore ?? 0.5,
      preferredDestinations: (r.preferredDestinations as string[]) || [],
      visaStatus: r.visaStatus ?? "unknown",
      sponsorshipRequired: r.sponsorshipRequired ?? true,
      previousRelocations: r.previousRelocations ?? 0,
      relocationTimeline: r.relocationTimeline,
      financialReadiness: r.financialReadiness ?? 0.5,
    };
  }

  async getStabilityAssessments(limit = 20): Promise<Array<Record<string, unknown>>> {
    return db
      .select()
      .from(relocationProfiles)
      .orderBy(desc(relocationProfiles.assessedAt))
      .limit(limit);
  }

  private async computeReadiness(candidateId: number): Promise<number> {
    try {
      const result = await runCypher(
        `MATCH (c:Candidate {id: $candidateId})
         RETURN c.visaStatus AS visaStatus,
                c.nationality AS nationality,
                c.previousEmployers IS NOT NULL AS hasExperience,
                c.headline IS NOT NULL AS hasHeadline`,
        { candidateId },
      );
      const r = result[0] as any;
      let score = 0.5;
      if (r?.visaStatus === "ready" || r?.visaStatus === "sponsored") score += 0.2;
      if (r?.hasExperience) score += 0.1;
      if (r?.hasHeadline) score += 0.05;
      return Math.min(1, Math.max(0, score));
    } catch { return 0.5; }
  }

  private async computeMobility(candidateId: number): Promise<number> {
    try {
      const result = await runCypher(
        `MATCH (c:Candidate {id: $candidateId})
         RETURN c.previousEmployers IS NOT NULL AS hasHistory,
                c.previousEmployers AS employers`,
        { candidateId },
      );
      const r = result[0] as any;
      const employers = (r?.employers as string[]) || [];
      return Math.min(1, 0.3 + employers.length * 0.15);
    } catch { return 0.4; }
  }

  private computeRelocationSuccess(readiness: number, mobility: number): number {
    return Math.min(1, Math.max(0, readiness * 0.55 + mobility * 0.45));
  }

  private async computeRetentionProbability(candidateId: number): Promise<number> {
    try {
      const intentSignals = await runCypher(
        `MATCH (c:Candidate {id: $candidateId})-[:INTERESTED_IN]->(int:IntentSignal)
         WHERE int.type IN ["career_change", "immediate_availability"]
         RETURN count(int) AS volatilitySignals`,
        { candidateId },
      );
      const volatility = (intentSignals[0]?.volatilitySignals as number) || 0;
      return Math.min(1, Math.max(0.2, 0.7 - volatility * 0.15));
    } catch { return 0.6; }
  }

  private determineAdaptationRisk(readiness: number, mobility: number): "low" | "medium" | "high" {
    const combined = readiness * 0.5 + mobility * 0.5;
    if (combined >= 0.7) return "low";
    if (combined >= 0.4) return "medium";
    return "high";
  }

  private async computeCorridorFriction(candidateId: number, destination: string): Promise<number> {
    try {
      const result = await runCypher(
        `MATCH (c:Candidate {id: $candidateId})-[:LOCATED_IN]->(loc:Location)
         RETURN loc.name AS currentLocation`,
        { candidateId },
      );
      const current = ((result[0]?.currentLocation as string) || "").toLowerCase();
      const dest = destination.toLowerCase();

      const gccCountries = ["qatar", "uae", "saudi arabia", "kuwait", "bahrain", "oman"];
      const gccNearby = ["egypt", "jordan", "lebanon", "india", "pakistan", "bangladesh", "sri lanka", "philippines"];

      const currentInGccNearby = gccNearby.some(c => current.includes(c));
      const destInGcc = gccCountries.some(c => dest.includes(c));

      if (currentInGccNearby && destInGcc) return 0.2;
      if (destInGcc) return 0.4;
      return 0.6;
    } catch { return 0.3; }
  }

  private async persistRelocationProfile(candidateId: number, readiness: number, mobility: number): Promise<void> {
    try {
      const existing = await db
        .select({ id: relocationProfiles.id })
        .from(relocationProfiles)
        .where(eq(relocationProfiles.candidateId, candidateId))
        .limit(1);

      if (existing[0]) {
        await db.update(relocationProfiles)
          .set({ readinessScore: readiness, mobilityScore: mobility, assessedAt: new Date() })
          .where(eq(relocationProfiles.candidateId, candidateId));
      } else {
        await db.insert(relocationProfiles).values({
          candidateId,
          readinessScore: readiness,
          mobilityScore: mobility,
          sponsorshipRequired: true,
          assessedAt: new Date(),
          metadata: {},
        });
      }
    } catch (err) {
      logger.error({ err, candidateId }, "Failed to persist relocation profile");
    }
  }
}

export const migrationStabilityService = new MigrationStabilityService();
