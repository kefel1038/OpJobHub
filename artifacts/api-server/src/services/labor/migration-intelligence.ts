import { db, migrationEvents, migrationCorridors, corridorMetrics, discoveredCandidates, intentSignals } from "@workspace/db";
import { eq, and, gte, lte, desc, sql, count, avg } from "drizzle-orm";
import { logger } from "../../lib/logger";
import { runCypher } from "../../lib/neo4j";

export interface CorridorIntelligence {
  sourceCountry: string;
  destinationCountry: string;
  demandScore: number;
  supplyScore: number;
  sponsorshipEase: number;
  migrationStability: number;
  retentionQuality: number;
  salaryUplift: number;
  employerConfidence: number;
  healthScore: number;
  totalMigrated: number;
  activeInPipeline: number;
  topSkillsExported: string[];
  topRolesDemanded: string[];
}

export interface CorridorFlow {
  source: string;
  destination: string;
  volume: number;
  growthRate: number;
  topSkills: string[];
  topIndustries: string[];
}

class MigrationIntelligence {
  async analyzeCorridor(source: string, destination: string): Promise<CorridorIntelligence> {
    const demandScore = await this.computeCorridorDemand(source, destination);
    const supplyScore = await this.computeCorridorSupply(source, destination);
    const sponsorshipEase = await this.computeSponsorshipEase(source, destination);
    const migrationStability = await this.computeMigrationStability(source, destination);
    const retentionQuality = await this.computeRetentionQuality(source, destination);
    const salaryUplift = await this.computeSalaryUplift(source, destination);
    const employerConfidence = await this.computeEmployerConfidence(source, destination);

    const weights = { demand: 0.2, supply: 0.15, sponsorship: 0.2, stability: 0.15, retention: 0.1, salary: 0.1, employer: 0.1 };
    const healthScore =
      demandScore * weights.demand +
      supplyScore * weights.supply +
      sponsorshipEase * weights.sponsorship +
      migrationStability * weights.stability +
      retentionQuality * weights.retention +
      Math.min(1, salaryUplift / 50) * weights.salary +
      employerConfidence * weights.employer;

    const topSkillsExported = await this.getTopSkillsExported(source, destination);
    const topRolesDemanded = await this.getTopRolesDemanded(source, destination);

    const totalMigrated = await this.getTotalMigrated(source, destination);
    const activeInPipeline = await this.getActiveInPipeline(source, destination);

    const intelligence: CorridorIntelligence = {
      sourceCountry: source, destinationCountry: destination,
      demandScore: Math.round(demandScore * 100) / 100,
      supplyScore: Math.round(supplyScore * 100) / 100,
      sponsorshipEase: Math.round(sponsorshipEase * 100) / 100,
      migrationStability: Math.round(migrationStability * 100) / 100,
      retentionQuality: Math.round(retentionQuality * 100) / 100,
      salaryUplift: Math.round(salaryUplift * 100) / 100,
      employerConfidence: Math.round(employerConfidence * 100) / 100,
      healthScore: Math.round(healthScore * 100) / 100,
      totalMigrated,
      activeInPipeline,
      topSkillsExported,
      topRolesDemanded,
    };

    await this.persistCorridorMetrics(source, destination, intelligence);
    return intelligence;
  }

  async analyzeAllCorridors(): Promise<CorridorIntelligence[]> {
    const corridors = await this.discoverCorridors();
    const results: CorridorIntelligence[] = [];
    for (const c of corridors.slice(0, 30)) {
      try {
        const intelligence = await this.analyzeCorridor(c.source, c.destination);
        results.push(intelligence);
      } catch (err) {
        logger.error({ err, corridor: c }, "Failed to analyze corridor");
      }
    }
    return results;
  }

  async getTopCorridors(limit = 10): Promise<CorridorIntelligence[]> {
    const rows = await db
      .select()
      .from(corridorMetrics)
      .orderBy(desc(corridorMetrics.healthScore))
      .limit(limit);
    return rows.map(r => ({
      sourceCountry: r.sourceCountry, destinationCountry: r.destinationCountry,
      demandScore: r.demandScore ?? 0.5, supplyScore: r.supplyScore ?? 0.5,
      sponsorshipEase: r.sponsorshipEase ?? 0.5, migrationStability: r.migrationStability ?? 0.5,
      retentionQuality: r.retentionQuality ?? 0.5, salaryUplift: r.salaryUplift ?? 0,
      employerConfidence: r.employerConfidence ?? 0.5, healthScore: r.healthScore ?? 0.5,
      totalMigrated: r.totalMigrated ?? 0, activeInPipeline: r.activeInPipeline ?? 0,
      topSkillsExported: (r.topSkillsExported as string[]) || [],
      topRolesDemanded: (r.topRolesDemanded as string[]) || [],
    }));
  }

  async getCorridorHistory(limit = 50): Promise<Array<Record<string, unknown>>> {
    return db
      .select()
      .from(corridorMetrics)
      .orderBy(desc(corridorMetrics.createdAt))
      .limit(limit);
  }

  async getCorridorByRoute(source: string, destination: string): Promise<CorridorIntelligence | null> {
    const rows = await db
      .select()
      .from(corridorMetrics)
      .where(
        and(
          eq(corridorMetrics.sourceCountry, source),
          eq(corridorMetrics.destinationCountry, destination),
        ),
      )
      .orderBy(desc(corridorMetrics.createdAt))
      .limit(1);
    if (!rows[0]) return null;
    const r = rows[0];
    return {
      sourceCountry: r.sourceCountry, destinationCountry: r.destinationCountry,
      demandScore: r.demandScore ?? 0.5, supplyScore: r.supplyScore ?? 0.5,
      sponsorshipEase: r.sponsorshipEase ?? 0.5, migrationStability: r.migrationStability ?? 0.5,
      retentionQuality: r.retentionQuality ?? 0.5, salaryUplift: r.salaryUplift ?? 0,
      employerConfidence: r.employerConfidence ?? 0.5, healthScore: r.healthScore ?? 0.5,
      totalMigrated: r.totalMigrated ?? 0, activeInPipeline: r.activeInPipeline ?? 0,
      topSkillsExported: (r.topSkillsExported as string[]) || [],
      topRolesDemanded: (r.topRolesDemanded as string[]) || [],
    };
  }

  async recordMigrationEvent(event: {
    candidateId: number; eventType: string; sourceCountry?: string;
    destinationCountry?: string; employerId?: number; jobId?: number;
    outcome?: string; metadata?: Record<string, unknown>;
  }): Promise<{ id: number }> {
    const [inserted] = await db.insert(migrationEvents).values({
      candidateId: event.candidateId,
      eventType: event.eventType,
      sourceCountry: event.sourceCountry || null,
      destinationCountry: event.destinationCountry || null,
      employerId: event.employerId || null,
      jobId: event.jobId || null,
      outcome: event.outcome || null,
      metadata: (event.metadata ?? {}) as any,
    }).returning();
    return { id: inserted.id };
  }

  async getMigrationEvents(
    candidateId?: number, employerId?: number, limit = 50,
  ): Promise<Array<Record<string, unknown>>> {
    const conditions = [];
    if (candidateId) conditions.push(eq(migrationEvents.candidateId, candidateId));
    if (employerId) conditions.push(eq(migrationEvents.employerId, employerId));
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const query = where
      ? db.select().from(migrationEvents).where(where).orderBy(desc(migrationEvents.createdAt)).limit(limit)
      : db.select().from(migrationEvents).orderBy(desc(migrationEvents.createdAt)).limit(limit);
    return query;
  }

  async getMigrationStats(): Promise<{
    totalEvents: number; totalCorridors: number; averageHealthScore: number;
    topDestination: string; topSource: string;
  }> {
    const totalEvents = await db.select({ count: count() }).from(migrationEvents).then(r => r[0]?.count || 0);
    const totalCorridors = await db.select({ count: count() }).from(corridorMetrics).then(r => r[0]?.count || 0);

    const avgHealth = await db
      .select({ avg: avg(corridorMetrics.healthScore) })
      .from(corridorMetrics)
      .then(r => r[0]?.avg || 0);

    const topDest = await db
      .select({ dest: corridorMetrics.destinationCountry, count: count() })
      .from(corridorMetrics)
      .groupBy(corridorMetrics.destinationCountry)
      .orderBy(desc(count()))
      .limit(1)
      .then(r => r[0]?.dest || "—");

    const topSrc = await db
      .select({ src: corridorMetrics.sourceCountry, count: count() })
      .from(corridorMetrics)
      .groupBy(corridorMetrics.sourceCountry)
      .orderBy(desc(count()))
      .limit(1)
      .then(r => r[0]?.src || "—");

    return {
      totalEvents,
      totalCorridors,
      averageHealthScore: Number(avgHealth) || 0,
      topDestination: topDest,
      topSource: topSrc,
    };
  }

  private async computeCorridorDemand(source: string, destination: string): Promise<number> {
    try {
      const result = await runCypher(
        `MATCH (src:Location {name: $source})<-[:LOCATED_IN]-(c:Candidate)
         OPTIONAL MATCH (c)-[:INTERESTED_IN]->(int:IntentSignal {type: "relocation_intent"})
         WHERE int IS NOT NULL
         OPTIONAL MATCH (c)-[:MATCHES]->(r:JobRole)
         WHERE r IS NOT NULL
         RETURN count(DISTINCT c) AS candidates,
                count(DISTINCT r) AS roles`,
        { source: source.toLowerCase(), destination: destination.toLowerCase() },
      );
      const roleDemand = (result[0]?.roles as number) || 0;
      return Math.min(1, roleDemand / 15);
    } catch { return 0.5; }
  }

  private async computeCorridorSupply(source: string, destination: string): Promise<number> {
    try {
      const result = await runCypher(
        `MATCH (l:Location {name: $source})<-[:LOCATED_IN]-(c:Candidate)
         OPTIONAL MATCH (c)-[:HAS_SKILL]->(s:Skill)
         RETURN count(DISTINCT c) AS candidates, count(DISTINCT s) AS skills`,
        { source: source.toLowerCase() },
      );
      const candidates = (result[0]?.candidates as number) || 0;
      return Math.min(1, candidates / 80);
    } catch { return 0.5; }
  }

  private async computeSponsorshipEase(source: string, destination: string): Promise<number> {
    try {
      const result = await runCypher(
        `MATCH (src:Location {name: $source})<-[:LOCATED_IN]-(c:Candidate)
         OPTIONAL MATCH (c)-[:INTERESTED_IN]->(s:IntentSignal {type: "sponsorship_seeking"})
         WITH count(DISTINCT c) AS total, count(DISTINCT s) AS seeking
         RETURN CASE WHEN total > 0 THEN 1.0 - toFloat(seeking) / toFloat(total) ELSE 0.5 END AS ease`,
        { source: source.toLowerCase() },
      );
      return (result[0]?.ease as number) || 0.5;
    } catch { return 0.5; }
  }

  private async computeMigrationStability(source: string, destination: string): Promise<number> {
    try {
      const result = await runCypher(
        `MATCH (src:Location {name: $source})<-[:LOCATED_IN]-(c:Candidate)
         OPTIONAL MATCH (c)-[:INTERESTED_IN]->(career:IntentSignal {type: "career_change"})
         WITH count(DISTINCT c) AS total, count(DISTINCT career) AS volatile
         RETURN CASE WHEN total > 0 THEN 1.0 - toFloat(volatile) / toFloat(total) ELSE 0.6 END AS stability`,
        { source: source.toLowerCase() },
      );
      return (result[0]?.stability as number) || 0.6;
    } catch { return 0.6; }
  }

  private async computeRetentionQuality(source: string, destination: string): Promise<number> {
    try {
      const flowRows = await db
        .select({ avgStability: avg(migrationCorridors.retentionRate) })
        .from(migrationCorridors)
        .where(
          and(
            eq(migrationCorridors.sourceCountry, source),
            eq(migrationCorridors.destinationCountry, destination),
          ),
        );
      return Number(flowRows[0]?.avgStability) || 0.5;
    } catch { return 0.5; }
  }

  private async computeSalaryUplift(source: string, destination: string): Promise<number> {
    const gccCountries = ["qatar", "uae", "saudi arabia", "kuwait", "bahrain", "oman"];
    const dest = destination.toLowerCase();
    if (gccCountries.some(c => dest.includes(c))) return 40;
    return 10;
  }

  private async computeEmployerConfidence(source: string, destination: string): Promise<number> {
    const gccCountries = ["qatar", "uae", "saudi arabia", "kuwait", "bahrain", "oman"];
    const dest = destination.toLowerCase();
    if (gccCountries.some(c => dest.includes(c))) return 0.75;
    return 0.5;
  }

  private async getTopSkillsExported(source: string, destination: string): Promise<string[]> {
    try {
      const result = await runCypher(
        `MATCH (src:Location {name: $source})<-[:LOCATED_IN]-(c:Candidate)
         MATCH (c)-[:HAS_SKILL]->(s:Skill)
         RETURN s.name AS skill, count(DISTINCT c) AS count
         ORDER BY count DESC LIMIT 10`,
        { source: source.toLowerCase() },
      );
      return result.map((r: any) => r.skill as string).filter(Boolean);
    } catch { return []; }
  }

  private async getTopRolesDemanded(source: string, destination: string): Promise<string[]> {
    try {
      const result = await runCypher(
        `MATCH (dst:Location {name: $destination})<-[:LOCATED_IN]-(c:Candidate)
         MATCH (c)-[:MATCHES]->(r:JobRole)
         RETURN r.name AS role, count(DISTINCT c) AS count
         ORDER BY count DESC LIMIT 10`,
        { destination: destination.toLowerCase() },
      );
      return result.map((r: any) => r.role as string).filter(Boolean);
    } catch { return []; }
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

  private async getActiveInPipeline(source: string, destination: string): Promise<number> {
    try {
      const result = await runCypher(
        `MATCH (c:Candidate)-[:LOCATED_IN]->(src:Location {name: $source})
         OPTIONAL MATCH (c)-[:INTERESTED_IN]->(int:IntentSignal {type: "relocation_intent"})
         WHERE int IS NOT NULL
         RETURN count(DISTINCT c) AS inPipeline`,
        { source: source.toLowerCase() },
      );
      return (result[0]?.inPipeline as number) || 0;
    } catch { return 0; }
  }

  private async discoverCorridors(): Promise<Array<{ source: string; destination: string }>> {
    const corridors: Array<{ source: string; destination: string }> = [];
    try {
      const result = await runCypher(
        `MATCH (src:Location)<-[:LOCATED_IN]-(c:Candidate)
         OPTIONAL MATCH (c)-[:INTERESTED_IN]->(int:IntentSignal {type: "relocation_intent"})
         WHERE int IS NOT NULL
         WITH src, count(DISTINCT c) AS flow
         MATCH (c2:Candidate)-[:LOCATED_IN]->(src)
         MATCH (c2)-[:INTERESTED_IN]->(reloc:IntentSignal {type: "relocation_intent"})
         OPTIONAL MATCH (reloc)-[:TARGETS]->(dst:Location)
         WHERE dst IS NOT NULL
         RETURN src.name AS source, dst.name AS destination, count(DISTINCT c2) AS volume
         ORDER BY volume DESC LIMIT 50`,
      );
      for (const row of result) {
        corridors.push({ source: row.source as string, destination: row.destination as string });
      }
    } catch (err) {
      logger.error({ err }, "Failed to discover corridors from graph");
    }
    if (corridors.length === 0) {
      corridors.push(
        { source: "uganda", destination: "qatar" },
        { source: "kenya", destination: "uae" },
        { source: "nigeria", destination: "saudi arabia" },
        { source: "egypt", destination: "kuwait" },
        { source: "india", destination: "uae" },
        { source: "pakistan", destination: "saudi arabia" },
        { source: "philippines", destination: "qatar" },
        { source: "bangladesh", destination: "oman" },
        { source: "ghana", destination: "bahrain" },
        { source: "ethiopia", destination: "qatar" },
      );
    }
    return corridors;
  }

  private async persistCorridorMetrics(
    source: string, destination: string, intelligence: CorridorIntelligence,
  ): Promise<void> {
    try {
      await db.insert(corridorMetrics).values({
        sourceCountry: source,
        destinationCountry: destination,
        demandScore: intelligence.demandScore,
        supplyScore: intelligence.supplyScore,
        sponsorshipEase: intelligence.sponsorshipEase,
        migrationStability: intelligence.migrationStability,
        retentionQuality: intelligence.retentionQuality,
        salaryUplift: intelligence.salaryUplift,
        employerConfidence: intelligence.employerConfidence,
        healthScore: intelligence.healthScore,
        totalMigrated: intelligence.totalMigrated,
        activeInPipeline: intelligence.activeInPipeline,
        topSkillsExported: intelligence.topSkillsExported,
        topRolesDemanded: intelligence.topRolesDemanded,
        periodStart: new Date(Date.now() - 90 * 86400000),
        periodEnd: new Date(),
        metadata: {},
      }).onConflictDoNothing();
    } catch (err) {
      logger.error({ err, source, destination }, "Failed to persist corridor metrics");
    }
  }
}

export const migrationIntelligence = new MigrationIntelligence();
