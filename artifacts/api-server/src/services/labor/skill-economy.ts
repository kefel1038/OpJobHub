import { db, skillTrends, discoveredCandidates } from "@workspace/db";
import { eq, and, gte, lte, desc, sql, count } from "drizzle-orm";
import { logger } from "../../lib/logger";
import { runCypher } from "../../lib/neo4j";

export interface SkillEconomyRecord {
  skillName: string;
  trendType: "rising" | "declining" | "emerging" | "resurging" | "stable";
  demandScore: number;
  supplyScore: number;
  growthRate: number;
  adjacencyScore: number;
  industry?: string;
  region?: string;
  certificationMomentum: number;
  salaryPremium: number;
}

class SkillEconomyAnalyzer {
  async analyzeAllSkills(windowDays = 90): Promise<SkillEconomyRecord[]> {
    const graphSkills = await this.getGraphSkillMetrics(windowDays);
    const dbSkills = await this.getDatabaseSkillMetrics(windowDays);
    const merged = this.mergeSkillMetrics(graphSkills, dbSkills);

    for (const skill of merged) {
      await this.persistSkillTrend(skill, windowDays);
    }

    return merged;
  }

  async analyzeSkill(skillName: string, windowDays = 90): Promise<SkillEconomyRecord | null> {
    const graphMetrics = await this.getSingleSkillGraphMetrics(skillName, windowDays);
    return graphMetrics;
  }

  async getTrendingSkills(
    trendType?: string, limit = 20, region?: string, industry?: string,
  ): Promise<Array<Record<string, unknown>>> {
    const conditions = [];
    if (trendType) conditions.push(eq(skillTrends.trendType, trendType));
    if (region) conditions.push(eq(skillTrends.region, region));
    if (industry) conditions.push(eq(skillTrends.industry, industry));

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const query = where
      ? db.select().from(skillTrends).where(where).orderBy(desc(skillTrends.growthRate)).limit(limit)
      : db.select().from(skillTrends).orderBy(desc(skillTrends.growthRate)).limit(limit);

    return query;
  }

  async getSkillEconomySummary(): Promise<{
    rising: number; declining: number; emerging: number; total: number;
    topRising: string[]; topDeclining: string[];
  }> {
    const [rising, declining, emerging, total] = await Promise.all([
      db.select({ count: count() }).from(skillTrends).where(eq(skillTrends.trendType, "rising")).then(r => r[0]?.count || 0),
      db.select({ count: count() }).from(skillTrends).where(eq(skillTrends.trendType, "declining")).then(r => r[0]?.count || 0),
      db.select({ count: count() }).from(skillTrends).where(eq(skillTrends.trendType, "emerging")).then(r => r[0]?.count || 0),
      db.select({ count: count() }).from(skillTrends).then(r => r[0]?.count || 0),
    ]);

    const topRising = await db
      .select({ skillName: skillTrends.skillName })
      .from(skillTrends)
      .where(eq(skillTrends.trendType, "rising"))
      .orderBy(desc(skillTrends.growthRate))
      .limit(10)
      .then(r => r.map(x => x.skillName));

    const topDeclining = await db
      .select({ skillName: skillTrends.skillName })
      .from(skillTrends)
      .where(eq(skillTrends.trendType, "declining"))
      .orderBy(desc(skillTrends.growthRate))
      .limit(10)
      .then(r => r.map(x => x.skillName));

    return { rising, declining, emerging, total, topRising, topDeclining };
  }

  private async getGraphSkillMetrics(windowDays: number): Promise<SkillEconomyRecord[]> {
    const records: SkillEconomyRecord[] = [];

    try {
      const result = await runCypher(
        `MATCH (s:Skill)<-[:HAS_SKILL]-(c:Candidate)
         OPTIONAL MATCH (s)<-[:HAS_SKILL]-(c2:Candidate)
         WITH s, count(DISTINCT c) AS supply,
              count(DISTINCT c2) AS totalOwners
         MATCH (s)<-[:REQUIRES_SKILL]-(j:JobRole)
         WITH s, supply, count(DISTINCT j) AS demand
         RETURN s.name AS name, supply, demand,
                CASE WHEN supply > 0 THEN toFloat(demand) / toFloat(supply) ELSE 0 END AS ratio
         ORDER BY ratio DESC LIMIT 100`,
      );

      for (const row of result) {
        const name = row.name as string;
        const supply = (row.supply as number) || 0;
        const demand = (row.demand as number) || 0;
        const ratio = (row.ratio as number) || 0;

        let trendType: SkillEconomyRecord["trendType"] = "stable";
        if (ratio > 2) trendType = "rising";
        else if (ratio > 1.5) trendType = "emerging";
        else if (ratio < 0.3) trendType = "declining";
        else if (ratio > 1 && supply > 0) trendType = "resurging";

        const adjacencyScore = await this.getAdjacencyScore(name);

        records.push({
          skillName: name,
          trendType,
          demandScore: Math.min(1, demand / 20),
          supplyScore: Math.min(1, supply / 50),
          growthRate: Math.round(((ratio - 1) * 100) * 100) / 100,
          adjacencyScore,
          certificationMomentum: 0,
          salaryPremium: 0,
        });
      }
    } catch (err) {
      logger.error({ err }, "Failed to get graph skill metrics");
    }

    return records;
  }

  private async getDatabaseSkillMetrics(windowDays: number): Promise<SkillEconomyRecord[]> {
    return [];
  }

  private async getSingleSkillGraphMetrics(
    skillName: string, windowDays: number,
  ): Promise<SkillEconomyRecord | null> {
    try {
      const result = await runCypher(
        `MATCH (s:Skill {name: $skill})
         OPTIONAL MATCH (s)<-[:HAS_SKILL]-(c:Candidate)
         OPTIONAL MATCH (s)<-[:REQUIRES_SKILL]-(j:JobRole)
         RETURN s.name AS name,
                count(DISTINCT c) AS supply,
                count(DISTINCT j) AS demand`,
        { skill: skillName.toLowerCase() },
      );

      if (!result[0]) return null;

      const name = result[0].name as string;
      const supply = (result[0].supply as number) || 0;
      const demand = (result[0].demand as number) || 0;
      const ratio = supply > 0 ? demand / supply : 0;

      let trendType: SkillEconomyRecord["trendType"] = "stable";
      if (ratio > 2) trendType = "rising";
      else if (ratio > 1.5) trendType = "emerging";
      else if (ratio < 0.3) trendType = "declining";
      else if (ratio > 1 && supply > 0) trendType = "resurging";

      return {
        skillName: name,
        trendType,
        demandScore: Math.min(1, demand / 20),
        supplyScore: Math.min(1, supply / 50),
        growthRate: Math.round(((ratio - 1) * 100) * 100) / 100,
        adjacencyScore: await this.getAdjacencyScore(name),
        certificationMomentum: 0,
        salaryPremium: 0,
      };
    } catch (err) {
      logger.error({ err, skillName }, "Failed to get single skill graph metrics");
      return null;
    }
  }

  private async getAdjacencyScore(skillName: string): Promise<number> {
    try {
      const result = await runCypher(
        `MATCH (s:Skill {name: $skill})<-[:HAS_SKILL]-(c:Candidate)-[:HAS_SKILL]->(adj:Skill)
         WHERE adj.name <> $skill
         RETURN count(DISTINCT adj) AS adjCount`,
        { skill: skillName.toLowerCase() },
      );
      return Math.min(1, ((result[0]?.adjCount as number) || 0) / 15);
    } catch { return 0.3; }
  }

  private mergeSkillMetrics(
    graph: SkillEconomyRecord[], db: SkillEconomyRecord[],
  ): SkillEconomyRecord[] {
    const map = new Map<string, SkillEconomyRecord>();

    for (const s of graph) map.set(s.skillName, s);
    for (const s of db) {
      const existing = map.get(s.skillName);
      if (existing) {
        existing.demandScore = Math.max(existing.demandScore, s.demandScore);
        existing.supplyScore = Math.max(existing.supplyScore, s.supplyScore);
        existing.certificationMomentum = Math.max(existing.certificationMomentum, s.certificationMomentum);
      } else {
        map.set(s.skillName, s);
      }
    }

    return Array.from(map.values());
  }

  private async persistSkillTrend(skill: SkillEconomyRecord, windowDays: number): Promise<void> {
    try {
      await db.insert(skillTrends).values({
        skillName: skill.skillName,
        trendType: skill.trendType,
        demandScore: skill.demandScore,
        supplyScore: skill.supplyScore,
        growthRate: skill.growthRate,
        adjacencyScore: skill.adjacencyScore,
        industry: skill.industry || null,
        region: skill.region || null,
        certificationMomentum: skill.certificationMomentum,
        salaryPremium: skill.salaryPremium,
        windowStart: new Date(Date.now() - windowDays * 86400000),
        windowEnd: new Date(),
        metadata: {},
      }).onConflictDoNothing();
    } catch (err) {
      logger.error({ err, skillName: skill.skillName }, "Failed to persist skill trend");
    }
  }
}

export const skillEconomyAnalyzer = new SkillEconomyAnalyzer();
