import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { logger } from "../../lib/logger";
import { eventBus, RecruitmentEventTypes } from "./event-bus";
import type { DecisionArtifact } from "./reasoning-engine";

export type ApprovalStatus = "suggested" | "pending_approval" | "approved" | "rejected" | "auto_executed";
export type ActionType = "candidate_outreach" | "rejection_email" | "ranking_override" | "sourcing_import" | "interview_schedule" | "preference_change" | "automation_action" | "sourcing_outreach";

interface ApprovalRequest {
  employerId: number;
  actionType: ActionType;
  targetId?: number;
  targetType?: string;
  aiSuggestion?: Record<string, unknown>;
  confidence: number;
  reasoning?: DecisionArtifact["reasoning"];
  autoThreshold?: number;
}

export class ApprovalManager {
  private readonly AUTO_THRESHOLD_DEFAULT = 0.95;

  async submit(params: ApprovalRequest): Promise<{ id: number; status: ApprovalStatus; autoExecuted: boolean }> {
    try {
      const autoThreshold = params.autoThreshold ?? this.AUTO_THRESHOLD_DEFAULT;
      const shouldAutoExecute = params.confidence >= autoThreshold;

      if (shouldAutoExecute) {
        const result = await db.execute(sql`
          INSERT INTO approval_workflows (employer_id, action_type, target_id, target_type, ai_suggestion, confidence, reasoning, status, auto_executed)
          VALUES (${params.employerId}, ${params.actionType}, ${params.targetId ?? null},
                  ${params.targetType ?? null}, ${JSON.stringify(params.aiSuggestion || {})}::jsonb,
                  ${params.confidence}, ${JSON.stringify(params.reasoning || [])}::jsonb,
                  'auto_executed', true)
          RETURNING id
        `);
        const id = Number((result.rows?.[0] as any)?.id || 0);

        await eventBus.emitEvent({
          type: RecruitmentEventTypes.AGENT_ACTION,
          source: "approval-manager",
          payload: { actionType: params.actionType, status: "auto_executed", confidence: params.confidence, threshold: autoThreshold },
          timestamp: new Date(),
        });

        return { id, status: "auto_executed", autoExecuted: true };
      }

      const result = await db.execute(sql`
        INSERT INTO approval_workflows (employer_id, action_type, target_id, target_type, ai_suggestion, confidence, reasoning, status)
        VALUES (${params.employerId}, ${params.actionType}, ${params.targetId ?? null},
                ${params.targetType ?? null}, ${JSON.stringify(params.aiSuggestion || {})}::jsonb,
                ${params.confidence}, ${JSON.stringify(params.reasoning || [])}::jsonb,
                'pending_approval')
        RETURNING id
      `);
      const id = Number((result.rows?.[0] as any)?.id || 0);

      await eventBus.emitEvent({
        type: RecruitmentEventTypes.AGENT_ACTION,
        source: "approval-manager",
        payload: { actionType: params.actionType, status: "pending_approval", confidence: params.confidence, approvalId: id },
        timestamp: new Date(),
      });

      return { id, status: "pending_approval", autoExecuted: false };
    } catch (err) {
      logger.error({ err, employerId: params.employerId, actionType: params.actionType }, "Failed to submit approval request");
      throw err;
    }
  }

  async approve(approvalId: number, approvedBy: number): Promise<boolean> {
    try {
      const result = await db.execute(sql`
        UPDATE approval_workflows
        SET status = 'approved', approved_by = ${approvedBy}, decided_at = NOW(), updated_at = NOW()
        WHERE id = ${approvalId} AND status = 'pending_approval'
        RETURNING id
      `);
      return (result.rows?.length || 0) > 0;
    } catch (err) {
      logger.error({ err, approvalId }, "Failed to approve workflow");
      return false;
    }
  }

  async reject(approvalId: number, approvedBy: number, reason: string): Promise<boolean> {
    try {
      const result = await db.execute(sql`
        UPDATE approval_workflows
        SET status = 'rejected', approved_by = ${approvedBy}, rejected_reason = ${reason},
            decided_at = NOW(), updated_at = NOW()
        WHERE id = ${approvalId} AND status = 'pending_approval'
        RETURNING id
      `);
      return (result.rows?.length || 0) > 0;
    } catch (err) {
      logger.error({ err, approvalId }, "Failed to reject workflow");
      return false;
    }
  }

  async getPendingApprovals(employerId: number, limit = 20): Promise<any[]> {
    try {
      const rows = await db.execute(sql`
        SELECT id, action_type, target_id, target_type, ai_suggestion, confidence, reasoning, created_at
        FROM approval_workflows
        WHERE employer_id = ${employerId} AND status = 'pending_approval'
        ORDER BY confidence ASC, created_at DESC
        LIMIT ${limit}
      `);
      return rows.rows || [];
    } catch {
      return [];
    }
  }

  async getApprovalHistory(employerId: number, limit = 50): Promise<any[]> {
    try {
      const rows = await db.execute(sql`
        SELECT id, action_type, target_id, target_type, ai_suggestion, confidence, status,
               approved_by, rejected_reason, auto_executed, decided_at, created_at
        FROM approval_workflows
        WHERE employer_id = ${employerId}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `);
      return rows.rows || [];
    } catch {
      return [];
    }
  }

  async getApprovalStats(employerId: number): Promise<{
    total: number; pending: number; approved: number; rejected: number; autoExecuted: number;
    approvalRate: number; autoExecutionRate: number;
  }> {
    try {
      const rows = await db.execute(sql`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'pending_approval') as pending,
          COUNT(*) FILTER (WHERE status = 'approved') as approved,
          COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
          COUNT(*) FILTER (WHERE auto_executed = true) as auto_executed
        FROM approval_workflows
        WHERE employer_id = ${employerId}
      `);
      const r = rows.rows?.[0] as any || {};
      const total = Number(r.total) || 0;
      const approved = Number(r.approved) || 0;
      const rejected = Number(r.rejected) || 0;
      const autoExecuted = Number(r.auto_executed) || 0;
      const decided = approved + rejected;
      return {
        total, pending: Number(r.pending) || 0, approved, rejected, autoExecuted,
        approvalRate: decided > 0 ? Math.round((approved / decided) * 100) : 0,
        autoExecutionRate: total > 0 ? Math.round((autoExecuted / total) * 100) : 0,
      };
    } catch {
      return { total: 0, pending: 0, approved: 0, rejected: 0, autoExecuted: 0, approvalRate: 0, autoExecutionRate: 0 };
    }
  }

  async getConfidenceThreshold(employerId: number): Promise<number> {
    try {
      const rows = await db.execute(sql`
        SELECT value FROM recruiter_memory
        WHERE employer_id = ${employerId} AND key = 'auto_execution_threshold'
      `);
      if (rows.rows?.length) return Number((rows.rows[0] as any).value) || this.AUTO_THRESHOLD_DEFAULT;
      return this.AUTO_THRESHOLD_DEFAULT;
    } catch {
      return this.AUTO_THRESHOLD_DEFAULT;
    }
  }

  async setConfidenceThreshold(employerId: number, threshold: number): Promise<void> {
    try {
      await db.execute(sql`
        INSERT INTO recruiter_memory (employer_id, key, value, confidence, source)
        VALUES (${employerId}, 'auto_execution_threshold', ${String(threshold)}, 1.0, 'manual')
        ON CONFLICT (employer_id, key)
        DO UPDATE SET value = ${String(threshold)}, updated_at = NOW()
      `);
    } catch (err) {
      logger.error({ err, employerId, threshold }, "Failed to set confidence threshold");
    }
  }
}

export const approvalManager = new ApprovalManager();
