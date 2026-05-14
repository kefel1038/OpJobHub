import { db, regionalSnapshots, laborMetrics, workforceFlows, skillTrends, discoveredCandidates, jobs } from "@workspace/db";
import { eq, and, gte, lte, desc, sql, count, avg } from "drizzle-orm";
import { logger } from "../../lib/logger";
import { runCypher } from "../../lib/neo4j";

export interface RegionalProfile {
  region: string;
  demandIndex: number;
  supplyIndex: number;
  talentScarcityScore: number;
  hiringVelocity: number;
  sponsorshipDemand: number;
  migrationInflow: number;
  migrationOutflow: number;
  topSkillsDemanded: string[];
  topSkillsSupplied: string[];
  topIndustries: string[];
  emergingSectors: string[];
}

export interface EcosystemHealth {
  overallHealth: number;
  marketEfficiency: number;
  laborMobility: number;
  skillAdaptability: number;
  employerConfidence: number;
  migrationActivity: number;
}

class EcosystemMetricsService {
  async computeRegionalProfile(region: string): Promise<RegionalProfile> {
    const demandIndex = await this.computeRegionalDemandIndex(region);
    const supplyIndex = await this.computeRegionalSupplyIndex(region);
    const talentScarcityScore = await this.computeScarcityScore(region);
    const hiringVelocity = await this.computeRegionalHiringVelocity(region);
    const sponsorshipDemand = await this.computeRegionalSponsorshipDemand(region);
    const migrationInflow = await this.computeMigrationFlow(region, "inflow");
    const migrationOutflow = await this.computeMigrationFlow(region, "outflow");
    const topSkillsDemanded = await this.getTopSkillsDemanded(region);
    const topSkillsSupplied = await this.getTopSkillsSupplied(region);
    const topIndustries = await this.getTopIndustries(region);
    const emergingSectors = await this.getEmergingSectors(region);

    const profile: RegionalProfile = {
      region, demandIndex, supplyIndex, talentScarcityScore, hiringVelocity,
      sponsorshipDemand, migrationInflow, migrationOutflow,
      topSkillsDemanded, topSkillsSupplied, topIndustries, emergingSectors,
    };

    await this.persistRegionalSnapshot(region, profile);
    return profile;
  }

  async computeEcosystemHealth(): Promise<EcosystemHealth> {
    const marketEfficiency = await this.computeMarketEfficiency();
    const laborMobility = await this.computeLaborMobility();
    const skillAdaptability = await this.computeSkillAdaptability();
    const employerConfidence = await this.computeEmployerConfidence();
    const migrationActivity = await this.computeMigrationActivity();

    const overallHealth = Math.round(
      (marketEfficiency + laborMobility + skillAdaptability + employerConfidence + migrationActivity) / 5 * 100,
    ) / 100;

    return {
      overallHealth,
      marketEfficiency,
      laborMobility,
      skillAdaptability,
      employerConfidence,
      migrationActivity,
    };
  }

  async getRegionalSnapshots(region?: string, limit = 10): Promise<Array<Record<string, unknown>>> {
    const conditions = region ? eq(regionalSnapshots.region, region) : undefined;
    const query = conditions
      ? db.select().from(regionalSnapshots).where(conditions).orderBy(desc(regionalSnapshots.snapshotDate)).limit(limit)
      : db.select().from(regionalSnapshots).orderBy(desc(regionalSnapshots.snapshotDate)).limit(limit);
    return query;
  }

  async getMetricsHistory(metricType?: string, region?: string, limit = 50): Promise<Array<Record<string, unknown>>> {
    const conditions = [];
    if (metricType) conditions.push(eq(laborMetrics.metricType, metricType));
    if (region) conditions.push(eq(laborMetrics.region, region));

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const query = where
      ? db.select().from(laborMetrics).where(where).orderBy(desc(laborMetrics.createdAt)).limit(limit)
      : db.select().from(laborMetrics).orderBy(desc(laborMetrics.createdAt)).limit(limit);
    return query;
  }

  private async computeRegionalDemandIndex(region: string): Promise<number> {
    try {
      const result = await runCypher(
        `MATCH (l:Location {name: $region})<-[:LOCATED_IN]-(c:Candidate)
         OPTIONAL MATCH (c)-[:MATCHES]->(r:JobRole)
         RETURN count(DISTINCT c) AS candidates, count(DISTINCT r) AS roles`,
        { region: region.toLowerCase() },
      );
      const roles = (result[0]?.roles as number) || 0;
      return Math.min(1, roles / 30);
    } catch { return 0.5; }
  }

  private async computeRegionalSupplyIndex(region: string): Promise<number> {
    try {
      const result = await runCypher(
        `MATCH (l:Location {name: $region})<-[:LOCATED_IN]-(c:Candidate)
         RETURN count(c) AS candidateCount`,
        { region: region.toLowerCase() },
      );
      return Math.min(1, ((result[0]?.candidateCount as number) || 0) / 100);
    } catch { return 0.5; }
  }

  private async computeScarcityScore(region: string): Promise<number> {
    const demand = await this.computeRegionalDemandIndex(region);
    const supply = await this.computeRegionalSupplyIndex(region);
    if (supply === 0) return 0.8;
    return Math.min(1, Math.max(0, (demand - supply) + 0.5));
  }

  private async computeRegionalHiringVelocity(region: string): Promise<number> {
    try {
      const result = await runCypher(
        `MATCH (l:Location {name: $region})<-[:LOCATED_IN]-(c:Candidate)
         MATCH (c)-[:MATCHES]->(r:JobRole)
         RETURN count(DISTINCT r) AS roleCount`,
        { region: region.toLowerCase() },
      );
      return Math.min(1, ((result[0]?.roleCount as number) || 0) / 20);
    } catch { return 0.5; }
  }

  private async computeRegionalSponsorshipDemand(region: string): Promise<number> {
    try {
      const result = await runCypher(
        `MATCH (l:Location {name: $region})<-[:LOCATED_IN]-(c:Candidate)
         OPTIONAL MATCH (c)-[:INTERESTED_IN]->(int:IntentSignal {type: "sponsorship_seeking"})
         WITH count(DISTINCT c) AS total, count(DISTINCT int) AS seeking
         RETURN CASE WHEN total > 0 THEN toFloat(seeking) / toFloat(total) ELSE 0.3 END AS rate`,
        { region: region.toLowerCase() },
      );
      return (result[0]?.rate as number) || 0.3;
    } catch { return 0.3; }
  }

  private async computeMigrationFlow(region: string, direction: "inflow" | "outflow"): Promise<number> {
    try {
      const flowRows = await db
        .select({ volume: sql`sum(${workforceFlows.flowVolume})` })
        .from(workforceFlows)
        .where(
          and(
            eq(workforceFlows.flowType, "migration"),
            direction === "inflow"
              ? eq(workforceFlows.destinationRegion, region)
              : eq(workforceFlows.sourceRegion, region),
          ),
        );
      return (flowRows[0]?.volume as number) || 0;
    } catch { return 0; }
  }

  private async getTopSkillsDemanded(region: string): Promise<string[]> {
    try {
      const result = await runCypher(
        `MATCH (l:Location {name: $region})<-[:LOCATED_IN]-(c:Candidate)
         MATCH (c)-[:MATCHES]->(r:JobRole)
         MATCH (r)-[:REQUIRES_SKILL]->(s:Skill)
         RETURN s.name AS skill, count(DISTINCT r) AS demand
         ORDER BY demand DESC LIMIT 10`,
        { region: region.toLowerCase() },
      );
      return result.map((r: any) => r.skill as string).filter(Boolean);
    } catch { return []; }
  }

  private async getTopSkillsSupplied(region: string): Promise<string[]> {
    try {
      const result = await runCypher(
        `MATCH (l:Location {name: $region})<-[:LOCATED_IN]-(c:Candidate)
         MATCH (c)-[:HAS_SKILL]->(s:Skill)
         RETURN s.name AS skill, count(DISTINCT c) AS supply
         ORDER BY supply DESC LIMIT 10`,
        { region: region.toLowerCase() },
      );
      return result.map((r: any) => r.skill as string).filter(Boolean);
    } catch { return []; }
  }

  private async getTopIndustries(region: string): Promise<string[]> {
    try {
      const result = await runCypher(
        `MATCH (l:Location {name: $region})<-[:LOCATED_IN]-(c:Candidate)
         MATCH (c)-[:BELONGS_TO]->(ind:Industry)
         RETURN ind.name AS industry, count(DISTINCT c) AS count
         ORDER BY count DESC LIMIT 10`,
        { region: region.toLowerCase() },
      );
      return result.map((r: any) => r.industry as string).filter(Boolean);
    } catch { return []; }
  }

  private async getEmergingSectors(region: string): Promise<string[]> {
    try {
      const recentTrends = await db
        .select({ industry: regionalSnapshots.emergingSectors })
        .from(regionalSnapshots)
        .where(
          and(
            eq(regionalSnapshots.region, region),
            sql`${regionalSnapshots.emergingSectors} IS NOT NULL`,
          ),
        )
        .orderBy(desc(regionalSnapshots.snapshotDate))
        .limit(5)
        .then(rows => rows.flatMap(r => (r.industry as string[]) || []));

      const unique = [...new Set(recentTrends)];
      return unique.length > 0 ? unique : ["Technology", "Renewable Energy", "Healthcare"];
    } catch { return []; }
  }

  private async computeMarketEfficiency(): Promise<number> {
    try {
      const activeJobs = await db
        .select({ count: count() })
        .from(jobs)
        .where(eq(jobs.status, "active"))
        .then(r => r[0]?.count || 1);

      const verifiedCandidates = await db
        .select({ count: count() })
        .from(discoveredCandidates)
        .where(eq(discoveredCandidates.verificationStatus, "verified"))
        .then(r => r[0]?.count || 1);

      const ratio = verifiedCandidates / Math.max(activeJobs, 1);
      return Math.min(1, Math.round(ratio * 100) / 100);
    } catch { return 0.5; }
  }

  private async computeLaborMobility(): Promise<number> {
    try {
      const flowRows = await db
        .select({ total: sql`sum(${workforceFlows.flowVolume})` })
        .from(workforceFlows)
        .where(eq(workforceFlows.flowType, "migration"));
      return Math.min(1, ((flowRows[0]?.total as number) || 0) / 1000);
    } catch { return 0.3; }
  }

  private async computeSkillAdaptability(): Promise<number> {
    try {
      const risingCount = await db
        .select({ count: count() })
        .from(skillTrends)
        .where(eq(skillTrends.trendType, "rising"))
        .then(r => r[0]?.count || 0);

      const totalCount = await db
        .select({ count: count() })
        .from(skillTrends)
        .then(r => r[0]?.count || 1);

      return Math.min(1, risingCount / Math.max(totalCount, 1));
    } catch { return 0.5; }
  }

  private async computeEmployerConfidence(): Promise<number> {
    try {
      const activeJobs = await db
        .select({ count: count() })
        .from(jobs)
        .where(
          and(eq(jobs.status, "active"), gte(jobs.createdAt, new Date(Date.now() - 30 * 86400000))),
        )
        .then(r => r[0]?.count || 0);

      return Math.min(1, activeJobs / 50);
    } catch { return 0.5; }
  }

  private async computeMigrationActivity(): Promise<number> {
    try {
      const flowRows = await db
        .select({ total: sql`sum(${workforceFlows.flowVolume})` })
        .from(workforceFlows)
        .where(eq(workforceFlows.flowType, "migration"));
      return Math.min(1, ((flowRows[0]?.total as number) || 0) / 500);
    } catch { return 0.3; }
  }

  private async persistRegionalSnapshot(region: string, profile: RegionalProfile): Promise<void> {
    try {
      await db.insert(regionalSnapshots).values({
        region,
        snapshotType: "full",
        totalCandidates: 0,
        totalEmployers: 0,
        totalJobs: 0,
        demandIndex: profile.demandIndex,
        supplyIndex: profile.supplyIndex,
        talentScarcityScore: profile.talentScarcityScore,
        hiringVelocity: profile.hiringVelocity,
        sponsorshipDemand: profile.sponsorshipDemand,
        migrationInflow: profile.migrationInflow,
        migrationOutflow: profile.migrationOutflow,
        topSkillsDemanded: profile.topSkillsDemanded,
        topSkillsSupplied: profile.topSkillsSupplied,
        topIndustries: profile.topIndustries,
        emergingSectors: profile.emergingSectors,
        snapshotDate: new Date(),
        metadata: {},
      }).onConflictDoNothing();
    } catch (err) {
      logger.error({ err, region }, "Failed to persist regional snapshot");
    }
  }
}

export const ecosystemMetricsService = new EcosystemMetricsService();
