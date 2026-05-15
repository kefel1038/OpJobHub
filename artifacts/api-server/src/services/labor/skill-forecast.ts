import { db, skillForecasts, skillTrends, discoveredCandidates } from "@workspace/db";
import { eq, and, gte, lte, desc, sql, count, avg } from "drizzle-orm";
import { logger } from "../../lib/logger";
import { runCypher } from "../../lib/neo4j";
import { confidenceEngine } from "./confidence-engine";

export interface SkillForecastResult {
  skillName: string;
  forecastType: string;
  predictedDemand: number;
  predictedSupply: number;
  predictedScarcityIndex: number;
  emergenceProbability: number;
  declineProbability: number;
  adjacencyTargets: string[];
  confidence: number;
  trendDirection: string;
  keyDrivers: string[];
  horizon: string;
}

class SkillForecastService {
  async forecastSkillDemand(skillName: string, horizon = "90d"): Promise<SkillForecastResult> {
    const days = this.horizonToDays(horizon);
    const windowDays = Math.max(days * 2, 90);

    const trends = await db
      .select()
      .from(skillTrends)
      .where(
        and(
          eq(skillTrends.skillName, skillName),
          gte(skillTrends.createdAt, new Date(Date.now() - windowDays * 86400000)),
        ),
      )
      .orderBy(desc(skillTrends.createdAt))
      .limit(20);

    const demandScores = trends.map(t => t.demandScore).filter((v): v is number => v !== null);
    const growthRates = trends.map(t => t.growthRate).filter((v): v is number => v !== null);
    const currentDemand = demandScores[0] || 0.5;
    const avgGrowth = growthRates.length > 0
      ? growthRates.reduce((a, b) => a + b, 0) / growthRates.length
      : 0;

    const graphSupply = await this.getGraphSkillSupply(skillName);
    const graphMomentum = Math.min(0.2, graphSupply * 0.01);

    const predictedDemand = Math.max(0, Math.min(1, currentDemand * (1 + avgGrowth) + graphMomentum));
    const predictedSupply = Math.max(0, Math.min(1, 0.5 + graphMomentum * 2));
    const predictedScarcity = Math.max(0, predictedDemand - predictedSupply);

    const emergenceProb = this.computeEmergenceProbability(currentDemand, avgGrowth, graphSupply);
    const declineProb = this.computeDeclineProbability(currentDemand, avgGrowth);

    const adjacencies = await this.getSkillAdjacencies(skillName);
    const interval = confidenceEngine.computeConfidenceInterval(demandScores.length > 0 ? demandScores : [0.5], predictedDemand);

    const drivers: string[] = [];
    if (avgGrowth > 0.05) drivers.push(`Demand growth accelerating (${Math.round(avgGrowth * 100)}%)`);
    if (graphSupply > 20) drivers.push(`Strong talent pool (${graphSupply} candidates)`);
    if (emergenceProb > 0.5) drivers.push("High emergence potential");
    if (predictedScarcity > 0.3) drivers.push("Supply-demand gap widening");

    return {
      skillName,
      forecastType: "skill_demand",
      predictedDemand: Math.round(predictedDemand * 100) / 100,
      predictedSupply: Math.round(predictedSupply * 100) / 100,
      predictedScarcityIndex: Math.round(predictedScarcity * 100) / 100,
      emergenceProbability: Math.round(emergenceProb * 100) / 100,
      declineProbability: Math.round(declineProb * 100) / 100,
      adjacencyTargets: adjacencies.slice(0, 5),
      confidence: interval.confidence,
      trendDirection: predictedDemand > currentDemand ? "rising" : predictedDemand < currentDemand ? "declining" : "stable",
      keyDrivers: drivers,
      horizon,
    };
  }

  async forecastSkillScarcity(skillName: string, horizon = "90d"): Promise<SkillForecastResult> {
    const demand = await this.forecastSkillDemand(skillName, horizon);
    const predictedScarcity = Math.max(0, demand.predictedDemand - demand.predictedSupply);

    const scarcityDrivers = [...demand.keyDrivers];
    if (predictedScarcity > 0.3) scarcityDrivers.push(`Critical scarcity predicted (${Math.round(predictedScarcity * 100)}%)`);

    return {
      ...demand,
      forecastType: "skill_scarcity",
      predictedScarcityIndex: Math.round(predictedScarcity * 100) / 100,
      keyDrivers: scarcityDrivers,
    };
  }

  async forecastAllSkills(horizon = "90d"): Promise<SkillForecastResult[]> {
    const topSkills = await db
      .select({ skillName: skillTrends.skillName })
      .from(skillTrends)
      .groupBy(skillTrends.skillName)
      .orderBy(desc(sql`max(${skillTrends.demandScore})`))
      .limit(20)
      .then(rows => rows.map(r => r.skillName));

    const results: SkillForecastResult[] = [];
    for (const skill of topSkills) {
      try {
        results.push(await this.forecastSkillDemand(skill, horizon));
      } catch (err) {
        logger.error({ err, skill }, "Failed to forecast skill");
      }
    }
    return results;
  }

  async predictEmergingSkills(horizon = "90d"): Promise<Array<{ skill: string; probability: number; adjacencies: string[] }>> {
    const allForecasts = await this.forecastAllSkills(horizon);
    return allForecasts
      .filter(f => f.emergenceProbability > 0.4)
      .sort((a, b) => b.emergenceProbability - a.emergenceProbability)
      .map(f => ({ skill: f.skillName, probability: f.emergenceProbability, adjacencies: f.adjacencyTargets }));
  }

  async predictDecliningSkills(horizon = "90d"): Promise<Array<{ skill: string; probability: number }>> {
    const allForecasts = await this.forecastAllSkills(horizon);
    return allForecasts
      .filter(f => f.declineProbability > 0.3)
      .sort((a, b) => b.declineProbability - a.declineProbability)
      .map(f => ({ skill: f.skillName, probability: f.declineProbability }));
  }

  async getSkillForecastHistory(skillName?: string, limit = 50): Promise<Array<Record<string, unknown>>> {
    const conditions = [gte(skillForecasts.createdAt, new Date(Date.now() - 365 * 86400000))];
    if (skillName) conditions.push(eq(skillForecasts.skillName, skillName));
    return db
      .select()
      .from(skillForecasts)
      .where(and(...conditions))
      .orderBy(desc(skillForecasts.createdAt))
      .limit(limit);
  }

  private async getGraphSkillSupply(skillName: string): Promise<number> {
    try {
      const result = await runCypher(
        `MATCH (s:Skill {name: $skill})<-[:HAS_SKILL]-(c:Candidate)
         RETURN count(DISTINCT c) AS supply`,
        { skill: skillName.toLowerCase() },
      );
      return (result[0]?.supply as number) || 0;
    } catch { return 0; }
  }

  private async getSkillAdjacencies(skillName: string): Promise<string[]> {
    try {
      const result = await runCypher(
        `MATCH (s:Skill {name: $skill})-[:ADJACENT_TO]->(adj:Skill)
         RETURN adj.name AS skill, count(*) AS weight
         ORDER BY weight DESC LIMIT 10`,
        { skill: skillName.toLowerCase() },
      );
      return result.map((r: any) => r.skill as string).filter(Boolean);
    } catch { return []; }
  }

  private computeEmergenceProbability(currentDemand: number, growthRate: number, candidateCount: number): number {
    const demandFactor = currentDemand > 0.6 ? 0.3 : currentDemand > 0.4 ? 0.2 : 0.1;
    const growthFactor = Math.min(0.4, Math.max(0, growthRate * 2));
    const supplyFactor = candidateCount > 50 ? -0.2 : candidateCount > 20 ? -0.1 : 0.1;
    return Math.max(0, Math.min(1, demandFactor + growthFactor + supplyFactor));
  }

  private computeDeclineProbability(currentDemand: number, growthRate: number): number {
    if (currentDemand < 0.3) return Math.min(0.8, 0.4 + Math.abs(growthRate));
    if (growthRate < -0.1) return Math.min(0.7, Math.abs(growthRate) * 2);
    return 0.1;
  }

  private horizonToDays(horizon: string): number {
    const map: Record<string, number> = { "30d": 30, "90d": 90, "180d": 180, "1y": 365 };
    return map[horizon] || 90;
  }
}

export const skillForecastService = new SkillForecastService();
