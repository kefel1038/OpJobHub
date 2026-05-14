import { db, graphEvolution } from "@workspace/db";
import { eq, desc, sql, and, gte } from "drizzle-orm";
import { logger } from "../../lib/logger";
import { runCypher } from "../../lib/neo4j";
import { graphBuilder } from "./graph-builder";

class GraphEvolutionService {
  async takeSnapshot(): Promise<{
    id: number;
    snapshotDate: Date;
    nodeCounts: Record<string, number>;
  }> {
    const nodeCounts = await graphBuilder.getNodeCount();
    const relationshipCount = nodeCounts._relationships || 0;

    const topSkills = await this.getTopNodes("Skill", 20);
    const topLocations = await this.getTopNodes("Location", 20);
    const topIndustries = await this.getTopNodes("Industry", 20);
    const migrationFlowCount = await this.getMigrationFlowCount();
    const hiringPathwayCount = await this.getHiringPathwayCount();
    const skillDiversity = await this.getSkillDiversity();

    const prevSnapshot = await db.select()
      .from(graphEvolution)
      .orderBy(desc(graphEvolution.snapshotDate))
      .limit(1);

    const prevCounts: Record<string, number> = prevSnapshot[0]?.nodeCounts as Record<string, number> || {};
    const candidateGrowth = prevCounts.Candidate
      ? ((nodeCounts.Candidate || 0) - (prevCounts.Candidate || 0)) / prevCounts.Candidate
      : 0;

    const [result] = await db.insert(graphEvolution).values({
      nodeCounts,
      relationshipCount,
      skillClusterCount: topSkills.length,
      topSkills,
      topLocations,
      topIndustries,
      migrationFlowCount,
      hiringPathwayCount,
      candidateGrowth,
      skillDiversity,
      metadata: { previousSnapshotId: prevSnapshot[0]?.id || null },
    }).returning({ id: graphEvolution.id, snapshotDate: graphEvolution.snapshotDate, nodeCounts: graphEvolution.nodeCounts });

    logger.info({ snapshotId: result.id, nodeCounts }, "Graph evolution snapshot taken");
    return result as { id: number; snapshotDate: Date; nodeCounts: Record<string, number> };
  }

  async getEvolutionHistory(days = 30): Promise<any[]> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return db.select()
      .from(graphEvolution)
      .where(gte(graphEvolution.snapshotDate, since))
      .orderBy(desc(graphEvolution.snapshotDate))
      .limit(100);
  }

  async getGrowthTrends(): Promise<{
    candidateGrowth: Array<{ date: string; growth: number }>;
    skillGrowth: Array<{ date: string; skills: number }>;
    relationshipGrowth: Array<{ date: string; relationships: number }>;
  }> {
    const history = await db.select({
      snapshotDate: graphEvolution.snapshotDate,
      candidateGrowth: graphEvolution.candidateGrowth,
      relationshipCount: graphEvolution.relationshipCount,
      nodeCounts: graphEvolution.nodeCounts,
    })
      .from(graphEvolution)
      .orderBy(desc(graphEvolution.snapshotDate))
      .limit(60);

    return {
      candidateGrowth: history.map(h => ({
        date: new Date(h.snapshotDate).toISOString().split("T")[0],
        growth: Number(h.candidateGrowth || 0),
      })),
      skillGrowth: history.map(h => ({
        date: new Date(h.snapshotDate).toISOString().split("T")[0],
        skills: ((h.nodeCounts as Record<string, number>)?.Skill || 0),
      })),
      relationshipGrowth: history.map(h => ({
        date: new Date(h.snapshotDate).toISOString().split("T")[0],
        relationships: h.relationshipCount || 0,
      })),
    };
  }

  async getHotspotEvolution(days = 60): Promise<{
    location: string;
    snapshots: Array<{ date: string; count: number }>;
    growth: number;
  }[]> {
    const history = await db.select({
      snapshotDate: graphEvolution.snapshotDate,
      topLocations: graphEvolution.topLocations,
    })
      .from(graphEvolution)
      .where(gte(graphEvolution.snapshotDate, new Date(Date.now() - days * 24 * 60 * 60 * 1000)))
      .orderBy(desc(graphEvolution.snapshotDate))
      .limit(30);

    const locationMap = new Map<string, { date: string; count: number }[]>();

    for (const h of history) {
      const locs = (h.topLocations as Array<{ name: string; count: number }>) || [];
      const date = new Date(h.snapshotDate).toISOString().split("T")[0];
      for (const loc of locs) {
        if (!locationMap.has(loc.name)) locationMap.set(loc.name, []);
        locationMap.get(loc.name)!.push({ date, count: loc.count });
      }
    }

    return Array.from(locationMap.entries()).map(([location, snapshots]) => ({
      location,
      snapshots,
      growth: snapshots.length >= 2
        ? (snapshots[0].count - snapshots[snapshots.length - 1].count) / Math.max(snapshots[snapshots.length - 1].count, 1)
        : 0,
    })).sort((a, b) => b.growth - a.growth).slice(0, 10);
  }

  async getLatestSnapshot(): Promise<any> {
    const [latest] = await db.select()
      .from(graphEvolution)
      .orderBy(desc(graphEvolution.snapshotDate))
      .limit(1);
    return latest || null;
  }

  private async getTopNodes(label: string, limit = 20): Promise<Array<{ name: string; count: number }>> {
    try {
      const result = await runCypher(
        `MATCH (n:\`${label}\`)
         OPTIONAL MATCH (related)-[r]-(n)
         WITH n, count(r) AS relCount
         RETURN n.name AS name, relCount AS count
         ORDER BY count DESC
         LIMIT ${limit}`
      );
      return result.map((r: any) => ({ name: r.name as string, count: (r.count as number) || 0 }));
    } catch {
      return [];
    }
  }

  private async getMigrationFlowCount(): Promise<number> {
    try {
      const result = await runCypher(
        `MATCH (c:Candidate)-[:INTERESTED_IN]->(:IntentSignal {type: "relocation_intent"})
         RETURN count(DISTINCT c) AS count`
      );
      return (result[0]?.count as number) || 0;
    } catch {
      return 0;
    }
  }

  private async getHiringPathwayCount(): Promise<number> {
    try {
      const result = await runCypher(
        `MATCH (c:Candidate)-[:MATCHES]->(:JobRole)
         RETURN count(DISTINCT c) AS count`
      );
      return (result[0]?.count as number) || 0;
    } catch {
      return 0;
    }
  }

  private async getSkillDiversity(): Promise<number> {
    try {
      const result = await runCypher(
        `MATCH (c:Candidate)-[:HAS_SKILL]->(s:Skill)
         WITH c, count(s) AS skillCount
         RETURN avg(skillCount) AS avgSkills`
      );
      return (result[0]?.avgSkills as number) || 0;
    } catch {
      return 0;
    }
  }
}

export const graphEvolutionService = new GraphEvolutionService();
