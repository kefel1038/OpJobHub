import { logger } from "../../lib/logger";
import { db, enterpriseTenants, apiKeys, enterpriseQuotas, apiAuditLog } from "@workspace/db";
import { eq, and, desc, sql, count } from "drizzle-orm";
import crypto from "node:crypto";

export interface TenantConfig {
  id: number;
  name: string;
  slug: string;
  tenantType: string;
  features: Record<string, unknown>;
  compliance: Record<string, unknown>;
  settings: Record<string, unknown>;
}

export interface ApiKeyResult {
  id: number;
  keyPrefix: string;
  name: string;
  permissions: string[];
  rateLimitTier: string;
}

export interface QuotaStatus {
  quotaType: string;
  limit: number;
  used: number;
  remaining: number;
  resetAt: string | null;
  overageAllowed: boolean;
}

class TenantOrchestrator {
  async createTenant(params: {
    name: string; slug: string; tenantType: string;
    industry?: string; region?: string; size?: string;
    contactName?: string; contactEmail?: string;
    domain?: string; features?: Record<string, unknown>;
  }): Promise<TenantConfig> {
    const [tenant] = await db.insert(enterpriseTenants).values({
      name: params.name, slug: params.slug, tenantType: params.tenantType,
      industry: params.industry, region: params.region, size: params.size,
      contactName: params.contactName, contactEmail: params.contactEmail,
      domain: params.domain, features: (params.features ?? {}) as Record<string, unknown>,
      compliance: {}, settings: {},
    }).returning();
    logger.info({ tenantId: tenant.id, slug: tenant.slug }, "Enterprise tenant created");
    await this.initializeQuotas(tenant.id);
    return this.mapTenant(tenant);
  }

  async getTenant(id: number): Promise<TenantConfig | null> {
    const [tenant] = await db.select().from(enterpriseTenants).where(eq(enterpriseTenants.id, id));
    return tenant ? this.mapTenant(tenant) : null;
  }

  async getTenantBySlug(slug: string): Promise<TenantConfig | null> {
    const [tenant] = await db.select().from(enterpriseTenants).where(eq(enterpriseTenants.slug, slug));
    return tenant ? this.mapTenant(tenant) : null;
  }

  async listTenants(activeOnly = true): Promise<TenantConfig[]> {
    const conditions = activeOnly ? [eq(enterpriseTenants.active, true)] : [];
    const tenants = await db.select().from(enterpriseTenants)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(enterpriseTenants.createdAt));
    return tenants.map(t => this.mapTenant(t));
  }

  async updateTenant(id: number, params: Partial<{
    name: string; industry: string; region: string; size: string;
    contactName: string; contactEmail: string; contactPhone: string;
    domain: string; features: Record<string, unknown>;
    compliance: Record<string, unknown>; settings: Record<string, unknown>;
    active: boolean;
  }>): Promise<TenantConfig | null> {
    const updateData: Record<string, unknown> = { ...params, updatedAt: new Date() };
    const [tenant] = await db.update(enterpriseTenants)
      .set(updateData)
      .where(eq(enterpriseTenants.id, id))
      .returning();
    return tenant ? this.mapTenant(tenant) : null;
  }

  async createApiKey(tenantId: number, params: {
    name: string; permissions: string[];
    rateLimitTier?: string; expiresAt?: string;
  }): Promise<{ apiKey: ApiKeyResult; rawKey: string }> {
    const rawKey = `jh_${crypto.randomBytes(32).toString("hex")}`;
    const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
    const keyPrefix = rawKey.substring(0, 12);

    const [key] = await db.insert(apiKeys).values({
      tenantId, name: params.name,
      keyPrefix, keyHash,
      permissions: params.permissions as unknown as Record<string, unknown>,
      rateLimitTier: params.rateLimitTier ?? "standard",
      expiresAt: params.expiresAt ? new Date(params.expiresAt) : null,
    }).returning();

    logger.info({ tenantId, keyId: key.id }, "API key created");
    return {
      apiKey: { id: key.id, keyPrefix: key.keyPrefix, name: key.name, permissions: key.permissions as string[], rateLimitTier: key.rateLimitTier ?? "standard" },
      rawKey,
    };
  }

  async validateApiKey(rawKey: string): Promise<{
    valid: boolean; tenant?: TenantConfig & { active: boolean }; key?: ApiKeyResult;
  }> {
    const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
    const [key] = await db.select().from(apiKeys)
      .where(and(eq(apiKeys.keyHash, keyHash), eq(apiKeys.active, true)));
    if (!key) return { valid: false };
    if (key.expiresAt && new Date(key.expiresAt) < new Date()) return { valid: false };
    const tenant = await this.getTenant(key.tenantId);
    const tenantRecord = await db.select().from(enterpriseTenants).where(eq(enterpriseTenants.id, key.tenantId)).then(rows => rows[0]);
    if (!tenantRecord?.active) return { valid: false };
    await db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, key.id));
    return {
      valid: true, tenant: { ...tenant!, active: tenantRecord.active ?? true },
      key: { id: key.id, keyPrefix: key.keyPrefix, name: key.name, permissions: key.permissions as string[], rateLimitTier: key.rateLimitTier ?? "standard" },
    };
  }

  async listApiKeys(tenantId: number): Promise<ApiKeyResult[]> {
    const keys = await db.select({
      id: apiKeys.id, keyPrefix: apiKeys.keyPrefix, name: apiKeys.name,
      permissions: apiKeys.permissions, rateLimitTier: apiKeys.rateLimitTier,
    }).from(apiKeys).where(eq(apiKeys.tenantId, tenantId));
    return keys.map(k => ({
      id: k.id, keyPrefix: k.keyPrefix, name: k.name,
      permissions: (k.permissions ?? []) as string[],
      rateLimitTier: (k.rateLimitTier ?? "standard") as string,
    }));
  }

  async revokeApiKey(id: number, tenantId: number): Promise<boolean> {
    const [result] = await db.update(apiKeys)
      .set({ active: false }).where(and(eq(apiKeys.id, id), eq(apiKeys.tenantId, tenantId)))
      .returning();
    return !!result;
  }

  async getQuotas(tenantId: number): Promise<QuotaStatus[]> {
    const quotas = await db.select().from(enterpriseQuotas).where(eq(enterpriseQuotas.tenantId, tenantId));
    return quotas.map(q => ({
      quotaType: q.quotaType, limit: q.limit ?? 0, used: q.used ?? 0,
      remaining: Math.max(0, (q.limit ?? 0) - (q.used ?? 0)),
      resetAt: q.resetAt?.toISOString() ?? null,
      overageAllowed: q.overageAllowed ?? false,
    }));
  }

  async checkQuota(tenantId: number, quotaType: string): Promise<{ allowed: boolean; remaining: number }> {
    const [quota] = await db.select().from(enterpriseQuotas)
      .where(and(eq(enterpriseQuotas.tenantId, tenantId), eq(enterpriseQuotas.quotaType, quotaType)));
    if (!quota) return { allowed: true, remaining: Infinity };
    const remaining = (quota.limit ?? 0) - (quota.used ?? 0);
    if (remaining <= 0) {
      if (quota.overageAllowed) return { allowed: true, remaining: 0 };
      return { allowed: false, remaining: 0 };
    }
    return { allowed: true, remaining };
  }

  async incrementQuota(tenantId: number, quotaType: string): Promise<void> {
    await db.update(enterpriseQuotas)
      .set({ used: sql`${enterpriseQuotas.used} + 1` })
      .where(and(eq(enterpriseQuotas.tenantId, tenantId), eq(enterpriseQuotas.quotaType, quotaType)));
  }

  async logAuditEntry(entry: {
    tenantId?: number; apiKeyId?: number; method: string; path: string;
    statusCode?: number; durationMs?: number;
    requestBody?: Record<string, unknown>; responseSummary?: Record<string, unknown>;
    ipAddress?: string; userAgent?: string; rateLimitRemaining?: number;
    errorDetails?: string;
  }): Promise<void> {
    await db.insert(apiAuditLog).values({
      tenantId: entry.tenantId, apiKeyId: entry.apiKeyId,
      method: entry.method, path: entry.path,
      statusCode: entry.statusCode, durationMs: entry.durationMs,
      requestBody: (entry.requestBody ?? {}) as Record<string, unknown>,
      responseSummary: (entry.responseSummary ?? {}) as Record<string, unknown>,
      ipAddress: entry.ipAddress, userAgent: entry.userAgent,
      rateLimitRemaining: entry.rateLimitRemaining,
      errorDetails: entry.errorDetails,
    });
  }

  async getAuditLog(tenantId: number, limit = 100): Promise<Record<string, unknown>[]> {
    return await db.select().from(apiAuditLog)
      .where(eq(apiAuditLog.tenantId, tenantId))
      .orderBy(desc(apiAuditLog.createdAt)).limit(limit);
  }

  async getTenantStats(): Promise<{
    totalTenants: number; activeTenants: number; totalApiKeys: number;
    totalApiCalls: number; tenantsByType: Record<string, number>;
  }> {
    const [totalResult] = await db.select({ value: count() }).from(enterpriseTenants);
    const [activeResult] = await db.select({ value: count() }).from(enterpriseTenants)
      .where(eq(enterpriseTenants.active, true));
    const [keysResult] = await db.select({ value: count() }).from(apiKeys)
      .where(eq(apiKeys.active, true));
    const [callsResult] = await db.select({ value: count() }).from(apiAuditLog);
    const typeRows = await db.select({
      tenantType: enterpriseTenants.tenantType, value: count(),
    }).from(enterpriseTenants).groupBy(enterpriseTenants.tenantType);
    const tenantsByType: Record<string, number> = {};
    for (const r of typeRows) tenantsByType[r.tenantType] = Number(r.value);
    return {
      totalTenants: Number(totalResult?.value ?? 0),
      activeTenants: Number(activeResult?.value ?? 0),
      totalApiKeys: Number(keysResult?.value ?? 0),
      totalApiCalls: Number(callsResult?.value ?? 0),
      tenantsByType,
    };
  }

  private async initializeQuotas(tenantId: number): Promise<void> {
    const defaultQuotas = [
      { quotaType: "api_calls_per_day", limit: 10000 },
      { quotaType: "api_calls_per_minute", limit: 100 },
      { quotaType: "concurrent_simulations", limit: 5 },
      { quotaType: "graph_queries_per_hour", limit: 1000 },
      { quotaType: "forecast_generations_per_day", limit: 500 },
    ];
    for (const q of defaultQuotas) {
      try {
        await db.insert(enterpriseQuotas).values({
          tenantId, quotaType: q.quotaType, limit: q.limit,
          resetAt: new Date(Date.now() + 86400000),
        });
      } catch {
        // quota already exists
      }
    }
  }

  private mapTenant(t: typeof enterpriseTenants.$inferSelect): TenantConfig {
    return {
      id: t.id, name: t.name, slug: t.slug, tenantType: t.tenantType,
      features: (t.features ?? {}) as Record<string, unknown>,
      compliance: (t.compliance ?? {}) as Record<string, unknown>,
      settings: (t.settings ?? {}) as Record<string, unknown>,
    };
  }
}

export const tenantOrchestrator = new TenantOrchestrator();
