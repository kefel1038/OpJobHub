import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { logger } from "../../lib/logger";
import { signalCollector } from "./behavioral-signals";
import { safetyEngine } from "./safety-engine";

export class OverrideLearner {
  async recordOverride(params: {
    employerId: number;
    actionType: string;
    targetId?: number;
    targetType?: string;
    aiSuggestedValue?: string;
    humanChosenValue?: string;
    overrideReason?: string;
    confidenceAtTime?: number;
    reasoningSnapshot?: any[];
  }): Promise<void> {
    try {
      await db.execute(sql`
        INSERT INTO override_events (employer_id, action_type, target_id, target_type, ai_suggested_value, human_chosen_value, override_reason, confidence_at_time, reasoning_snapshot)
        VALUES (${params.employerId}, ${params.actionType}, ${params.targetId ?? null},
                ${params.targetType ?? null}, ${params.aiSuggestedValue ?? null},
                ${params.humanChosenValue ?? null}, ${params.overrideReason ?? null},
                ${params.confidenceAtTime ?? null}, ${JSON.stringify(params.reasoningSnapshot || [])}::jsonb)
      `);

      await signalCollector.record({
        employerId: params.employerId,
        actionType: "rejected",
        candidateId: params.targetId && params.targetType === "candidate" ? params.targetId : undefined,
        jobId: undefined,
        metadata: {
          overrideType: params.actionType,
          aiSuggestion: params.aiSuggestedValue,
          humanChoice: params.humanChosenValue,
          reason: params.overrideReason,
        },
      });

      await safetyEngine.detectDrift(
        params.employerId, "override", params.actionType,
        params.confidenceAtTime ?? 0.5,
      );
    } catch (err) {
      logger.error({ err, employerId: params.employerId }, "Failed to record override");
    }
  }

  async getOverridePatterns(employerId: number): Promise<{
    totalOverrides: number;
    topActionTypes: Array<{ actionType: string; count: number }>;
    commonReasons: string[];
    confidenceAtOverride: { average: number; min: number; max: number };
    aiBlindSpots: Array<{ factor: string; count: number }>;
  }> {
    try {
      const [total, actions, reasons, confidence, blindSpots] = await Promise.all([
        db.execute(sql`SELECT COUNT(*) as count FROM override_events WHERE employer_id = ${employerId}`),
        db.execute(sql`
          SELECT action_type, COUNT(*) as count FROM override_events
          WHERE employer_id = ${employerId}
          GROUP BY action_type ORDER BY count DESC LIMIT 10
        `),
        db.execute(sql`
          SELECT override_reason, COUNT(*) as count FROM override_events
          WHERE employer_id = ${employerId} AND override_reason IS NOT NULL
          GROUP BY override_reason ORDER BY count DESC LIMIT 10
        `),
        db.execute(sql`
          SELECT AVG(confidence_at_time) as avg, MIN(confidence_at_time) as min, MAX(confidence_at_time) as max
          FROM override_events WHERE employer_id = ${employerId} AND confidence_at_time IS NOT NULL
        `),
        db.execute(sql`
          SELECT jsonb_array_elements(reasoning_snapshot)->>'factor' as factor, COUNT(*) as count
          FROM override_events
          WHERE employer_id = ${employerId} AND reasoning_snapshot IS NOT NULL
          GROUP BY factor ORDER BY count DESC LIMIT 10
        `),
      ]);

      const conf = (confidence.rows?.[0] as any) || {};
      return {
        totalOverrides: Number((total.rows?.[0] as any)?.count || 0),
        topActionTypes: (actions.rows || []).map((r: any) => ({ actionType: r.action_type, count: Number(r.count) })),
        commonReasons: (reasons.rows || []).map((r: any) => r.override_reason),
        confidenceAtOverride: {
          average: Number(conf.avg) || 0,
          min: Number(conf.min) || 0,
          max: Number(conf.max) || 0,
        },
        aiBlindSpots: (blindSpots.rows || []).map((r: any) => ({ factor: r.factor, count: Number(r.count) })),
      };
    } catch {
      return { totalOverrides: 0, topActionTypes: [], commonReasons: [], confidenceAtOverride: { average: 0, min: 0, max: 0 }, aiBlindSpots: [] };
    }
  }

  async getOverrideHistory(employerId: number, limit = 50): Promise<any[]> {
    try {
      const rows = await db.execute(sql`
        SELECT id, action_type, target_id, target_type, ai_suggested_value, human_chosen_value,
               override_reason, confidence_at_time, reasoning_snapshot, created_at
        FROM override_events
        WHERE employer_id = ${employerId}
        ORDER BY created_at DESC LIMIT ${limit}
      `);
      return rows.rows || [];
    } catch {
      return [];
    }
  }

  async analyzeBlindSpots(employerId: number): Promise<Array<{ blindSpot: string; severity: string; suggestion: string }>> {
    try {
      const patterns = await this.getOverridePatterns(employerId);
      const blindSpots: Array<{ blindSpot: string; severity: string; suggestion: string }> = [];

      if (patterns.totalOverrides > 5) {
        const highOverrideActions = patterns.topActionTypes.filter((a) => a.count > 3);

        for (const action of highOverrideActions) {
          if (action.actionType.includes("ranking") || action.actionType.includes("score")) {
            blindSpots.push({
              blindSpot: `Candidate ranking consistently overridden for ${action.actionType}`,
              severity: "warning",
              suggestion: "Review ranking factors — the AI may be overweighting certain criteria that conflict with recruiter judgment. Consider adjusting preference weights.",
            });
          }
          if (action.actionType.includes("outreach") || action.actionType.includes("message")) {
            blindSpots.push({
              blindSpot: `Outreach messages frequently modified or rejected`,
              severity: "info",
              suggestion: "The AI outreach tone or content may not match your communication style. Consider providing more examples of preferred messaging.",
            });
          }
        }

        if (patterns.confidenceAtOverride.average > 0.8) {
          blindSpots.push({
            blindSpot: `High AI confidence (${Math.round(patterns.confidenceAtOverride.average * 100)}%) despite recruiter overrides`,
            severity: "warning",
            suggestion: "The AI is confidently suggesting actions that you disagree with. This indicates a systematic gap in understanding your preferences. Consider reviewing inferred preferences.",
          });
        }
      }

      return blindSpots;
    } catch {
      return [];
    }
  }
}

export const overrideLearner = new OverrideLearner();
