import { db, candidateSources } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { logger } from "../../lib/logger";

export interface SourceAdapterConfig {
  name: string;
  displayName: string;
  type: string;
  baseUrl?: string;
  rateLimitPerHour?: number;
  config?: Record<string, unknown>;
}

const DEFAULT_SOURCES: SourceAdapterConfig[] = [
  { name: "linkedin", displayName: "LinkedIn", type: "linkedin", baseUrl: "https://linkedin.com", rateLimitPerHour: 50 },
  { name: "github", displayName: "GitHub", type: "github", baseUrl: "https://github.com", rateLimitPerHour: 100 },
  { name: "stackoverflow", displayName: "Stack Overflow", type: "stackoverflow", baseUrl: "https://stackoverflow.com", rateLimitPerHour: 80 },
  { name: "telegram", displayName: "Telegram", type: "telegram", rateLimitPerHour: 200 },
  { name: "whatsapp", displayName: "WhatsApp Communities", type: "whatsapp", rateLimitPerHour: 100 },
  { name: "twitter", displayName: "X/Twitter", type: "twitter", baseUrl: "https://twitter.com", rateLimitPerHour: 100 },
  { name: "upwork", displayName: "Upwork", type: "freelance", baseUrl: "https://upwork.com", rateLimitPerHour: 50 },
  { name: "fiverr", displayName: "Fiverr", type: "freelance", baseUrl: "https://fiverr.com", rateLimitPerHour: 50 },
  { name: "university_portals", displayName: "University Portals", type: "university", rateLimitPerHour: 200 },
  { name: "custom_web", displayName: "Custom Web Source", type: "web", rateLimitPerHour: 100 },
];

class SourceManager {
  async initializeDefaultSources(): Promise<void> {
    for (const src of DEFAULT_SOURCES) {
      try {
        const existing = await db.select().from(candidateSources).where(eq(candidateSources.name, src.name)).limit(1);
        if (existing.length === 0) {
          await db.insert(candidateSources).values({
            name: src.name,
            displayName: src.displayName,
            type: src.type,
            baseUrl: src.baseUrl,
            rateLimitPerHour: src.rateLimitPerHour,
            config: src.config || {},
            trustScore: 0.5,
            isActive: true,
          });
          logger.info({ source: src.name }, "Default candidate source initialized");
        }
      } catch (err) {
        logger.error({ err, source: src.name }, "Failed to initialize source");
      }
    }
  }

  async registerSource(config: SourceAdapterConfig): Promise<number> {
    const [result] = await db.insert(candidateSources).values({
      name: config.name,
      displayName: config.displayName,
      type: config.type,
      baseUrl: config.baseUrl,
      rateLimitPerHour: config.rateLimitPerHour || 100,
      config: config.config || {},
      trustScore: 0.5,
      isActive: true,
    }).returning({ id: candidateSources.id });
    logger.info({ sourceId: result.id, name: config.name }, "New candidate source registered");
    return result.id;
  }

  async getAllSources(): Promise<Array<{ id: number; name: string; displayName: string; type: string; isActive: boolean | null; trustScore: number | null; rateLimitPerHour: number | null; lastQueriedAt: Date | null }>> {
    return db.select({
      id: candidateSources.id,
      name: candidateSources.name,
      displayName: candidateSources.displayName,
      type: candidateSources.type,
      isActive: candidateSources.isActive,
      trustScore: candidateSources.trustScore,
      rateLimitPerHour: candidateSources.rateLimitPerHour,
      lastQueriedAt: candidateSources.lastQueriedAt,
    }).from(candidateSources).orderBy(candidateSources.name);
  }

  async getActiveSources(): Promise<Array<{ id: number; name: string; displayName: string; type: string; trustScore: number | null; rateLimitPerHour: number | null; config: any }>> {
    const rows = await db.select({
      id: candidateSources.id,
      name: candidateSources.name,
      displayName: candidateSources.displayName,
      type: candidateSources.type,
      trustScore: candidateSources.trustScore,
      rateLimitPerHour: candidateSources.rateLimitPerHour,
      config: candidateSources.config,
    }).from(candidateSources).where(eq(candidateSources.isActive, true));
    return rows as any;
  }

  async updateTrustScore(sourceId: number, score: number): Promise<void> {
    await db.update(candidateSources)
      .set({ trustScore: Math.max(0, Math.min(1, score)), updatedAt: new Date() })
      .where(eq(candidateSources.id, sourceId));
  }

  async recordQuery(sourceId: number): Promise<void> {
    await db.update(candidateSources)
      .set({ lastQueriedAt: new Date(), updatedAt: new Date() })
      .where(eq(candidateSources.id, sourceId));
  }

  async checkRateLimit(sourceId: number): Promise<boolean> {
    const [source] = await db.select({
      rateLimitPerHour: candidateSources.rateLimitPerHour,
      lastQueriedAt: candidateSources.lastQueriedAt,
    }).from(candidateSources).where(eq(candidateSources.id, sourceId)).limit(1);

    if (!source) return false;
    if (!source.lastQueriedAt) return true;

    const hourAgo = new Date(Date.now() - 3600000);
    if (source.lastQueriedAt < hourAgo) return true;

    const recentCount = await db.select({ count: sql<number>`count(*)::int` })
      .from(candidateSources)
      .where(and(
        eq(candidateSources.id, sourceId),
        sql`last_queried_at > ${hourAgo.toISOString()}::timestamp`
      ));
    const count = recentCount[0]?.count || 0;
    return count < (source.rateLimitPerHour || 100);
  }

  async setActive(sourceId: number, active: boolean): Promise<void> {
    await db.update(candidateSources)
      .set({ isActive: active, updatedAt: new Date() })
      .where(eq(candidateSources.id, sourceId));
  }
}

export const sourceManager = new SourceManager();
