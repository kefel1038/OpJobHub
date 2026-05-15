import { db, economicSignals, laborForecasts, migrationEvents } from "@workspace/db";
import { eq, and, gte, lte, desc, sql, count, avg } from "drizzle-orm";
import { logger } from "../../lib/logger";

export interface EconomicSignalResult {
  id: number;
  signalType: string;
  signalName: string;
  signalValue: number;
  previousValue: number;
  changeRate: number;
  region: string | null;
  industry: string | null;
  source: string | null;
  confidence: number;
  impact: string;
  timestamp: Date;
}

export interface SignalImpact {
  signalId: number;
  signalName: string;
  affectedForecasts: string[];
  demandImpact: number;
  migrationImpact: number;
  wageImpact: number;
  summary: string;
}

class EconomicSignalEngine {
  async recordSignal(params: {
    signalType: string; signalName: string; signalValue: number;
    previousValue?: number; region?: string; industry?: string;
    source?: string; confidence?: number; impact?: string;
  }): Promise<{ id: number }> {
    const changeRate = params.previousValue !== undefined && params.previousValue !== 0
      ? (params.signalValue - params.previousValue) / Math.abs(params.previousValue)
      : 0;

    const [inserted] = await db.insert(economicSignals).values({
      signalType: params.signalType,
      signalName: params.signalName,
      signalValue: params.signalValue,
      previousValue: params.previousValue ?? 0,
      changeRate,
      region: params.region || null,
      industry: params.industry || null,
      source: params.source || null,
      confidence: params.confidence ?? 0.5,
      impact: params.impact || "neutral",
      metadata: {},
    }).returning();

    return { id: inserted.id };
  }

  async getSignals(signalType?: string, limit = 30): Promise<EconomicSignalResult[]> {
    const conditions = [];
    if (signalType) conditions.push(eq(economicSignals.signalType, signalType));
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const query = where
      ? db.select().from(economicSignals).where(where).orderBy(desc(economicSignals.timestamp)).limit(limit)
      : db.select().from(economicSignals).orderBy(desc(economicSignals.timestamp)).limit(limit);
    return query.map(r => ({
      id: r.id,
      signalType: r.signalType,
      signalName: r.signalName,
      signalValue: r.signalValue ?? 0,
      previousValue: r.previousValue ?? 0,
      changeRate: r.changeRate ?? 0,
      region: r.region,
      industry: r.industry,
      source: r.source,
      confidence: r.confidence ?? 0.5,
      impact: r.impact ?? "neutral",
      timestamp: r.timestamp,
    }));
  }

  async assessImpact(signalId: number): Promise<SignalImpact | null> {
    const signal = await db
      .select()
      .from(economicSignals)
      .where(eq(economicSignals.id, signalId))
      .limit(1)
      .then(r => r[0]);
    if (!signal) return null;

    const signalType = signal.signalType;
    const region = signal.region;
    const industry = signal.industry;
    const value = signal.signalValue ?? 0;
    const changeRate = signal.changeRate ?? 0;

    let demandImpact = 0;
    let migrationImpact = 0;
    let wageImpact = 0;
    const affectedForecasts: string[] = [];

    if (signalType === "gdp_growth") {
      demandImpact = changeRate > 0 ? 0.15 : -0.1;
      wageImpact = changeRate > 0 ? 0.1 : -0.05;
      affectedForecasts.push("hiring_demand", "wage_pressure");
    } else if (signalType === "inflation") {
      wageImpact = Math.min(0.3, changeRate * 0.5);
      demandImpact = -Math.min(0.2, changeRate * 0.3);
      affectedForecasts.push("wage_pressure", "hiring_demand");
    } else if (signalType === "policy_change") {
      migrationImpact = value > 0 ? 0.2 : -0.15;
      affectedForecasts.push("migration_volume", "sponsorship_demand");
    } else if (signalType === "industry_investment") {
      demandImpact = Math.min(0.3, value * 0.01);
      affectedForecasts.push("hiring_demand", "labor_shortage");
    } else if (signalType === "trade_agreement") {
      migrationImpact = 0.15;
      demandImpact = 0.1;
      affectedForecasts.push("migration_volume", "hiring_demand");
    }

    const summary = this.generateImpactSummary(signal, demandImpact, migrationImpact, wageImpact);

    return {
      signalId: signal.id,
      signalName: signal.signalName,
      affectedForecasts,
      demandImpact: Math.round(demandImpact * 100) / 100,
      migrationImpact: Math.round(migrationImpact * 100) / 100,
      wageImpact: Math.round(wageImpact * 100) / 100,
      summary,
    };
  }

  async getActiveImpacts(limit = 10): Promise<SignalImpact[]> {
    const recent = await db
      .select()
      .from(economicSignals)
      .orderBy(desc(economicSignals.timestamp))
      .limit(limit);

    const impacts: SignalImpact[] = [];
    for (const signal of recent) {
      const impact = await this.assessImpact(signal.id);
      if (impact) impacts.push(impact);
    }
    return impacts;
  }

  async generateMacroOutlook(): Promise<{
    summary: string;
    keySignals: EconomicSignalResult[];
    demandOutlook: string;
    migrationOutlook: string;
    wageOutlook: string;
    riskFlags: string[];
  }> {
    const recentSignals = await this.getSignals(undefined, 20);
    const impacts = await this.getActiveImpacts(10);

    const avgDemandImpact = impacts.reduce((s, i) => s + i.demandImpact, 0) / Math.max(impacts.length, 1);
    const avgMigrationImpact = impacts.reduce((s, i) => s + i.migrationImpact, 0) / Math.max(impacts.length, 1);
    const avgWageImpact = impacts.reduce((s, i) => s + i.wageImpact, 0) / Math.max(impacts.length, 1);

    const riskFlags: string[] = [];
    const positiveSignals = recentSignals.filter(s => s.impact === "positive").length;
    const negativeSignals = recentSignals.filter(s => s.impact === "negative").length;

    if (avgDemandImpact < -0.1) riskFlags.push("Contracting demand — potential hiring slowdown");
    if (avgWageImpact > 0.15) riskFlags.push("Wage inflation pressure — rising compensation costs");
    if (negativeSignals > positiveSignals) riskFlags.push("More negative economic signals than positive — monitor closely");
    if (avgMigrationImpact > 0.15) riskFlags.push("Migration pressure increasing — prepare for corridor volume surge");

    const demandOutlook = avgDemandImpact > 0.05 ? "Positive" : avgDemandImpact < -0.05 ? "Cautionary" : "Stable";
    const migrationOutlook = avgMigrationImpact > 0.05 ? "Increasing" : avgMigrationImpact < -0.05 ? "Declining" : "Stable";
    const wageOutlook = avgWageImpact > 0.1 ? "Rising" : avgWageImpact < -0.05 ? "Cooling" : "Stable";

    const signalSummary = recentSignals.length > 0
      ? `${recentSignals.length} economic signals analyzed. ${positiveSignals} positive, ${negativeSignals} negative. `
      : "Limited economic signal data available. ";

    const summary = `${signalSummary}Demand outlook: ${demandOutlook}. Migration outlook: ${migrationOutlook}. Wage outlook: ${wageOutlook}.`;

    return {
      summary,
      keySignals: recentSignals.slice(0, 10),
      demandOutlook,
      migrationOutlook,
      wageOutlook,
      riskFlags,
    };
  }

  private generateImpactSummary(signal: any, demandImpact: number, migrationImpact: number, wageImpact: number): string {
    const parts: string[] = [];
    if (Math.abs(demandImpact) > 0.05) parts.push(`Hiring demand: ${demandImpact > 0 ? "+" : ""}${Math.round(demandImpact * 100)}%`);
    if (Math.abs(migrationImpact) > 0.05) parts.push(`Migration: ${migrationImpact > 0 ? "+" : ""}${Math.round(migrationImpact * 100)}%`);
    if (Math.abs(wageImpact) > 0.05) parts.push(`Wages: ${wageImpact > 0 ? "+" : ""}${Math.round(wageImpact * 100)}%`);
    return parts.length > 0 ? `${signal.signalName}: ${parts.join(" · ")}` : `${signal.signalName}: Limited measurable impact`;
  }
}

export const economicSignalEngine = new EconomicSignalEngine();
