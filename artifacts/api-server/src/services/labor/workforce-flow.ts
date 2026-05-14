import { db, workforceFlows, discoveredCandidates, intentSignals } from "@workspace/db";
import { eq, and, gte, lte, desc, sql, count } from "drizzle-orm";
import { logger } from "../../lib/logger";
import { runCypher } from "../../lib/neo4j";

export interface FlowRecord {
  flowType: string;
  sourceRegion?: string;
  destinationRegion?: string;
  sourceIndustry?: string;
  destinationIndustry?: string;
  sourceSkill?: string;
  destinationSkill?: string;
  flowVolume: number;
  flowVelocity: number;
  confidence: number;
}

class WorkforceFlowAnalyzer {
  async analyzeMigrationFlows(windowDays = 90): Promise<FlowRecord[]> {
    const flows: FlowRecord[] = [];

    try {
      const result = await runCypher(
        `MATCH (c:Candidate)-[:LOCATED_IN]->(src:Location)
         OPTIONAL MATCH (c)-[:INTERESTED_IN]->(reloc:IntentSignal {type: "relocation_intent"})
         WHERE reloc IS NOT NULL
         WITH src, count(DISTINCT c) AS pool
         MATCH (c2:Candidate)-[:LOCATED_IN]->(src)-[:RELOCATION_TARGET]->(dst:Location)
         WHERE (c2)-[:INTERESTED_IN]->(:IntentSignal {type: "relocation_intent"})
         RETURN src.name AS source, dst.name AS destination, count(DISTINCT c2) AS volume
         ORDER BY volume DESC LIMIT 50`,
      );

      for (const row of result) {
        flows.push({
          flowType: "migration",
          sourceRegion: row.source as string,
          destinationRegion: row.destination as string,
          flowVolume: (row.volume as number) || 0,
          flowVelocity: 0,
          confidence: 0.6,
        });
      }
    } catch (err) {
      logger.error({ err }, "Failed to analyze migration flows from graph");
    }

    if (flows.length === 0) {
      const signalFlows = await this.getMigrationFlowsFromSignals(windowDays);
      flows.push(...signalFlows);
    }

    for (const flow of flows) {
      await this.persistFlow(flow, windowDays);
    }

    return flows;
  }

  async analyzeIndustryTransitions(windowDays = 90): Promise<FlowRecord[]> {
    const flows: FlowRecord[] = [];

    try {
      const result = await runCypher(
        `MATCH (c:Candidate)
         WHERE c.industry IS NOT NULL AND c.previousIndustries IS NOT NULL
         WITH c, c.industry AS current, c.previousIndustries AS prev
         UNWIND prev AS previousIndustry
         WITH previousIndustry, current, count(DISTINCT c) AS volume
         WHERE previousIndustry <> current
         RETURN previousIndustry AS source, current AS destination, volume
         ORDER BY volume DESC LIMIT 50`,
      );

      for (const row of result) {
        flows.push({
          flowType: "industry_transition",
          sourceIndustry: row.source as string,
          destinationIndustry: row.destination as string,
          flowVolume: (row.volume as number) || 0,
          flowVelocity: 0,
          confidence: 0.5,
        });
      }
    } catch (err) {
      logger.error({ err }, "Failed to analyze industry transitions");
    }

    for (const flow of flows) {
      await this.persistFlow(flow, windowDays);
    }

    return flows;
  }

  async analyzeSkillTransitions(windowDays = 90): Promise<FlowRecord[]> {
    const flows: FlowRecord[] = [];

    try {
      const result = await runCypher(
        `MATCH (s1:Skill)<-[:HAS_SKILL]-(c:Candidate)-[:HAS_SKILL]->(s2:Skill)
         WHERE s1.name <> s2.name
         WITH s1.name AS sourceSkill, s2.name AS destSkill, count(DISTINCT c) AS volume
         ORDER BY volume DESC LIMIT 100`,
      );

      for (const row of result) {
        flows.push({
          flowType: "skill_transition",
          sourceSkill: row.sourceSkill as string,
          destinationSkill: row.destSkill as string,
          flowVolume: (row.volume as number) || 0,
          flowVelocity: 0,
          confidence: 0.7,
        });
      }
    } catch (err) {
      logger.error({ err }, "Failed to analyze skill transitions");
    }

    for (const flow of flows) {
      await this.persistFlow(flow, windowDays);
    }

    return flows;
  }

  async analyzeAllFlows(windowDays = 90): Promise<Record<string, FlowRecord[]>> {
    const [migration, industry, skill] = await Promise.all([
      this.analyzeMigrationFlows(windowDays),
      this.analyzeIndustryTransitions(windowDays),
      this.analyzeSkillTransitions(windowDays),
    ]);

    return { migration, industry_transitions: industry, skill_transitions: skill };
  }

  async getFlowHistory(flowType?: string, limit = 50): Promise<Array<Record<string, unknown>>> {
    const conditions = flowType
      ? eq(workforceFlows.flowType, flowType)
      : undefined;

    const query = conditions
      ? db.select().from(workforceFlows).where(conditions).orderBy(desc(workforceFlows.createdAt)).limit(limit)
      : db.select().from(workforceFlows).orderBy(desc(workforceFlows.createdAt)).limit(limit);

    return query;
  }

  private async getMigrationFlowsFromSignals(windowDays: number): Promise<FlowRecord[]> {
    const windowStart = new Date(Date.now() - windowDays * 86400000);
    const signals = await db
      .select({
        location: discoveredCandidates.location,
        count: count(),
      })
      .from(intentSignals)
      .innerJoin(
        discoveredCandidates,
        eq(intentSignals.candidateId, discoveredCandidates.id),
      )
      .where(
        and(
          eq(intentSignals.signalType, "relocation_intent"),
          gte(intentSignals.createdAt, windowStart),
        ),
      )
      .groupBy(discoveredCandidates.location)
      .orderBy(desc(count()))
      .limit(20);

    return signals.map(s => ({
      flowType: "migration" as const,
      sourceRegion: s.location || "unknown",
      destinationRegion: "gcc",
      flowVolume: s.count,
      flowVelocity: 0,
      confidence: 0.4,
    }));
  }

  private async persistFlow(flow: FlowRecord, windowDays: number): Promise<void> {
    try {
      await db.insert(workforceFlows).values({
        flowType: flow.flowType,
        sourceRegion: flow.sourceRegion || null,
        destinationRegion: flow.destinationRegion || null,
        sourceIndustry: flow.sourceIndustry || null,
        destinationIndustry: flow.destinationIndustry || null,
        sourceSkill: flow.sourceSkill || null,
        destinationSkill: flow.destinationSkill || null,
        flowVolume: flow.flowVolume,
        flowVelocity: flow.flowVelocity,
        confidence: flow.confidence,
        periodStart: new Date(Date.now() - windowDays * 86400000),
        periodEnd: new Date(),
        metadata: {},
      }).onConflictDoNothing();
    } catch (err) {
      logger.error({ err, flowType: flow.flowType }, "Failed to persist workforce flow");
    }
  }
}

export const workforceFlowAnalyzer = new WorkforceFlowAnalyzer();
