import { logger } from "../../lib/logger";
import { marketBalancer, type MarketBalanceResult } from "./market-balancer";
import { interventionEngine, type InterventionResult } from "./intervention-engine";
import { digitalTwinService } from "./digital-twin";
import { upskillingEngine } from "./upskilling-engine";
import { economicSignalEngine } from "./economic-signal-engine";
import { db, ecosystemAlerts, orchestratorActions } from "@workspace/db";
import { eq, and, gte, lte, desc, sql, count } from "drizzle-orm";

export interface OrchestrationSummary {
  alerts: Array<Record<string, unknown>>;
  actions: Array<Record<string, unknown>>;
  imbalances: MarketBalanceResult[];
  interventions: Array<Record<string, unknown>>;
  macroOutlook: Record<string, unknown>;
  ecosystemHealth: {
    alertCount: number;
    criticalAlerts: number;
    activeInterventions: number;
    balanceScore: number;
    lastAssessment: string;
  };
  snapshotTimestamp: string;
}

class WorkforceOrchestrator {
  private lastAssessment: Date | null = null;

  async assessAndOrchestrate(): Promise<OrchestrationSummary> {
    logger.info("Running workforce orchestration cycle");

    const balances = await marketBalancer.assessAllBalances();
    const macroOutlook = await economicSignalEngine.generateMacroOutlook();
    const alerts: Array<Record<string, unknown>> = [];
    const actions: Array<Record<string, unknown>> = [];

    for (const balance of balances) {
      if (balance.balanceScore < 0.5) {
        const alert = await this.createAlert(balance);
        alerts.push(alert);

        if (balance.imbalanceDirection === "shortage" && balance.scarcityIndex > 0.3) {
          const intervention = await interventionEngine.generateSourcingIntervention(
            balance.targetName, undefined, balance.scarcityIndex,
          );
          const action = await this.logAction("intervention_launched", {
            description: `Launched sourcing intervention for ${balance.targetName}`,
            targetType: "role",
            targetId: balance.targetName,
            sourceAlertId: alert.id as number,
            parameters: { scarcityIndex: balance.scarcityIndex, interventionId: intervention.id },
          });
          actions.push(action);

          const upskillingPathways = await upskillingEngine.findAdjacentUpskillingPathways(balance.targetName);
          if (upskillingPathways.length > 0) {
            await this.logAction("recommendation", {
              description: `Generated ${upskillingPathways.length} upskilling pathways for ${balance.targetName}`,
              targetType: "skill",
              targetId: balance.targetName,
              sourceAlertId: alert.id as number,
              parameters: { pathwayCount: upskillingPathways.length },
            });
          }
        }
      }
    }

    for (const flag of macroOutlook.riskFlags as string[]) {
      const existingAlerts = await db
        .select({ id: ecosystemAlerts.id })
        .from(ecosystemAlerts)
        .where(
          and(
            eq(ecosystemAlerts.alertType, "economic_risk"),
            eq(ecosystemAlerts.title, flag),
            eq(ecosystemAlerts.active, true),
          ),
        )
        .limit(1);

      if (existingAlerts.length === 0) {
        const [inserted] = await db.insert(ecosystemAlerts).values({
          alertType: "economic_risk",
          severity: "medium",
          title: flag,
          description: flag,
          category: "economic",
          confidence: 0.6,
          impactScore: 0.4,
          metadata: { source: "economic-signal-engine" },
        }).returning();
        alerts.push(inserted);
      }
    }

    this.lastAssessment = new Date();

    const activeInterventions = await db
      .select({ count: count() })
      .from(ecosystemAlerts)
      .where(eq(ecosystemAlerts.active, true))
      .then(r => r[0]?.count || 0);

    const criticalAlerts = await db
      .select({ count: count() })
      .from(ecosystemAlerts)
      .where(
        and(
          eq(ecosystemAlerts.active, true),
          eq(ecosystemAlerts.severity, "critical"),
        ),
      )
      .then(r => r[0]?.count || 0);

    const avgBalance = balances.length > 0
      ? balances.reduce((s, b) => s + b.balanceScore, 0) / balances.length
      : 0.5;

    return {
      alerts,
      actions,
      imbalances: balances,
      interventions: await interventionEngine.getInterventions(5, "proposed"),
      macroOutlook: macroOutlook as any,
      ecosystemHealth: {
        alertCount: activeInterventions,
        criticalAlerts,
        activeInterventions: activeInterventions,
        balanceScore: Math.round(avgBalance * 100) / 100,
        lastAssessment: new Date().toISOString(),
      },
      snapshotTimestamp: new Date().toISOString(),
    };
  }

  async getAlerts(activeOnly = true, limit = 30): Promise<Array<Record<string, unknown>>> {
    const conditions = activeOnly ? [eq(ecosystemAlerts.active, true)] : [];
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const query = where
      ? db.select().from(ecosystemAlerts).where(where).orderBy(desc(ecosystemAlerts.createdAt)).limit(limit)
      : db.select().from(ecosystemAlerts).orderBy(desc(ecosystemAlerts.createdAt)).limit(limit);
    return query;
  }

  async getActions(limit = 30): Promise<Array<Record<string, unknown>>> {
    return db
      .select()
      .from(orchestratorActions)
      .orderBy(desc(orchestratorActions.createdAt))
      .limit(limit);
  }

  async resolveAlert(id: number): Promise<void> {
    await db.update(ecosystemAlerts)
      .set({ active: false, resolvedAt: new Date() })
      .where(eq(ecosystemAlerts.id, id));
  }

  isStale(): boolean {
    if (!this.lastAssessment) return true;
    return Date.now() - this.lastAssessment.getTime() > 15 * 60 * 1000;
  }

  private async createAlert(balance: MarketBalanceResult): Promise<Record<string, unknown>> {
    const alertType = balance.imbalanceDirection === "shortage" ? "shortage_detected" : "imbalance";
    const severity = balance.balanceScore < 0.3 ? "critical" : balance.balanceScore < 0.5 ? "high" : "medium";

    const existing = await db
      .select({ id: ecosystemAlerts.id })
      .from(ecosystemAlerts)
      .where(
        and(
          eq(ecosystemAlerts.alertType, alertType),
          eq(ecosystemAlerts.targetName, balance.targetName),
          eq(ecosystemAlerts.active, true),
        ),
      )
      .limit(1);

    if (existing.length > 0) return existing[0];

    const title = balance.imbalanceDirection === "shortage"
      ? `Talent shortage detected: ${balance.targetName}`
      : `Market imbalance: ${balance.targetName}`;

    const description = `Balance score: ${Math.round(balance.balanceScore * 100)}%. ` +
      `Demand: ${Math.round(balance.demandIndex * 100)}%, Supply: ${Math.round(balance.supplyIndex * 100)}%. ` +
      (balance.scarcityIndex > 0 ? `Scarcity gap: ${Math.round(balance.scarcityIndex * 100)}%. ` : "") +
      (balance.topDrivers.length > 0 ? `Key drivers: ${balance.topDrivers.slice(0, 3).join(", ")}` : "");

    const [inserted] = await db.insert(ecosystemAlerts).values({
      alertType,
      severity,
      title,
      description,
      category: balance.snapshotType === "corridor" ? "migration" : "demand",
      targetType: balance.snapshotType,
      targetId: balance.targetName,
      targetName: balance.targetName,
      confidence: 1 - balance.balanceScore,
      impactScore: balance.scarcityIndex,
      affectedCount: 0,
      recommendedActions: [
        `Increase sourcing priority for ${balance.targetName}`,
        `Evaluate adjacent talent pools`,
        `Adjust compensation benchmarking`,
      ],
      metadata: {
        balanceScore: balance.balanceScore,
        scarcityIndex: balance.scarcityIndex,
        imbalanceDirection: balance.imbalanceDirection,
        demandIndex: balance.demandIndex,
        supplyIndex: balance.supplyIndex,
      },
    }).returning();

    return inserted;
  }

  private async logAction(
    actionType: string, params: {
      description: string; targetType: string; targetId: string;
      sourceAlertId?: number; parameters?: Record<string, unknown>;
    },
  ): Promise<Record<string, unknown>> {
    const [inserted] = await db.insert(orchestratorActions).values({
      actionType,
      description: params.description,
      triggerType: "automatic",
      status: "completed",
      sourceAlertId: params.sourceAlertId || null,
      targetType: params.targetType,
      targetId: params.targetId,
      parameters: (params.parameters || {}) as any,
      results: {},
      confidence: 0.6,
      metadata: {},
    }).returning();
    return inserted;
  }
}

export const workforceOrchestrator = new WorkforceOrchestrator();
