import { db, corridorMetrics, migrationEvents, sponsorshipOutcomes } from "@workspace/db";
import { eq, and, gte, lte, desc, sql, count, avg } from "drizzle-orm";
import { logger } from "../../lib/logger";
import { runCypher } from "../../lib/neo4j";

export interface CorridorHealthDetail {
  sourceCountry: string;
  destinationCountry: string;
  healthScore: number;
  dimensions: {
    demand: { score: number; trend: string };
    sponsorshipEase: { score: number; trend: string };
    migrationStability: { score: number; trend: string };
    retentionQuality: { score: number; trend: string };
    salaryUplift: { score: number; trend: string };
    talentAvailability: { score: number; trend: string };
    employerConfidence: { score: number; trend: string };
  };
  totalMigrated: number;
  activePipeline: number;
  approvalRate: number;
  averageSalaryUplift: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  summary: string;
}

class CorridorHealthService {
  async assessCorridorHealth(source: string, destination: string): Promise<CorridorHealthDetail> {
    const demand = await this.computeDemandDimension(source, destination);
    const sponsorshipEase = await this.computeSponsorshipDimension(source, destination);
    const migrationStability = await this.computeStabilityDimension(source, destination);
    const retentionQuality = await this.computeRetentionDimension(source, destination);
    const salaryUplift = await this.computeSalaryDimension(source, destination);
    const talentAvailability = await this.computeTalentDimension(source, destination);
    const employerConfidence = await this.computeEmployerDimension(source, destination);

    const dimensions = {
      demand, sponsorshipEase, migrationStability, retentionQuality, salaryUplift,
      talentAvailability, employerConfidence,
    };

    const healthScore = Object.values(dimensions).reduce((s, d) => s + d.score, 0) / 7;

    const totalMigrated = await this.getTotalMigrated(source, destination);
    const activePipeline = await this.getActivePipeline(source, destination);
    const approvalRate = await this.getApprovalRate(source, destination);
    const avgSalaryUplift = await this.getSalaryUplift(source, destination);

    let riskLevel: "low" | "medium" | "high" | "critical";
    if (healthScore >= 0.7) riskLevel = "low";
    else if (healthScore >= 0.5) riskLevel = "medium";
    else if (healthScore >= 0.3) riskLevel = "high";
    else riskLevel = "critical";

    const summary = this.generateSummary(source, destination, healthScore, riskLevel);

    return {
      sourceCountry: source,
      destinationCountry: destination,
      healthScore: Math.round(healthScore * 100) / 100,
      dimensions,
      totalMigrated,
      activePipeline,
      approvalRate: Math.round(approvalRate * 100) / 100,
      averageSalaryUplift: Math.round(avgSalaryUplift * 100) / 100,
      riskLevel,
      summary,
    };
  }

  async getAllCorridorHealths(): Promise<CorridorHealthDetail[]> {
    const corridors = await db
      .select({
        source: corridorMetrics.sourceCountry,
        destination: corridorMetrics.destinationCountry,
      })
      .from(corridorMetrics)
      .groupBy(corridorMetrics.sourceCountry, corridorMetrics.destinationCountry)
      .orderBy(desc(corridorMetrics.healthScore))
      .limit(30);

    const results: CorridorHealthDetail[] = [];
    for (const c of corridors) {
      try {
        const health = await this.assessCorridorHealth(c.source, c.destination);
        results.push(health);
      } catch (err) {
        logger.error({ err, corridor: c }, "Failed to assess corridor health");
      }
    }
    return results;
  }

  private async computeDemandDimension(source: string, destination: string): Promise<{ score: number; trend: string }> {
    try {
      const result = await runCypher(
        `MATCH (src:Location {name: $source})<-[:LOCATED_IN]-(c:Candidate)
         OPTIONAL MATCH (c)-[:INTERESTED_IN]->(reloc:IntentSignal {type: "relocation_intent"})
         OPTIONAL MATCH (c)-[:MATCHES]->(r:JobRole)
         RETURN count(DISTINCT c) AS candidates,
                count(DISTINCT reloc) AS relocCount,
                count(DISTINCT r) AS roleCount`,
        { source: source.toLowerCase() },
      );
      const r = result[0] as any;
      const roleCount = (r?.roleCount as number) || 0;
      const relocRatio = (r?.candidates as number) > 0
        ? ((r?.relocCount as number) || 0) / ((r?.candidates as number) || 1)
        : 0.3;
      const score = Math.min(1, roleCount / 15) * 0.5 + Math.min(1, relocRatio) * 0.5;
      return { score: Math.round(score * 100) / 100, trend: score > 0.6 ? "growing" : "stable" };
    } catch { return { score: 0.5, trend: "stable" }; }
  }

  private async computeSponsorshipDimension(source: string, destination: string): Promise<{ score: number; trend: string }> {
    try {
      const result = await runCypher(
        `MATCH (src:Location {name: $source})<-[:LOCATED_IN]-(c:Candidate)
         OPTIONAL MATCH (c)-[:INTERESTED_IN]->(sponsor:IntentSignal {type: "sponsorship_seeking"})
         RETURN count(DISTINCT c) AS total, count(DISTINCT sponsor) AS seeking`,
        { source: source.toLowerCase() },
      );
      const r = result[0] as any;
      const seeking = (r?.seeking as number) || 0;
      const total = (r?.total as number) || 1;
      const ease = 1 - Math.min(1, seeking / total);
      return { score: Math.round(ease * 100) / 100, trend: ease > 0.6 ? "favorable" : "tight" };
    } catch { return { score: 0.5, trend: "stable" }; }
  }

  private async computeStabilityDimension(source: string, destination: string): Promise<{ score: number; trend: string }> {
    try {
      const events = await db
        .select({ count: count() })
        .from(migrationEvents)
        .where(
          and(
            eq(migrationEvents.sourceCountry, source),
            eq(migrationEvents.destinationCountry, destination),
            eq(migrationEvents.eventType, "relocation_completed"),
          ),
        );
      const eventCount = events[0]?.count || 0;
      return { score: Math.min(1, 0.5 + eventCount * 0.02), trend: eventCount > 5 ? "established" : "developing" };
    } catch { return { score: 0.5, trend: "developing" }; }
  }

  private async computeRetentionDimension(source: string, destination: string): Promise<{ score: number; trend: string }> {
    try {
      const rows = await db
        .select({ avgRetention: avg(sponsorshipOutcomes.retentionDays) })
        .from(sponsorshipOutcomes)
        .where(
          and(
            eq(sponsorshipOutcomes.nationality, source),
            eq(sponsorshipOutcomes.destinationCountry, destination),
          ),
        );
      const avgRetention = Number(rows[0]?.avgRetention) || 0;
      const score = Math.min(1, avgRetention / 365);
      return { score: Math.round(score * 100) / 100, trend: score > 0.6 ? "strong" : "moderate" };
    } catch { return { score: 0.5, trend: "moderate" }; }
  }

  private async computeSalaryDimension(source: string, destination: string): Promise<{ score: number; trend: string }> {
    const gccCountries = ["qatar", "uae", "saudi arabia", "kuwait", "bahrain", "oman"];
    const dest = destination.toLowerCase();
    if (gccCountries.some(c => dest.includes(c))) {
      return { score: 0.85, trend: "premium" };
    }
    return { score: 0.5, trend: "stable" };
  }

  private async computeTalentDimension(source: string, destination: string): Promise<{ score: number; trend: string }> {
    try {
      const result = await runCypher(
        `MATCH (l:Location {name: $source})<-[:LOCATED_IN]-(c:Candidate)
         MATCH (c)-[:HAS_SKILL]->(s:Skill)
         RETURN count(DISTINCT c) AS candidates, count(DISTINCT s) AS skillCount`,
        { source: source.toLowerCase() },
      );
      const r = result[0] as any;
      const candidates = (r?.candidates as number) || 0;
      const skills = (r?.skillCount as number) || 0;
      const score = Math.min(1, candidates / 100) * 0.4 + Math.min(1, skills / 30) * 0.6;
      return { score: Math.round(score * 100) / 100, trend: score > 0.6 ? "abundant" : "limited" };
    } catch { return { score: 0.5, trend: "limited" }; }
  }

  private async computeEmployerDimension(source: string, destination: string): Promise<{ score: number; trend: string }> {
    try {
      const result = await runCypher(
        `MATCH (dst:Location {name: $destination})<-[:LOCATED_IN]-(c:Candidate)
         MATCH (c)-[:MATCHES]->(r:JobRole)
         MATCH (r)<-[:POSTED]-(e:Employer)
         RETURN count(DISTINCT e) AS employers`,
        { destination: destination.toLowerCase() },
      );
      const employers = (result[0]?.employers as number) || 0;
      return { score: Math.min(1, employers / 15), trend: employers > 5 ? "competitive" : "developing" };
    } catch { return { score: 0.5, trend: "developing" }; }
  }

  private async getTotalMigrated(source: string, destination: string): Promise<number> {
    try {
      const rows = await db
        .select({ count: count() })
        .from(migrationEvents)
        .where(
          and(
            eq(migrationEvents.sourceCountry, source),
            eq(migrationEvents.destinationCountry, destination),
            eq(migrationEvents.eventType, "relocation_completed"),
          ),
        );
      return rows[0]?.count || 0;
    } catch { return 0; }
  }

  private async getActivePipeline(source: string, destination: string): Promise<number> {
    try {
      const result = await runCypher(
        `MATCH (c:Candidate)-[:LOCATED_IN]->(src:Location {name: $source})
         OPTIONAL MATCH (c)-[:INTERESTED_IN]->(reloc:IntentSignal {type: "relocation_intent"})
         WHERE reloc IS NOT NULL
         RETURN count(DISTINCT c) AS inPipeline`,
        { source: source.toLowerCase() },
      );
      return (result[0]?.inPipeline as number) || 0;
    } catch { return 0; }
  }

  private async getApprovalRate(source: string, destination: string): Promise<number> {
    try {
      const rows = await db
        .select({
          approved: sql`count(CASE WHEN ${sponsorshipOutcomes.status} = 'approved' THEN 1 END)`,
          total: count(),
        })
        .from(sponsorshipOutcomes)
        .where(
          and(
            eq(sponsorshipOutcomes.nationality, source),
            eq(sponsorshipOutcomes.destinationCountry, destination),
          ),
        );
      const total = Number(rows[0]?.total) || 0;
      if (total === 0) return 0.5;
      const approved = Number(rows[0]?.approved) || 0;
      return approved / total;
    } catch { return 0.5; }
  }

  private async getSalaryUplift(source: string, destination: string): Promise<number> {
    try {
      const gccCountries = ["qatar", "uae", "saudi arabia", "kuwait", "bahrain", "oman"];
      const dest = destination.toLowerCase();
      if (gccCountries.some(c => dest.includes(c))) return 40;
      return 10;
    } catch { return 5; }
  }

  private generateSummary(source: string, destination: string, health: number, risk: string): string {
    const healthLabel = health >= 0.8 ? "excellent" : health >= 0.6 ? "good" : health >= 0.4 ? "moderate" : "weak";
    return `${source} → ${destination} corridor health is ${healthLabel} (${Math.round(health * 100)}/100). Risk level: ${risk}.`;
  }
}

export const corridorHealthService = new CorridorHealthService();
