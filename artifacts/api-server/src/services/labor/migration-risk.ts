import { db, migrationRisks, migrationEvents, sponsorshipOutcomes, corridorMetrics } from "@workspace/db";
import { eq, and, gte, lte, desc, sql, count } from "drizzle-orm";
import { logger } from "../../lib/logger";
import { runCypher } from "../../lib/neo4j";

export interface MigrationRiskAssessment {
  riskType: string;
  corridorSource?: string;
  corridorDestination?: string;
  riskScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  contributingFactors: string[];
  affectedCandidateCount: number;
  mitigationSuggestions: string[];
}

class MigrationRiskService {
  async assessCorridorInstability(source: string, destination: string): Promise<MigrationRiskAssessment> {
    const contributingFactors: string[] = [];
    const mitigationSuggestions: string[] = [];
    let riskScore = 0;

    const churnRate = await this.getCorridorChurnRate(source, destination);
    if (churnRate > 0.3) {
      contributingFactors.push(`High post-relocation churn rate (${Math.round(churnRate * 100)}%)`);
      riskScore += 0.3;
      mitigationSuggestions.push("Improve integration support — mentorship, community, career path");
    }

    const visaRejectionRate = await this.getVisaRejectionRate(source, destination);
    if (visaRejectionRate > 0.3) {
      contributingFactors.push(`Elevated visa rejection rate (${Math.round(visaRejectionRate * 100)}%)`);
      riskScore += 0.25;
      mitigationSuggestions.push("Review documentation quality and legal compliance");
    }

    const volatility = await this.getMigrationVolatility(source, destination);
    if (volatility > 0.4) {
      contributingFactors.push("High migration intent volatility — candidates changing preferences");
      riskScore += 0.2;
      mitigationSuggestions.push("Engage candidates early to confirm commitment");
    }

    const exploitationSignals = await this.getExploitationSignals(source, destination);
    if (exploitationSignals > 0.3) {
      contributingFactors.push("Potential labor exploitation signals detected");
      riskScore += 0.25;
      mitigationSuggestions.push("Verify employer compliance with labor laws");
    }

    const activeCount = await this.getAffectedCandidateCount(source, destination);
    const result = this.buildResult("corridor_instability", source, destination, riskScore, contributingFactors, mitigationSuggestions, activeCount);
    await this.persistRisk(result);
    return result;
  }

  async assessSponsorshipFraud(employerId: number): Promise<MigrationRiskAssessment> {
    const contributingFactors: string[] = [];
    const mitigationSuggestions: string[] = [];
    let riskScore = 0;

    const rejectionSpike = await this.getRejectionSpike(employerId);
    if (rejectionSpike > 0.5) {
      contributingFactors.push("Sudden increase in sponsorship rejections");
      riskScore += 0.35;
      mitigationSuggestions.push("Audit sponsorship applications for compliance");
    }

    const earlyChurn = await this.getEarlyChurnRate(employerId);
    if (earlyChurn > 0.4) {
      contributingFactors.push("High early post-sponsorship churn — possible visa misuse");
      riskScore += 0.35;
      mitigationSuggestions.push("Monitor sponsored employee retention and welfare");
    }

    const applicationVelocity = await this.getApplicationVelocity(employerId);
    if (applicationVelocity > 0.7) {
      contributingFactors.push("Abnormal sponsorship application velocity");
      riskScore += 0.3;
      mitigationSuggestions.push("Flag for manual compliance review");
    }

    const result = this.buildResult("sponsorship_fraud", undefined, undefined, riskScore, contributingFactors, mitigationSuggestions, 0);
    await this.persistRisk(result);
    return result;
  }

  async assessHighChurnCorridor(source: string, destination: string): Promise<MigrationRiskAssessment> {
    const contributingFactors: string[] = [];
    const mitigationSuggestions: string[] = [];
    let riskScore = 0;

    const churnRate = await this.getCorridorChurnRate(source, destination);
    if (churnRate > 0.5) {
      contributingFactors.push(`Critical churn rate: ${Math.round(churnRate * 100)}%`);
      riskScore += 0.4;
      mitigationSuggestions.push("Restructure relocation packages with retention incentives");
    }
    if (churnRate > 0.3) {
      contributingFactors.push("Above-average post-relocation attrition");
      riskScore += 0.25;
      mitigationSuggestions.push("Conduct exit interviews to identify corridor-specific issues");
    }

    const earlyDeparture = await this.getEarlyDepartureRate(source, destination);
    if (earlyDeparture > 0.3) {
      contributingFactors.push("Frequent early departures within first 90 days");
      riskScore += 0.2;
      mitigationSuggestions.push("Enhance onboarding and cultural integration program");
    }

    const activeCount = await this.getAffectedCandidateCount(source, destination);
    const result = this.buildResult("high_churn", source, destination, riskScore, contributingFactors, mitigationSuggestions, activeCount);
    await this.persistRisk(result);
    return result;
  }

  async assessVisaRejectionRisk(nationality: string, destinationCountry: string): Promise<MigrationRiskAssessment> {
    const contributingFactors: string[] = [];
    const mitigationSuggestions: string[] = [];
    let riskScore = 0;

    const rejectionRate = await this.getNationalityRejectionRate(nationality, destinationCountry);
    if (rejectionRate > 0.4) {
      contributingFactors.push(`High rejection rate for ${nationality} (${Math.round(rejectionRate * 100)}%)`);
      riskScore += 0.5;
      mitigationSuggestions.push("Identify common rejection reasons and address documentation gaps");
    }

    const processingDelay = await this.getProcessingDelay(nationality, destinationCountry);
    if (processingDelay > 60) {
      contributingFactors.push("Extended visa processing times");
      riskScore += 0.25;
      mitigationSuggestions.push("Apply early and engage immigration specialist");
    }

    const result = this.buildResult("visa_rejection", undefined, destinationCountry, riskScore, contributingFactors, mitigationSuggestions, 0);
    await this.persistRisk(result);
    return result;
  }

  async getAllActiveRisks(limit = 20): Promise<Array<Record<string, unknown>>> {
    return db
      .select()
      .from(migrationRisks)
      .where(eq(migrationRisks.active, true))
      .orderBy(desc(migrationRisks.riskScore))
      .limit(limit);
  }

  async resolveRisk(id: number): Promise<void> {
    await db.update(migrationRisks)
      .set({ active: false, resolvedAt: new Date() })
      .where(eq(migrationRisks.id, id));
  }

  private async getCorridorChurnRate(source: string, destination: string): Promise<number> {
    try {
      const events = await db
        .select({
          completed: sql`count(CASE WHEN ${migrationEvents.eventType} = 'relocation_completed' THEN 1 END)`,
          failed: sql`count(CASE WHEN ${migrationEvents.eventType} = 'relocation_failed' THEN 1 END)`,
        })
        .from(migrationEvents)
        .where(
          and(
            eq(migrationEvents.sourceCountry, source),
            eq(migrationEvents.destinationCountry, destination),
          ),
        );
      const completed = Number(events[0]?.completed) || 0;
      const failed = Number(events[0]?.failed) || 0;
      const total = completed + failed;
      return total > 0 ? failed / total : 0;
    } catch { return 0.2; }
  }

  private async getVisaRejectionRate(source: string, destination: string): Promise<number> {
    try {
      const rows = await db
        .select({
          approved: sql`count(CASE WHEN ${sponsorshipOutcomes.status} = 'approved' THEN 1 END)`,
          rejected: sql`count(CASE WHEN ${sponsorshipOutcomes.status} = 'rejected' THEN 1 END)`,
        })
        .from(sponsorshipOutcomes)
        .where(
          and(
            eq(sponsorshipOutcomes.nationality, source),
            eq(sponsorshipOutcomes.destinationCountry, destination),
          ),
        );
      const approved = Number(rows[0]?.approved) || 0;
      const rejected = Number(rows[0]?.rejected) || 0;
      const total = approved + rejected;
      return total > 0 ? rejected / total : 0.1;
    } catch { return 0.1; }
  }

  private async getMigrationVolatility(source: string, destination: string): Promise<number> {
    try {
      const result = await runCypher(
        `MATCH (c:Candidate)-[:LOCATED_IN]->(src:Location {name: $source})
         OPTIONAL MATCH (c)-[:INTERESTED_IN]->(int:IntentSignal)
         WHERE int.type IN ["relocation_intent", "career_change"]
         RETURN count(DISTINCT c) AS total,
                count(DISTINCT int) AS signals`,
        { source: source.toLowerCase() },
      );
      const r = result[0] as any;
      const total = (r?.total as number) || 1;
      const signals = (r?.signals as number) || 0;
      return Math.min(1, signals / Math.max(total, 1));
    } catch { return 0.2; }
  }

  private async getExploitationSignals(source: string, destination: string): Promise<number> {
    try {
      const result = await runCypher(
        `MATCH (c:Candidate)-[:LOCATED_IN]->(src:Location {name: $source})
         OPTIONAL MATCH (c)-[:INTERESTED_IN]->(int:IntentSignal)
         WHERE int.type IN ["immediate_availability", "sponsorship_seeking"]
         AND c.visaStatus IS NULL
         WITH count(DISTINCT c) AS total,
              count(DISTINCT int) AS vulnerable
         RETURN CASE WHEN total > 0 THEN toFloat(vulnerable) / toFloat(total) ELSE 0.2 END AS exploitationRisk`,
        { source: source.toLowerCase() },
      );
      return (result[0]?.exploitationRisk as number) || 0.2;
    } catch { return 0.2; }
  }

  private async getAffectedCandidateCount(source: string, destination: string): Promise<number> {
    try {
      const result = await runCypher(
        `MATCH (c:Candidate)-[:LOCATED_IN]->(src:Location {name: $source})
         RETURN count(DISTINCT c) AS count`,
        { source: source.toLowerCase() },
      );
      return (result[0]?.count as number) || 0;
    } catch { return 0; }
  }

  private async getRejectionSpike(employerId: number): Promise<number> {
    try {
      const recent = await db
        .select({ count: count() })
        .from(sponsorshipOutcomes)
        .where(
          and(
            eq(sponsorshipOutcomes.employerId, employerId),
            eq(sponsorshipOutcomes.status, "rejected"),
            gte(sponsorshipOutcomes.createdAt, new Date(Date.now() - 90 * 86400000)),
          ),
        )
        .then(r => r[0]?.count || 0);

      const prior = await db
        .select({ count: count() })
        .from(sponsorshipOutcomes)
        .where(
          and(
            eq(sponsorshipOutcomes.employerId, employerId),
            eq(sponsorshipOutcomes.status, "rejected"),
            gte(sponsorshipOutcomes.createdAt, new Date(Date.now() - 180 * 86400000)),
            lte(sponsorshipOutcomes.createdAt, new Date(Date.now() - 90 * 86400000)),
          ),
        )
        .then(r => r[0]?.count || 1);

      return prior > 0 ? Math.min(1, recent / prior) : 0;
    } catch { return 0.2; }
  }

  private async getEarlyChurnRate(employerId: number): Promise<number> {
    try {
      const rows = await db
        .select({
          earlyChurn: sql`count(CASE WHEN ${sponsorshipOutcomes.retentionDays} < 90 AND ${sponsorshipOutcomes.retentionDays} > 0 THEN 1 END)`,
          total: count(),
        })
        .from(sponsorshipOutcomes)
        .where(eq(sponsorshipOutcomes.employerId, employerId));
      const total = Number(rows[0]?.total) || 0;
      if (total === 0) return 0.2;
      const earlyChurn = Number(rows[0]?.earlyChurn) || 0;
      return earlyChurn / total;
    } catch { return 0.2; }
  }

  private async getApplicationVelocity(employerId: number): Promise<number> {
    try {
      const recentCount = await db
        .select({ count: count() })
        .from(sponsorshipOutcomes)
        .where(
          and(
            eq(sponsorshipOutcomes.employerId, employerId),
            gte(sponsorshipOutcomes.createdAt, new Date(Date.now() - 30 * 86400000)),
          ),
        )
        .then(r => r[0]?.count || 0);
      return Math.min(1, recentCount / 20);
    } catch { return 0.2; }
  }

  private async getEarlyDepartureRate(source: string, destination: string): Promise<number> {
    try {
      const events = await db
        .select({
          earlyDepartures: sql`count(CASE WHEN ${migrationEvents.eventType} = 'relocation_failed' THEN 1 END)`,
        })
        .from(migrationEvents)
        .where(
          and(
            eq(migrationEvents.sourceCountry, source),
            eq(migrationEvents.destinationCountry, destination),
            gte(migrationEvents.createdAt, new Date(Date.now() - 180 * 86400000)),
          ),
        );
      const early = Number(events[0]?.earlyDepartures) || 0;
      return Math.min(1, early / 10);
    } catch { return 0.1; }
  }

  private async getNationalityRejectionRate(nationality: string, destinationCountry: string): Promise<number> {
    try {
      const rows = await db
        .select({
          rejected: sql`count(CASE WHEN ${sponsorshipOutcomes.status} = 'rejected' THEN 1 END)`,
          total: count(),
        })
        .from(sponsorshipOutcomes)
        .where(
          and(
            eq(sponsorshipOutcomes.nationality, nationality),
            eq(sponsorshipOutcomes.destinationCountry, destinationCountry),
          ),
        );
      const total = Number(rows[0]?.total) || 0;
      if (total === 0) return 0.2;
      const rejected = Number(rows[0]?.rejected) || 0;
      return rejected / total;
    } catch { return 0.2; }
  }

  private async getProcessingDelay(nationality: string, destinationCountry: string): Promise<number> {
    try {
      const rows = await db
        .select({ avg: sql`avg(${sponsorshipOutcomes.processingDays})` })
        .from(sponsorshipOutcomes)
        .where(
          and(
            eq(sponsorshipOutcomes.nationality, nationality),
            eq(sponsorshipOutcomes.destinationCountry, destinationCountry),
          ),
        );
      return Number(rows[0]?.avg) || 30;
    } catch { return 30; }
  }

  private buildResult(
    riskType: string, source?: string, destination?: string,
    rawScore = 0, contributingFactors: string[] = [],
    mitigationSuggestions: string[] = [], affectedCount = 0,
  ): MigrationRiskAssessment {
    const riskScore = Math.max(0, Math.min(1, rawScore));
    let riskLevel: "low" | "medium" | "high" | "critical";
    if (riskScore >= 0.7) riskLevel = "critical";
    else if (riskScore >= 0.5) riskLevel = "high";
    else if (riskScore >= 0.3) riskLevel = "medium";
    else riskLevel = "low";

    return {
      riskType,
      corridorSource: source,
      corridorDestination: destination,
      riskScore: Math.round(riskScore * 100) / 100,
      riskLevel,
      contributingFactors,
      affectedCandidateCount: affectedCount,
      mitigationSuggestions,
    };
  }

  private async persistRisk(assessment: MigrationRiskAssessment): Promise<void> {
    try {
      await db.insert(migrationRisks).values({
        riskType: assessment.riskType,
        corridorSource: assessment.corridorSource || null,
        corridorDestination: assessment.corridorDestination || null,
        riskScore: assessment.riskScore,
        riskLevel: assessment.riskLevel,
        contributingFactors: assessment.contributingFactors,
        affectedCandidateCount: assessment.affectedCandidateCount,
        mitigationSuggestions: assessment.mitigationSuggestions,
        active: true,
        metadata: {},
      }).onConflictDoNothing();
    } catch (err) {
      logger.error({ err, riskType: assessment.riskType }, "Failed to persist migration risk");
    }
  }
}

export const migrationRiskService = new MigrationRiskService();
