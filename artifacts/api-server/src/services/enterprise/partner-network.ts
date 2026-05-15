import { logger } from "../../lib/logger";
import { db, partnerNetwork, partnerIntegrations } from "@workspace/db";
import { eq, and, desc, count } from "drizzle-orm";

export interface PartnerResult {
  id: number;
  partnerType: string;
  organizationName: string;
  slug: string;
  description: string | null;
  website: string | null;
  region: string | null;
  country: string | null;
  specializations: string[];
  trustScore: number;
  active: boolean;
  verifiedAt: string | null;
  createdAt: string;
}

export interface IntegrationResult {
  id: number;
  partnerId: number;
  integrationType: string;
  name: string;
  status: string;
  lastSyncAt: string | null;
  lastSyncStatus: string | null;
  active: boolean;
}

class PartnerNetwork {
  async registerPartner(params: {
    partnerType: string;
    organizationName: string;
    slug: string;
    description?: string;
    website?: string;
    contactName?: string;
    contactEmail?: string;
    region?: string;
    country?: string;
    specializations?: string[];
    certifications?: string[];
    integrationCapabilities?: string[];
  }): Promise<PartnerResult> {
    const [partner] = await db.insert(partnerNetwork).values({
      partnerType: params.partnerType,
      organizationName: params.organizationName,
      slug: params.slug,
      description: params.description,
      website: params.website,
      contactName: params.contactName,
      contactEmail: params.contactEmail,
      region: params.region,
      country: params.country,
      specializations: (params.specializations ?? []) as unknown as Record<string, unknown>,
      certifications: (params.certifications ?? []) as unknown as Record<string, unknown>,
      integrationCapabilities: (params.integrationCapabilities ?? []) as unknown as Record<string, unknown>,
      dataSharingLevel: "standard",
      trustScore: 0.5,
      active: true,
    }).returning();
    logger.info({ partnerId: partner.id, name: partner.organizationName }, "Partner registered");
    return this.mapPartner(partner);
  }

  async getPartner(id: number): Promise<PartnerResult | null> {
    const [partner] = await db.select().from(partnerNetwork).where(eq(partnerNetwork.id, id));
    return partner ? this.mapPartner(partner) : null;
  }

  async getPartnerBySlug(slug: string): Promise<PartnerResult | null> {
    const [partner] = await db.select().from(partnerNetwork).where(eq(partnerNetwork.slug, slug));
    return partner ? this.mapPartner(partner) : null;
  }

  async listPartners(params: {
    partnerType?: string; region?: string; activeOnly?: boolean;
    limit?: number;
  } = {}): Promise<PartnerResult[]> {
    const conditions: ReturnType<typeof eq>[] = [];
    if (params.partnerType) conditions.push(eq(partnerNetwork.partnerType, params.partnerType));
    if (params.region) conditions.push(eq(partnerNetwork.region, params.region));
    if (params.activeOnly !== false) conditions.push(eq(partnerNetwork.active, true));
    const partners = await db.select().from(partnerNetwork)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(partnerNetwork.trustScore))
      .limit(params.limit ?? 100);
    return partners.map(p => this.mapPartner(p));
  }

  async updatePartner(id: number, params: Partial<{
    organizationName: string; description: string; website: string;
    contactName: string; contactEmail: string; region: string; country: string;
    specializations: string[]; certifications: string[];
    integrationCapabilities: string[]; dataSharingLevel: string;
    trustScore: number; active: boolean;
  }>): Promise<PartnerResult | null> {
    const updateData: Record<string, unknown> = {};
    if (params.organizationName) updateData.organizationName = params.organizationName;
    if (params.description !== undefined) updateData.description = params.description;
    if (params.website !== undefined) updateData.website = params.website;
    if (params.contactName !== undefined) updateData.contactName = params.contactName;
    if (params.contactEmail !== undefined) updateData.contactEmail = params.contactEmail;
    if (params.region !== undefined) updateData.region = params.region;
    if (params.country !== undefined) updateData.country = params.country;
    if (params.specializations) updateData.specializations = params.specializations;
    if (params.certifications) updateData.certifications = params.certifications;
    if (params.integrationCapabilities) updateData.integrationCapabilities = params.integrationCapabilities;
    if (params.dataSharingLevel) updateData.dataSharingLevel = params.dataSharingLevel;
    if (params.trustScore !== undefined) updateData.trustScore = params.trustScore;
    if (params.active !== undefined) updateData.active = params.active;
    const [partner] = await db.update(partnerNetwork)
      .set(updateData).where(eq(partnerNetwork.id, id)).returning();
    return partner ? this.mapPartner(partner) : null;
  }

  async verifyPartner(id: number): Promise<PartnerResult | null> {
    const [partner] = await db.update(partnerNetwork)
      .set({ verifiedAt: new Date(), trustScore: 0.8 })
      .where(eq(partnerNetwork.id, id)).returning();
    return partner ? this.mapPartner(partner) : null;
  }

  async getPartnerStats(): Promise<{
    total: number; verified: number; byType: Record<string, number>; byRegion: Record<string, number>;
  }> {
    const [totalResult] = await db.select({ value: count() }).from(partnerNetwork);
    const [verifiedResult] = await db.select({ value: count() }).from(partnerNetwork)
      .where(and(eq(partnerNetwork.active, true), ...(true ? [] : [])));
    const typeRows = await db.select({
      partnerType: partnerNetwork.partnerType, value: count(),
    }).from(partnerNetwork).groupBy(partnerNetwork.partnerType);
    const regionRows = await db.select({
      region: partnerNetwork.region, value: count(),
    }).from(partnerNetwork).groupBy(partnerNetwork.region);
    return {
      total: Number(totalResult?.value ?? 0),
      verified: Number(verifiedResult?.value ?? 0),
      byType: Object.fromEntries(typeRows.map(r => [r.partnerType, Number(r.value)])),
      byRegion: Object.fromEntries(regionRows.map(r => [r.region, Number(r.value)])),
    };
  }

  // ─── Integration Management ──────────────────────────────

  async createIntegration(params: {
    partnerId: number; integrationType: string; name: string;
    configuration?: Record<string, unknown>; tenantId?: number;
  }): Promise<IntegrationResult> {
    const [integration] = await db.insert(partnerIntegrations).values({
      partnerId: params.partnerId, tenantId: params.tenantId,
      integrationType: params.integrationType, name: params.name,
      configuration: (params.configuration ?? {}) as Record<string, unknown>,
    }).returning();
    return this.mapIntegration(integration);
  }

  async getIntegrations(partnerId: number): Promise<IntegrationResult[]> {
    const integrations = await db.select().from(partnerIntegrations)
      .where(eq(partnerIntegrations.partnerId, partnerId));
    return integrations.map(i => this.mapIntegration(i));
  }

  async updateIntegrationStatus(id: number, status: string, errorDetails?: string): Promise<IntegrationResult | null> {
    const updateData: Record<string, unknown> = { status };
    if (status === "active") updateData.lastSyncAt = new Date();
    if (status === "active") updateData.lastSyncStatus = "success";
    if (errorDetails) updateData.errorDetails = errorDetails;
    const [integration] = await db.update(partnerIntegrations)
      .set(updateData).where(eq(partnerIntegrations.id, id)).returning();
    return integration ? this.mapIntegration(integration) : null;
  }

  private mapPartner(p: typeof partnerNetwork.$inferSelect): PartnerResult {
    return {
      id: p.id, partnerType: p.partnerType, organizationName: p.organizationName,
      slug: p.slug, description: p.description, website: p.website,
      region: p.region, country: p.country,
      specializations: (p.specializations ?? []) as string[],
      trustScore: p.trustScore ?? 0.5,
      active: p.active ?? true,
      verifiedAt: p.verifiedAt?.toISOString() ?? null,
      createdAt: p.createdAt?.toISOString() ?? new Date().toISOString(),
    };
  }

  private mapIntegration(i: typeof partnerIntegrations.$inferSelect): IntegrationResult {
    return {
      id: i.id, partnerId: i.partnerId, integrationType: i.integrationType,
      name: i.name, status: i.status,
      lastSyncAt: i.lastSyncAt?.toISOString() ?? null,
      lastSyncStatus: i.lastSyncStatus,
      active: i.active ?? true,
    };
  }
}

export const partnerNetworkService = new PartnerNetwork();
