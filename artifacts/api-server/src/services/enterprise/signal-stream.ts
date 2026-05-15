import { logger } from "../../lib/logger";
import { db, signalSubscriptions } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { laborIntelligenceEngine } from "../labor/labor-intelligence-engine";
import { migrationIntelligence } from "../labor/migration-intelligence";
import { migrationRiskService } from "../labor/migration-risk";
import { corridorHealthService } from "../labor/corridor-health";
import { skillForecastService } from "../labor/skill-forecast";
import { riskForecastService } from "../labor/risk-forecast";
import { economicSignalEngine } from "../labor/economic-signal-engine";

export interface SignalEvent {
  signalType: string;
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  targetType: string;
  targetId: string;
  targetName: string;
  value: number;
  threshold: number;
  previousValue?: number;
  changePercent?: number;
  region?: string;
  industry?: string;
  metadata: Record<string, unknown>;
  timestamp: string;
}

export interface SignalSubscriptionResult {
  id: number;
  signalType: string;
  channel: string;
  endpoint: string | null;
  filters: Record<string, unknown>;
  active: boolean;
}

class SignalStream {
  private subscribers: Map<string, Array<(event: SignalEvent) => void>> = new Map();
  private lastFired: Map<string, number> = new Map();

  on(signalType: string, callback: (event: SignalEvent) => void): () => void {
    if (!this.subscribers.has(signalType)) this.subscribers.set(signalType, []);
    this.subscribers.get(signalType)!.push(callback);
    return () => {
      const cbs = this.subscribers.get(signalType);
      if (cbs) {
        const idx = cbs.indexOf(callback);
        if (idx >= 0) cbs.splice(idx, 1);
      }
    };
  }

  // ─── Subscription Management ─────────────────────────────

  async createSubscription(params: {
    tenantId: number; signalType: string; channel: string;
    endpoint?: string; filters?: Record<string, unknown>;
    throttleSeconds?: number;
  }): Promise<SignalSubscriptionResult> {
    const [sub] = await db.insert(signalSubscriptions).values({
      tenantId: params.tenantId, signalType: params.signalType,
      channel: params.channel, endpoint: params.endpoint,
      filters: (params.filters ?? {}) as Record<string, unknown>,
      throttleSeconds: params.throttleSeconds ?? 300,
    }).returning();
    return this.mapSubscription(sub);
  }

  async getSubscriptions(tenantId: number, activeOnly = true): Promise<SignalSubscriptionResult[]> {
    const conditions: ReturnType<typeof eq>[] = [eq(signalSubscriptions.tenantId, tenantId)];
    if (activeOnly) conditions.push(eq(signalSubscriptions.active, true));
    const subs = await db.select().from(signalSubscriptions)
      .where(and(...conditions)).orderBy(desc(signalSubscriptions.createdAt));
    return subs.map(s => this.mapSubscription(s));
  }

  async updateSubscription(id: number, params: Partial<{
    endpoint: string; filters: Record<string, unknown>;
    throttleSeconds: number; active: boolean;
  }>): Promise<SignalSubscriptionResult | null> {
    const updateData: Record<string, unknown> = {};
    if (params.endpoint !== undefined) updateData.endpoint = params.endpoint;
    if (params.filters !== undefined) updateData.filters = params.filters;
    if (params.throttleSeconds !== undefined) updateData.throttleSeconds = params.throttleSeconds;
    if (params.active !== undefined) updateData.active = params.active;
    const [sub] = await db.update(signalSubscriptions)
      .set(updateData).where(eq(signalSubscriptions.id, id)).returning();
    return sub ? this.mapSubscription(sub) : null;
  }

  // ─── Signal Detection & Emission ─────────────────────────

  async detectAndEmitAll(): Promise<SignalEvent[]> {
    const events: SignalEvent[] = [];
    const shortageEvents = await this.detectLaborShortages();
    events.push(...shortageEvents);
    const migrationEvents = await this.detectMigrationEvents();
    events.push(...migrationEvents);
    const skillEvents = await this.detectSkillEmergence();
    events.push(...skillEvents);
    const corridorEvents = await this.detectCorridorInstability();
    events.push(...corridorEvents);
    for (const event of events) {
      await this.emit(event);
    }
    return events;
  }

  private async detectLaborShortages(): Promise<SignalEvent[]> {
    try {
      const risks = await riskForecastService.forecastAllRisks();
      const shortageRisks = risks.filter(r =>
        r.riskType === "shortage" && (r.severity ?? 0) >= 0.6
      );
      return shortageRisks.slice(0, 10).map(r => ({
        signalType: "labor_shortage",
        title: `Labor shortage detected: ${r.targetName}`,
        description: `${r.targetName} facing critical labor shortage (severity: ${((r.severity ?? 0) * 100).toFixed(0)}%)`,
        severity: (r.severity ?? 0) >= 0.8 ? "critical" : "high",
        targetType: "role",
        targetId: r.targetName ?? "unknown",
        targetName: r.targetName ?? "unknown",
        value: r.severity ?? 0.5,
        threshold: 0.6,
        region: r.region as string | undefined,
        metadata: { riskType: r.riskType, probability: r.probability },
        timestamp: new Date().toISOString(),
      }));
    } catch (error) {
      logger.error({ error }, "Failed to detect labor shortages");
      return [];
    }
  }

  private async detectMigrationEvents(): Promise<SignalEvent[]> {
    try {
      const risks = await migrationRiskService.getAllActiveRisks();
      return risks.slice(0, 10).map((r: any) => ({
        signalType: "migration_event" as const,
        title: `Migration risk: ${r.corridor ?? "unknown corridor"}`,
        description: (r.description ?? "Migration corridor risk detected") as string,
        severity: ((r.riskScore ?? 0) >= 0.7 ? "high" : "medium") as "critical" | "high" | "medium" | "low" | "info",
        targetType: "corridor",
        targetId: r.corridor ?? "unknown",
        targetName: r.corridor ?? "unknown",
        value: r.riskScore ?? 0.5,
        threshold: 0.5,
        metadata: { riskFactors: r.riskFactors, probability: r.probability },
        timestamp: new Date().toISOString(),
      }));
    } catch (error) {
      logger.error({ error }, "Failed to detect migration events");
      return [];
    }
  }

  private async detectSkillEmergence(): Promise<SignalEvent[]> {
    try {
      const emerging = await skillForecastService.predictEmergingSkills("90d");
      return emerging.slice(0, 10).map(s => ({
        signalType: "skill_emergence",
        title: `Emerging skill: ${s.skill}`,
        description: `${s.skill} showing emergence signal with ${((s.probability ?? 0) * 100).toFixed(0)}% probability`,
        severity: (s.probability ?? 0) >= 0.7 ? "medium" : "low",
        targetType: "skill",
        targetId: s.skill,
        targetName: s.skill,
        value: s.probability ?? 0.5,
        threshold: 0.4,
        metadata: { probability: s.probability, adjacencies: s.adjacencies },
        timestamp: new Date().toISOString(),
      }));
    } catch (error) {
      logger.error({ error }, "Failed to detect skill emergence");
      return [];
    }
  }

  private async detectCorridorInstability(): Promise<SignalEvent[]> {
    try {
      const allHealth = await corridorHealthService.getAllCorridorHealths();
      const unstable = allHealth.filter(c => (c.healthScore ?? 1) < 0.5);
      return unstable.slice(0, 10).map(c => ({
        signalType: "corridor_instability",
        title: `Corridor instability: ${(c as any).source}-${(c as any).destination}`,
        description: `Migration corridor showing instability signals`,
        severity: (c.healthScore ?? 0.5) < 0.3 ? "critical" : "high",
        targetType: "corridor",
        targetId: `${(c as any).source}-${(c as any).destination}`,
        targetName: `${(c as any).source} → ${(c as any).destination}`,
        value: 1 - (c.healthScore ?? 0.5),
        threshold: 0.5,
        metadata: { healthScore: c.healthScore },
        timestamp: new Date().toISOString(),
      }));
    } catch (error) {
      logger.error({ error }, "Failed to detect corridor instability");
      return [];
    }
  }

  private async emit(event: SignalEvent): Promise<void> {
    const throttleKey = `${event.signalType}:${event.targetId}`;
    const lastFired = this.lastFired.get(throttleKey) ?? 0;
    const cooldown = 60000;
    if (Date.now() - lastFired < cooldown) return;
    this.lastFired.set(throttleKey, Date.now());
    const cbs = this.subscribers.get(event.signalType) ?? [];
    for (const cb of cbs) {
      try { cb(event); } catch (err) { logger.error({ err }, "Signal subscriber error"); }
    }
    try {
      const subs = await db.select().from(signalSubscriptions)
        .where(and(
          eq(signalSubscriptions.signalType, event.signalType),
          eq(signalSubscriptions.active, true),
        ));
      for (const sub of subs) {
        await this.deliverToSubscription(sub, event);
      }
    } catch (error) {
      logger.error({ error }, "Failed to deliver signal events");
    }
  }

  private async deliverToSubscription(sub: typeof signalSubscriptions.$inferSelect, event: SignalEvent): Promise<void> {
    const throttleKey = `sub_${sub.id}_${event.signalType}:${event.targetId}`;
    const lastFired = this.lastFired.get(throttleKey) ?? 0;
    if (Date.now() - lastFired < (sub.throttleSeconds ?? 300) * 1000) return;
    this.lastFired.set(throttleKey, Date.now());
    await db.update(signalSubscriptions)
      .set({ lastFiredAt: new Date() })
      .where(eq(signalSubscriptions.id, sub.id));
    if (sub.channel === "webhook" && sub.endpoint) {
      this.fireWebhook(sub.endpoint, event).catch(err =>
        logger.error({ err, subId: sub.id }, "Webhook delivery failed")
      );
    }
  }

  private async fireWebhook(url: string, event: SignalEvent): Promise<void> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: event.signalType,
          severity: event.severity,
          title: event.title,
          description: event.description,
          target: { type: event.targetType, id: event.targetId, name: event.targetName },
          value: event.value,
          metadata: event.metadata,
          timestamp: event.timestamp,
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  private mapSubscription(s: typeof signalSubscriptions.$inferSelect): SignalSubscriptionResult {
    return {
      id: s.id, signalType: s.signalType, channel: s.channel,
      endpoint: s.endpoint, filters: (s.filters ?? {}) as Record<string, unknown>,
      active: s.active ?? true,
    };
  }
}

export const signalStream = new SignalStream();
