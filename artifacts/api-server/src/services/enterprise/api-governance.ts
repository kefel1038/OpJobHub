import { logger } from "../../lib/logger";
import { tenantOrchestrator } from "./tenant-orchestrator";

export interface GovernanceContext {
  tenantId?: number;
  apiKeyId?: number;
  method: string;
  path: string;
  ipAddress?: string;
  userAgent?: string;
  rateLimitTier: string;
}

export interface GovernanceResult {
  allowed: boolean;
  reason?: string;
  rateLimitRemaining: number;
  auditEntry: {
    tenantId?: number; apiKeyId?: number; method: string; path: string;
    ipAddress?: string; userAgent?: string; rateLimitRemaining: number;
  };
}

class ApiGovernance {
  private rateLimitCounters: Map<string, { count: number; windowStart: number }> = new Map();

  async checkAccess(ctx: GovernanceContext): Promise<GovernanceResult> {
    const result: GovernanceResult = {
      allowed: true,
      rateLimitRemaining: Infinity,
      auditEntry: {
        tenantId: ctx.tenantId, apiKeyId: ctx.apiKeyId,
        method: ctx.method, path: ctx.path,
        ipAddress: ctx.ipAddress, userAgent: ctx.userAgent,
        rateLimitRemaining: Infinity,
      },
    };
    if (ctx.tenantId) {
      const rateLimitCheck = await this.checkRateLimit(ctx.tenantId, ctx.rateLimitTier);
      result.allowed = rateLimitCheck.allowed;
      result.reason = rateLimitCheck.reason;
      result.rateLimitRemaining = rateLimitCheck.remaining;
      result.auditEntry.rateLimitRemaining = rateLimitCheck.remaining;
    }
    return result;
  }

  async recordAccess(ctx: GovernanceContext, statusCode: number, durationMs: number, errorDetails?: string): Promise<void> {
    if (ctx.tenantId) {
      await tenantOrchestrator.incrementQuota(ctx.tenantId, "api_calls_per_day");
      await tenantOrchestrator.incrementQuota(ctx.tenantId, "api_calls_per_minute");
    }
    await tenantOrchestrator.logAuditEntry({
      tenantId: ctx.tenantId, apiKeyId: ctx.apiKeyId,
      method: ctx.method, path: ctx.path,
      statusCode, durationMs,
      ipAddress: ctx.ipAddress, userAgent: ctx.userAgent,
      errorDetails,
    });
  }

  private async checkRateLimit(tenantId: number, tier: string): Promise<{ allowed: boolean; reason?: string; remaining: number }> {
    const perMinuteQuota = await tenantOrchestrator.checkQuota(tenantId, "api_calls_per_minute");
    if (!perMinuteQuota.allowed) {
      return { allowed: false, reason: "Rate limit exceeded (per minute)", remaining: 0 };
    }
    const perDayQuota = await tenantOrchestrator.checkQuota(tenantId, "api_calls_per_day");
    if (!perDayQuota.allowed) {
      return { allowed: false, reason: "Daily quota exceeded", remaining: 0 };
    }
    const ipKey = `ip_${tenantId}`;
    const now = Date.now();
    const windowMs = 60000;
    const maxPerWindow = tier === "enterprise" ? 1000 : tier === "premium" ? 500 : tier === "standard" ? 100 : 50;
    let counter = this.rateLimitCounters.get(ipKey);
    if (!counter || (now - counter.windowStart) > windowMs) {
      counter = { count: 0, windowStart: now };
      this.rateLimitCounters.set(ipKey, counter);
    }
    counter.count++;
    const windowRemaining = Math.max(0, maxPerWindow - counter.count);
    const remaining = Math.min(perMinuteQuota.remaining, perDayQuota.remaining, windowRemaining);
    if (counter.count > maxPerWindow) {
      return { allowed: false, reason: "Rate limit exceeded (burst)", remaining: 0 };
    }
    return { allowed: true, remaining };
  }
}

export const apiGovernance = new ApiGovernance();
