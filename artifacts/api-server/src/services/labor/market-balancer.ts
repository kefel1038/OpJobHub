import { db, marketBalanceSnapshots, laborMetrics, migrationEvents, sponsorshipOutcomes } from "@workspace/db";
import { eq, and, gte, lte, desc, sql, count, avg } from "drizzle-orm";
import { logger } from "../../lib/logger";
import { runCypher } from "../../lib/neo4j";

export interface MarketBalanceResult {
  targetName: string;
  snapshotType: string;
  demandIndex: number;
  supplyIndex: number;
  scarcityIndex: number;
  migrationPressure: number;
  sponsorshipPressure: number;
  wagePressure: number;
  churnRate: number;
  balanceScore: number;
  imbalanceDirection: "surplus" | "shortage" | "stable";
  topDrivers: string[];
}

class MarketBalancer {
  async assessRoleBalance(role: string, region?: string): Promise<MarketBalanceResult> {
    const windowDays = 90;

    const demandMetrics = await db
      .select()
      .from(laborMetrics)
      .where(
        and(
          eq(laborMetrics.metricType, "demand_index"),
          eq(laborMetrics.role || "", role),
          gte(laborMetrics.createdAt, new Date(Date.now() - windowDays * 86400000)),
        ),
      )
      .orderBy(desc(laborMetrics.createdAt))
      .limit(10);

    const supplyMetrics = await db
      .select()
      .from(laborMetrics)
      .where(
        and(
          eq(laborMetrics.metricType, "supply_index"),
          eq(laborMetrics.role || "", role),
          gte(laborMetrics.createdAt, new Date(Date.now() - windowDays * 86400000)),
        ),
      )
      .orderBy(desc(laborMetrics.createdAt))
      .limit(10);

    const demand = demandMetrics.map(m => m.metricValue).filter((v): v is number => v !== null);
    const supply = supplyMetrics.map(m => m.metricValue).filter((v): v is number => v !== null);

    const demandIndex = demand[0] || 0.5;
    const supplyIndex = supply[0] || 0.5;
    const scarcityIndex = Math.max(0, demandIndex - supplyIndex);

    const migrationPressure = await this.computeMigrationPressure(role);
    const sponsorshipPressure = await this.computeSponsorshipPressure(role);
    const wagePressure = await this.computeWagePressure(role);
    const churnRate = await this.computeChurnRate(role);

    const balanceScore = Math.max(0, Math.min(1, 1 - scarcityIndex * 1.5));
    const imbalanceDirection: "surplus" | "shortage" | "stable" =
      scarcityIndex > 0.3 ? "shortage" : scarcityIndex < -0.2 ? "surplus" : "stable";

    const drivers: string[] = [];
    if (scarcityIndex > 0.3) drivers.push(`Talent gap: ${Math.round(scarcityIndex * 100)}%`);
    if (migrationPressure > 0.5) drivers.push(`High migration dependency: ${Math.round(migrationPressure * 100)}%`);
    if (sponsorshipPressure > 0.5) drivers.push(`Elevated sponsorship pressure: ${Math.round(sponsorshipPressure * 100)}%`);
    if (wagePressure > 0.5) drivers.push(`Wage inflation pressure: ${Math.round(wagePressure * 100)}%`);
    if (churnRate > 0.3) drivers.push(`Churn rate: ${Math.round(churnRate * 100)}%`);

    const label = region ? `${role} in ${region}` : role;
    const result: MarketBalanceResult = {
      targetName: label,
      snapshotType: "role",
      demandIndex: Math.round(demandIndex * 100) / 100,
      supplyIndex: Math.round(supplyIndex * 100) / 100,
      scarcityIndex: Math.round(scarcityIndex * 100) / 100,
      migrationPressure: Math.round(migrationPressure * 100) / 100,
      sponsorshipPressure: Math.round(sponsorshipPressure * 100) / 100,
      wagePressure: Math.round(wagePressure * 100) / 100,
      churnRate: Math.round(churnRate * 100) / 100,
      balanceScore: Math.round(balanceScore * 100) / 100,
      imbalanceDirection,
      topDrivers: drivers.slice(0, 5),
    };

    await this.persistSnapshot(result);
    return result;
  }

  async assessCorridorBalance(source: string, destination: string): Promise<MarketBalanceResult> {
    const windowDays = 90;

    const events = await db
      .select({ count: count() })
      .from(migrationEvents)
      .where(
        and(
          eq(migrationEvents.sourceCountry, source),
          eq(migrationEvents.destinationCountry, destination),
          gte(migrationEvents.createdAt, new Date(Date.now() - windowDays * 86400000)),
        ),
      );

    const completedEvents = await db
      .select({ count: count() })
      .from(migrationEvents)
      .where(
        and(
          eq(migrationEvents.sourceCountry, source),
          eq(migrationEvents.destinationCountry, destination),
          eq(migrationEvents.eventType, "relocation_completed"),
          gte(migrationEvents.createdAt, new Date(Date.now() - windowDays * 86400000)),
        ),
      );

    const total = events[0]?.count || 0;
    const completed = completedEvents[0]?.count || 0;
    const flowEfficiency = total > 0 ? completed / total : 0.5;

    const demandIndex = Math.min(1, total / 30);
    const supplyIndex = await this.computeCorridorSupply(source);
    const scarcityIndex = Math.max(0, demandIndex - supplyIndex);

    const sponsorshipPressure = await this.computeCorridorSponsorshipPressure(source, destination);
    const migrationPressure = Math.min(1, total / 20);
    const churnRate = await this.computeCorridorChurn(source, destination);

    const balanceScore = Math.max(0, Math.min(1, flowEfficiency * 0.4 + (1 - scarcityIndex) * 0.3 + (1 - sponsorshipPressure) * 0.3));
    const imbalanceDirection: "surplus" | "shortage" | "stable" =
      scarcityIndex > 0.3 ? "shortage" : demandIndex < 0.2 ? "surplus" : "stable";

    const drivers: string[] = [];
    if (scarcityIndex > 0.3) drivers.push(`Supply-demand gap: ${Math.round(scarcityIndex * 100)}%`);
    if (flowEfficiency < 0.5) drivers.push(`Low flow efficiency: ${Math.round(flowEfficiency * 100)}%`);
    if (sponsorshipPressure > 0.5) drivers.push("Elevated sponsorship rejection");

    const label = `${source} → ${destination}`;
    const result: MarketBalanceResult = {
      targetName: label,
      snapshotType: "corridor",
      demandIndex: Math.round(demandIndex * 100) / 100,
      supplyIndex: Math.round(supplyIndex * 100) / 100,
      scarcityIndex: Math.round(scarcityIndex * 100) / 100,
      migrationPressure: Math.round(migrationPressure * 100) / 100,
      sponsorshipPressure: Math.round(sponsorshipPressure * 100) / 100,
      wagePressure: 0.5,
      churnRate: Math.round(churnRate * 100) / 100,
      balanceScore: Math.round(balanceScore * 100) / 100,
      imbalanceDirection,
      topDrivers: drivers.slice(0, 5),
    };

    await this.persistSnapshot(result);
    return result;
  }

  async assessAllBalances(): Promise<MarketBalanceResult[]> {
    const results: MarketBalanceResult[] = [];

    const topRoles = await db
      .select({ role: laborMetrics.role })
      .from(laborMetrics)
      .where(eq(laborMetrics.metricType, "demand_index"))
      .groupBy(laborMetrics.role)
      .orderBy(desc(sql`max(${laborMetrics.metricValue})`))
      .limit(10)
      .then(rows => rows.map(r => r.role).filter(Boolean) as string[]);

    for (const role of topRoles) {
      try { results.push(await this.assessRoleBalance(role)); }
      catch (err) { logger.error({ err, role }, "Role balance assessment failed"); }
    }

    return results;
  }

  async getBalanceHistory(limit = 50): Promise<Array<Record<string, unknown>>> {
    return db
      .select()
      .from(marketBalanceSnapshots)
      .orderBy(desc(marketBalanceSnapshots.createdAt))
      .limit(limit);
  }

  private async computeMigrationPressure(role: string): Promise<number> {
    try {
      const result = await runCypher(
        `MATCH (r:JobRole {name: $role})<-[:MATCHES]-(c:Candidate)
         MATCH (c)-[:INTERESTED_IN]->(int:IntentSignal {type: "relocation_intent"})
         RETURN count(DISTINCT c) AS migrating, count(DISTINCT c) AS total`,
        { role: role.toLowerCase() },
      );
      const total = (result[0]?.total as number) || 1;
      const migrating = (result[0]?.migrating as number) || 0;
      return Math.min(1, migrating / Math.max(total, 1));
    } catch { return 0.3; }
  }

  private async computeSponsorshipPressure(role: string): Promise<number> {
    try {
      const result = await runCypher(
        `MATCH (r:JobRole {name: $role})<-[:MATCHES]-(c:Candidate)
         MATCH (c)-[:INTERESTED_IN]->(s:IntentSignal {type: "sponsorship_seeking"})
         RETURN count(DISTINCT s) AS seeking, count(DISTINCT c) AS total`,
        { role: role.toLowerCase() },
      );
      const total = (result[0]?.total as number) || 1;
      const seeking = (result[0]?.seeking as number) || 0;
      return Math.min(1, seeking / Math.max(total, 1));
    } catch { return 0.3; }
  }

  private async computeWagePressure(role: string): Promise<number> {
    const metrics = await db
      .select()
      .from(laborMetrics)
      .where(
        and(
          eq(laborMetrics.metricType, "wage_pressure"),
          eq(laborMetrics.role || "", role),
          gte(laborMetrics.createdAt, new Date(Date.now() - 90 * 86400000)),
        ),
      )
      .orderBy(desc(laborMetrics.createdAt))
      .limit(5);
    const vals = metrics.map(m => m.metricValue).filter((v): v is number => v !== null);
    return vals[0] || 0.3;
  }

  private async computeChurnRate(role: string): Promise<number> {
    try {
      const result = await runCypher(
        `MATCH (r:JobRole {name: $role})<-[:MATCHES]-(c:Candidate)
         OPTIONAL MATCH (c)-[:INTERESTED_IN]->(int:IntentSignal)
         WHERE int.type IN ["career_change", "immediate_availability"]
         RETURN count(DISTINCT c) AS total,
                count(DISTINCT int) AS volatile`,
        { role: role.toLowerCase() },
      );
      const total = (result[0]?.total as number) || 1;
      const volatile = (result[0]?.volatile as number) || 0;
      return Math.min(1, volatile / Math.max(total, 1));
    } catch { return 0.2; }
  }

  private async computeCorridorSupply(source: string): Promise<number> {
    try {
      const result = await runCypher(
        `MATCH (l:Location {name: $source})<-[:LOCATED_IN]-(c:Candidate)
         RETURN count(DISTINCT c) AS supply`,
        { source: source.toLowerCase() },
      );
      return Math.min(1, ((result[0]?.supply as number) || 0) / 50);
    } catch { return 0.4; }
  }

  private async computeCorridorSponsorshipPressure(source: string, destination: string): Promise<number> {
    const rows = await db
      .select({
        rejected: sql`count(CASE WHEN ${sponsorshipOutcomes.status} = 'rejected' THEN 1 END)`,
        total: count(),
      })
      .from(sponsorshipOutcomes)
      .where(
        and(
          eq(sponsorshipOutcomes.nationality, source),
          eq(sponsorshipOutcomes.destinationCountry, destination),
          gte(sponsorshipOutcomes.createdAt, new Date(Date.now() - 180 * 86400000)),
        ),
      );
    const total = Number(rows[0]?.total) || 0;
    if (total === 0) return 0.3;
    const rejected = Number(rows[0]?.rejected) || 0;
    return rejected / total;
  }

  private async computeCorridorChurn(source: string, destination: string): Promise<number> {
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
          gte(migrationEvents.createdAt, new Date(Date.now() - 180 * 86400000)),
        ),
      );
    const completed = Number(events[0]?.completed) || 0;
    const failed = Number(events[0]?.failed) || 0;
    const total = completed + failed;
    return total > 0 ? failed / total : 0.1;
  }

  private async persistSnapshot(result: MarketBalanceResult): Promise<void> {
    try {
      await db.insert(marketBalanceSnapshots).values({
        snapshotType: result.snapshotType,
        targetName: result.targetName,
        demandIndex: result.demandIndex,
        supplyIndex: result.supplyIndex,
        scarcityIndex: result.scarcityIndex,
        migrationPressure: result.migrationPressure,
        sponsorshipPressure: result.sponsorshipPressure,
        wagePressure: result.wagePressure,
        churnRate: result.churnRate,
        balanceScore: result.balanceScore,
        imbalanceDirection: result.imbalanceDirection,
        topDrivers: result.topDrivers,
        metadata: {},
      });
    } catch (err) {
      logger.error({ err, target: result.targetName }, "Failed to persist balance snapshot");
    }
  }
}

export const marketBalancer = new MarketBalancer();
