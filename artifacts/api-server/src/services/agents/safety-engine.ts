import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { logger } from "../../lib/logger";
import { eventBus, RecruitmentEventTypes } from "./event-bus";
export type Severity = "info" | "warning" | "critical";

export type FlagType = "bias_detection" | "confidence_low" | "drift_alert" | "hallucination" | "workflow_failure" | "suspicious_action" | "threshold_breach" | "fraud_detection" | "data_quality";

export class SafetyEngine {
  async raiseFlag(params: {
    employerId?: number;
    flagType: FlagType;
    severity: Severity;
    title: string;
    description?: string;
    affectedAgent?: string;
    affectedEntityId?: number;
    affectedEntityType?: string;
    metadata?: Record<string, unknown>;
  }): Promise<number | null> {
    try {
      const result = await db.execute(sql`
        INSERT INTO safety_flags (employer_id, flag_type, severity, title, description, affected_agent, affected_entity_id, affected_entity_type, metadata)
        VALUES (${params.employerId ?? null}, ${params.flagType}, ${params.severity}, ${params.title},
                ${params.description ?? null}, ${params.affectedAgent ?? null},
                ${params.affectedEntityId ?? null}, ${params.affectedEntityType ?? null},
                ${JSON.stringify(params.metadata || {})}::jsonb)
        RETURNING id
      `);

      if (params.severity === "critical" && params.employerId) {
        await eventBus.emitEvent({
          type: RecruitmentEventTypes.SYSTEM_ALERT,
          source: "safety-engine",
          payload: { flagType: params.flagType, severity: params.severity, title: params.title, employerId: params.employerId },
          timestamp: new Date(),
        });
      }

      return Number((result.rows?.[0] as any)?.id || 0);
    } catch (err) {
      logger.error({ err, flagType: params.flagType }, "Failed to raise safety flag");
      return null;
    }
  }

  async resolveFlag(flagId: number): Promise<boolean> {
    try {
      const result = await db.execute(sql`
        UPDATE safety_flags SET resolved = true, resolved_at = NOW() WHERE id = ${flagId}
        RETURNING id
      `);
      return (result.rows?.length || 0) > 0;
    } catch {
      return false;
    }
  }

  async getActiveFlags(employerId?: number, severity?: string): Promise<any[]> {
    try {
      let query: any;
      if (employerId && severity) {
        query = sql`SELECT * FROM safety_flags WHERE employer_id = ${employerId} AND resolved = false AND severity = ${severity} ORDER BY created_at DESC LIMIT 50`;
      } else if (employerId) {
        query = sql`SELECT * FROM safety_flags WHERE employer_id = ${employerId} AND resolved = false ORDER BY created_at DESC LIMIT 50`;
      } else if (severity) {
        query = sql`SELECT * FROM safety_flags WHERE resolved = false AND severity = ${severity} ORDER BY created_at DESC LIMIT 50`;
      } else {
        query = sql`SELECT * FROM safety_flags WHERE resolved = false ORDER BY created_at DESC LIMIT 50`;
      }
      const rows = await db.execute(query);
      return rows.rows || [];
    } catch {
      return [];
    }
  }

  async getAllFlags(employerId?: number, limit = 50): Promise<any[]> {
    try {
      let query: any;
      if (employerId) {
        query = sql`SELECT * FROM safety_flags WHERE employer_id = ${employerId} ORDER BY created_at DESC LIMIT ${limit}`;
      } else {
        query = sql`SELECT * FROM safety_flags ORDER BY created_at DESC LIMIT ${limit}`;
      }
      const rows = await db.execute(query);
      return rows.rows || [];
    } catch {
      return [];
    }
  }

  async checkConfidenceGate(confidence: number, minConfidence = 0.5, employerId?: number): Promise<{ passed: boolean; reason: string }> {
    if (confidence < minConfidence) {
      if (employerId) {
        await this.raiseFlag({
          employerId, flagType: "confidence_low", severity: "warning",
          title: `Confidence below threshold: ${Math.round(confidence * 100)}% < ${Math.round(minConfidence * 100)}%`,
          metadata: { confidence, minConfidence },
        });
      }
      return { passed: false, reason: `Confidence ${Math.round(confidence * 100)}% below minimum ${Math.round(minConfidence * 100)}%` };
    }
    return { passed: true, reason: `Confidence ${Math.round(confidence * 100)}% meets threshold` };
  }

  async detectBias(
    employerId: number,
    candidates: Array<{ id: number; location?: string; skills?: string[]; experienceLevel?: string }>,
    preferredLocations: string[],
    preferredSkills: string[],
  ): Promise<{ biased: boolean; flags: string[] }> {
    const flags: string[] = [];
    if (preferredLocations.length > 0 && candidates.length > 0) {
      const candidatesInPreferredLoc = candidates.filter((c) => c.location && preferredLocations.includes(c.location));
      const ratio = candidatesInPreferredLoc.length / candidates.length;
      if (ratio > 0.9) {
        flags.push(`High location bias: ${Math.round(ratio * 100)}% of candidates from preferred locations`);
        await this.raiseFlag({ employerId, flagType: "bias_detection", severity: "warning", title: flags[flags.length - 1], metadata: { ratio, preferredLocations } });
      }
    }
    const allSkills = candidates.flatMap((c) => c.skills || []);
    if (preferredSkills.length > 0 && allSkills.length > 0) {
      const preferredSkillMatchCount = allSkills.filter((s) => preferredSkills.includes(s)).length;
      const matchRatio = preferredSkillMatchCount / allSkills.length;
      if (matchRatio > 0.85) {
        flags.push(`High skill pool homogeneity: ${Math.round(matchRatio * 100)}% of skills are from preferred set`);
        await this.raiseFlag({ employerId, flagType: "bias_detection", severity: "info", title: flags[flags.length - 1], metadata: { matchRatio, preferredSkills } });
      }
    }
    return { biased: flags.length > 0, flags };
  }

  async detectDrift(employerId: number, metricType: string, metricName: string, currentValue: number): Promise<{ drifted: boolean; driftAmount: number }> {
    try {
      const rows = await db.execute(sql`
        SELECT current_value, drift_amount FROM drift_metrics
        WHERE employer_id = ${employerId} AND metric_type = ${metricType} AND metric_name = ${metricName}
        ORDER BY created_at DESC LIMIT 1
      `);

      const previousValue = Number((rows.rows?.[0] as any)?.current_value ?? currentValue);
      const previousDrift = Number((rows.rows?.[0] as any)?.drift_amount ?? 0);
      const driftAmount = Math.abs(currentValue - previousValue);
      const driftDirection = currentValue > previousValue ? "up" : currentValue < previousValue ? "down" : "stable";

      await db.execute(sql`
        INSERT INTO drift_metrics (employer_id, metric_type, metric_name, current_value, previous_value, drift_amount, drift_direction, window_start, metadata)
        VALUES (${employerId}, ${metricType}, ${metricName}, ${currentValue}, ${previousValue},
                ${driftAmount}, ${driftDirection},
                ${previousDrift > 0 ? sql`NOW() - INTERVAL '1 day'` : sql`NOW() - INTERVAL '1 day'`},
                ${JSON.stringify({ previousDrift }) }::jsonb)
      `);

      if (driftAmount > 0.3 && previousDrift > 0) {
        await this.raiseFlag({
          employerId, flagType: "drift_alert", severity: "warning",
          title: `Drift detected in ${metricName}: ${Math.round(driftAmount * 100)}% change`,
          metadata: { metricType, metricName, driftAmount, driftDirection, previousValue, currentValue },
        });
        return { drifted: true, driftAmount };
      }
      return { drifted: false, driftAmount };
    } catch {
      return { drifted: false, driftAmount: 0 };
    }
  }

  async getSafetySummary(employerId: number): Promise<{
    activeFlags: number; criticalFlags: number; warningFlags: number;
    recentBiasFlags: number; recentDriftFlags: number;
    resolvedFlags: number;
  }> {
    try {
      const rows = await db.execute(sql`
        SELECT
          COUNT(*) FILTER (WHERE resolved = false) as active,
          COUNT(*) FILTER (WHERE resolved = false AND severity = 'critical') as critical,
          COUNT(*) FILTER (WHERE resolved = false AND severity = 'warning') as warning,
          COUNT(*) FILTER (WHERE resolved = false AND flag_type = 'bias_detection') as bias,
          COUNT(*) FILTER (WHERE resolved = false AND flag_type = 'drift_alert') as drift,
          COUNT(*) FILTER (WHERE resolved = true) as resolved
        FROM safety_flags
        WHERE employer_id = ${employerId}
      `);
      const r = rows.rows?.[0] as any || {};
      return {
        activeFlags: Number(r.active) || 0, criticalFlags: Number(r.critical) || 0, warningFlags: Number(r.warning) || 0,
        recentBiasFlags: Number(r.bias) || 0, recentDriftFlags: Number(r.drift) || 0, resolvedFlags: Number(r.resolved) || 0,
      };
    } catch {
      return { activeFlags: 0, criticalFlags: 0, warningFlags: 0, recentBiasFlags: 0, recentDriftFlags: 0, resolvedFlags: 0 };
    }
  }
}

export const safetyEngine = new SafetyEngine();
