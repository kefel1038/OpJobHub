import { db, jobs } from "@workspace/db";
import { eq, and, lt, gte, sql, desc, isNull } from "drizzle-orm";
import { logger } from "../../lib/logger";

const FRESHNESS_CONFIG = {
  FRESH_DAYS: Number(process.env.FRESHNESS_FRESH_DAYS) || 7,
  ACTIVE_DAYS: Number(process.env.FRESHNESS_ACTIVE_DAYS) || 30,
  AGING_DAYS: Number(process.env.FRESHNESS_AGING_DAYS) || 45,
  STALE_DAYS: Number(process.env.FRESHNESS_STALE_DAYS) || 60,
};

export class FreshnessEngine {
  async computeScore(job: {
    id: number;
    postedAt?: Date | string | null;
    lastSeenAt?: Date | string | null;
    scrapedAt?: Date | string | null;
    createdAt: Date | string;
    viewCount?: number | null;
    applyCount?: number | null;
    saveCount?: number | null;
  }): Promise<number> {
    const now = new Date();
    const posted = job.postedAt ? new Date(job.postedAt) : new Date(job.createdAt);
    const lastSeen = job.lastSeenAt ? new Date(job.lastSeenAt) : null;
    const scraped = job.scrapedAt ? new Date(job.scrapedAt) : null;

    const ageDays = (now.getTime() - posted.getTime()) / (1000 * 60 * 60 * 24);
    const recencyHours = lastSeen
      ? (now.getTime() - lastSeen.getTime()) / (1000 * 60 * 60)
      : ageDays * 24;

    let score = 100;

    const recencyDeduction = Math.min(recencyHours / 24 * 5, 40);
    score -= recencyDeduction;

    const ageDeduction = Math.min(ageDays * 1.5, 30);
    score -= ageDeduction;

    if (!lastSeen) score -= 10;

    const views = job.viewCount ?? 0;
    const applies = job.applyCount ?? 0;
    const saves = job.saveCount ?? 0;
    const engagementBonus = Math.min((views * 0.5 + applies * 3 + saves * 2) / 10, 15);
    score += engagementBonus;

    if (scraped) {
      const hoursSinceScrape = (now.getTime() - scraped.getTime()) / (1000 * 60 * 60);
      if (hoursSinceScrape < 24) score += 10;
      else if (hoursSinceScrape < 72) score += 5;
    }

    if (lastSeen) {
      const daysSinceSeen = (now.getTime() - lastSeen.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceSeen < 1) score += 10;
      else if (daysSinceSeen < 3) score += 5;
      else if (daysSinceSeen > FRESHNESS_CONFIG.AGING_DAYS) score -= 20;
    }

    if (ageDays < 1) score += 5;
    if (ageDays > FRESHNESS_CONFIG.STALE_DAYS) score = Math.min(score, 20);

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  classify(score: number): "fresh" | "active" | "aging" | "stale" {
    if (score >= 90) return "fresh";
    if (score >= 60) return "active";
    if (score >= 30) return "aging";
    return "stale";
  }

  async recomputeAll(): Promise<number> {
    const allJobs = await db
      .select({
        id: jobs.id,
        postedAt: jobs.postedAt,
        lastSeenAt: jobs.lastSeenAt,
        scrapedAt: jobs.scrapedAt,
        createdAt: jobs.createdAt,
        viewCount: jobs.viewCount,
        applyCount: jobs.applyCount,
        saveCount: jobs.saveCount,
      })
      .from(jobs)
      .where(
        and(
          eq(jobs.isArchived, false),
          eq(jobs.status, "active"),
        ),
      );

    let updated = 0;
    for (const job of allJobs) {
      const score = await this.computeScore(job);
      await db.update(jobs).set({ freshnessScore: score }).where(eq(jobs.id, job.id));
      updated++;
    }

    logger.info({ count: updated }, "Freshness scores recomputed");
    return updated;
  }

  async recomputeForJob(jobId: number): Promise<number> {
    const [job] = await db
      .select({
        id: jobs.id,
        postedAt: jobs.postedAt,
        lastSeenAt: jobs.lastSeenAt,
        scrapedAt: jobs.scrapedAt,
        createdAt: jobs.createdAt,
        viewCount: jobs.viewCount,
        applyCount: jobs.applyCount,
        saveCount: jobs.saveCount,
      })
      .from(jobs)
      .where(eq(jobs.id, jobId))
      .limit(1);

    if (!job) return 0;

    const score = await this.computeScore(job);
    await db.update(jobs).set({ freshnessScore: score }).where(eq(jobs.id, jobId));
    return score;
  }
}

export const freshnessEngine = new FreshnessEngine();
