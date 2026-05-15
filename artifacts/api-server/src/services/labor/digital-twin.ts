import { db, digitalTwinModels } from "@workspace/db";
import { eq, and, gte, lte, desc, sql, count } from "drizzle-orm";
import { logger } from "../../lib/logger";

export interface DigitalTwinSimulation {
  modelId: number;
  modelName: string;
  modelType: string;
  targetType: string;
  targetName: string;
  currentState: Record<string, unknown>;
  projectedStates: Array<{
    period: string;
    state: Record<string, unknown>;
    confidence: number;
  }>;
  confidence: number;
  keyFindings: string[];
  scenarios: string[];
}

class DigitalTwinService {
  async createModel(params: {
    name: string; description?: string; modelType: string;
    targetType?: string; targetId?: string; configuration?: Record<string, unknown>;
  }): Promise<{ id: number }> {
    const [inserted] = await db.insert(digitalTwinModels).values({
      name: params.name,
      description: params.description || null,
      modelType: params.modelType,
      targetType: params.targetType || null,
      targetId: params.targetId || null,
      configuration: (params.configuration || {}) as any,
      state: {},
      parameters: {},
      metadata: {},
    }).returning();
    return { id: inserted.id };
  }

  async simulateModel(id: number, scenarioParams?: Record<string, unknown>): Promise<DigitalTwinSimulation | null> {
    const model = await db
      .select()
      .from(digitalTwinModels)
      .where(eq(digitalTwinModels.id, id))
      .limit(1)
      .then(r => r[0]);

    if (!model) return null;

    const config = (model.configuration || {}) as Record<string, unknown>;
    const baseState = (model.state || {}) as Record<string, unknown>;
    const params = scenarioParams || (model.parameters || {}) as Record<string, unknown>;

    const projectedStates = this.generateProjectedStates(model.modelType, baseState, params, config);

    const findings: string[] = [];
    for (const ps of projectedStates) {
      const state = ps.state as Record<string, number>;
      if (state.demandIndex && state.supplyIndex) {
        const gap = state.demandIndex - state.supplyIndex;
        if (gap > 0.2) findings.push(`${ps.period}: Demand-supply gap of ${Math.round(gap * 100)}% projected`);
        if (state.scarcityIndex && state.scarcityIndex > 0.3) {
          findings.push(`${ps.period}: Talent scarcity reaching ${Math.round(state.scarcityIndex * 100)}%`);
        }
      }
    }

    await db.update(digitalTwinModels)
      .set({
        state: baseState as any,
        parameters: params as any,
        confidence: projectedStates.reduce((s, p) => s + p.confidence, 0) / projectedStates.length,
        calibrationScore: 0.5,
        lastSimulatedAt: new Date(),
      })
      .where(eq(digitalTwinModels.id, id));

    const scenarioList = Object.keys(params).length > 0
      ? [JSON.stringify(scenarioParams)]
      : ["baseline"];

    return {
      modelId: model.id,
      modelName: model.name,
      modelType: model.modelType,
      targetType: model.targetType || "unknown",
      targetName: model.targetId || model.name,
      currentState: baseState,
      projectedStates,
      confidence: projectedStates.reduce((s, p) => s + p.confidence, 0) / projectedStates.length,
      keyFindings: findings.slice(0, 8),
      scenarios: scenarioList,
    };
  }

  async simulateEcosystem(params: {
    demandShift?: number; supplyShift?: number; migrationImpact?: number;
    sponsorshipChange?: number; wageGrowth?: number; automationImpact?: number;
    horizon?: string;
  }): Promise<DigitalTwinSimulation> {
    const modelName = "Ecosystem Digital Twin";
    const baseState = {
      demandIndex: 0.55,
      supplyIndex: 0.5,
      scarcityIndex: 0.05,
      migrationPressure: 0.4,
      sponsorshipPressure: 0.3,
      wagePressure: 0.35,
      churnRate: 0.2,
      balanceScore: 0.7,
    };

    const dS = params.demandShift || 0;
    const sS = params.supplyShift || 0;
    const mI = params.migrationImpact || 0;
    const spC = params.sponsorshipChange || 0;
    const wG = params.wageGrowth || 0;
    const aI = params.automationImpact || 0;
    const horizon = params.horizon || "90d";

    const periods = horizon === "1y" ? 4 : horizon === "180d" ? 2 : 1;
    const projectedStates: Array<{ period: string; state: Record<string, unknown>; confidence: number }> = [];

    for (let i = 1; i <= periods; i++) {
      const periodLabel = `${i * (horizon === "1y" ? 3 : horizon === "180d" ? 3 : 1)}mo`;
      const demand = Math.max(0, Math.min(1, baseState.demandIndex + dS * i + aI * i * 0.1));
      const supply = Math.max(0, Math.min(1, baseState.supplyIndex + sS * i + mI * i * 0.08));
      const scarcity = Math.max(0, demand - supply);
      const migration = Math.max(0, Math.min(1, baseState.migrationPressure + mI * i * 0.15));
      const sponsorship = Math.max(0, Math.min(1, baseState.sponsorshipPressure + spC * i * 0.1));
      const wage = Math.max(0, Math.min(1, baseState.wagePressure + wG * i + scarcity * 0.2));
      const churn = Math.max(0, Math.min(1, baseState.churnRate + aI * i * 0.05));
      const balance = Math.max(0, Math.min(1, 1 - scarcity * 1.2 - churn * 0.3));

      projectedStates.push({
        period: periodLabel,
        state: {
          demandIndex: Math.round(demand * 100) / 100,
          supplyIndex: Math.round(supply * 100) / 100,
          scarcityIndex: Math.round(scarcity * 100) / 100,
          migrationPressure: Math.round(migration * 100) / 100,
          sponsorshipPressure: Math.round(sponsorship * 100) / 100,
          wagePressure: Math.round(wage * 100) / 100,
          churnRate: Math.round(churn * 100) / 100,
          balanceScore: Math.round(balance * 100) / 100,
        },
        confidence: Math.max(0.3, 0.8 - i * 0.15),
      });
    }

    const findings: string[] = [];
    const lastState = projectedStates[projectedStates.length - 1].state as Record<string, number>;
    if (lastState.scarcityIndex > 0.3) findings.push(`Critical: Talent scarcity reaching ${Math.round(lastState.scarcityIndex * 100)}% by ${projectedStates[projectedStates.length - 1].period}`);
    if (lastState.balanceScore < 0.5) findings.push(`Warning: Ecosystem balance deteriorating to ${Math.round(lastState.balanceScore * 100)}%`);
    if (lastState.wagePressure > 0.5) findings.push(`Wage inflation pressure rising to ${Math.round(lastState.wagePressure * 100)}%`);
    if (lastState.churnRate > 0.3) findings.push(`Churn rate increasing to ${Math.round(lastState.churnRate * 100)}% — retention intervention recommended`);
    findings.push(`Demand: ${Math.round(lastState.demandIndex * 100)}% | Supply: ${Math.round(lastState.supplyIndex * 100)}%`);

    return {
      modelId: 0,
      modelName,
      modelType: "ecosystem",
      targetType: "ecosystem",
      targetName: "Workforce Ecosystem",
      currentState: baseState,
      projectedStates,
      confidence: projectedStates.reduce((s, p) => s + p.confidence, 0) / projectedStates.length,
      keyFindings: findings,
      scenarios: [`demandShift:${dS}, supplyShift:${sS}, migrationImpact:${mI}, automationImpact:${aI}`],
    };
  }

  async getModels(modelType?: string): Promise<Array<Record<string, unknown>>> {
    const conditions = modelType ? [eq(digitalTwinModels.modelType, modelType)] : [];
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const query = where
      ? db.select().from(digitalTwinModels).where(where).orderBy(desc(digitalTwinModels.createdAt))
      : db.select().from(digitalTwinModels).orderBy(desc(digitalTwinModels.createdAt));
    return query;
  }

  async getModelById(id: number): Promise<Record<string, unknown> | null> {
    const rows = await db.select().from(digitalTwinModels).where(eq(digitalTwinModels.id, id)).limit(1);
    return rows[0] || null;
  }

  async updateModel(id: number, updates: Record<string, unknown>): Promise<void> {
    await db.update(digitalTwinModels).set(updates).where(eq(digitalTwinModels.id, id));
  }

  private generateProjectedStates(
    modelType: string, baseState: Record<string, unknown>,
    params: Record<string, unknown>, config: Record<string, unknown>,
  ): Array<{ period: string; state: Record<string, unknown>; confidence: number }> {
    const periods = modelType === "industry" || modelType === "region" ? 4 : modelType === "ecosystem" ? 3 : 2;
    const states: Array<{ period: string; state: Record<string, unknown>; confidence: number }> = [];

    for (let i = 1; i <= periods; i++) {
      const periodLabel = `${i * 3}mo`;
      const drift = ((params.drift as number) || 0.02) * i;
      const volatility = ((params.volatility as number) || 0.05) * i;

      const state: Record<string, number> = {};
      for (const [key, val] of Object.entries(baseState)) {
        const base = typeof val === "number" ? val : 0.5;
        const paramShift = (params[`${key}Shift`] as number) || 0;
        state[key] = Math.max(0, Math.min(1, base + drift * (base > 0.5 ? -1 : 1) + paramShift * i));
      }

      states.push({
        period: periodLabel,
        state,
        confidence: Math.max(0.2, 0.85 - volatility),
      });
    }

    return states;
  }
}

export const digitalTwinService = new DigitalTwinService();
