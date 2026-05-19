import { db, sourceHealth, scrapeLogs, jobSources } from "@workspace/db";
import { eq, desc, and, gte, lt, sql, count, avg } from "drizzle-orm";
import { logger } from "../../lib/logger";

export type HealthLevel = "healthy" | "warning" | "broken";

interface SourceMetrics {
  sourceName: string;
  sourceId: number | null;
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  lastRunAt: Date | null;
  lastSuccessAt: Date | null;
  lastFailureAt: Date | null;
  lastError: string | null;
  consecutiveFailures: number;
  totalJobs: number;
  avgJobsPerRun: number;
  lastDurationMs: number | null;
  status403Count: number;
  zeroJobRuns: number;
}

export class SourceHealthMonitor {
  async computeHealthLevel(metrics: SourceMetrics): Promise<{ level: HealthLevel; score: number }> {
    let score = 100;

    const successRate = metrics.totalRuns > 0
      ? metrics.successfulRuns / metrics.totalRuns
      : 1;

    score -= (1 - successRate) * 40;

    score -= Math.min(metrics.consecutiveFailures * 10, 30);

    score -= Math.min(metrics.status403Count * 15, 25);

    score -= Math.min(metrics.zeroJobRuns * 5, 15);

    if (metrics.lastDurationMs && metrics.lastDurationMs > 60000) score -= 10;

    const finalScore = Math.max(0, Math.min(100, Math.round(score)));

    let level: HealthLevel = "healthy";
    if (finalScore < 40) level = "broken";
    else if (finalScore < 70) level = "warning";

    return { level, score: finalScore };
  }

  async updateAllSources(): Promise<void> {
    const sources = await db.select().from(jobSources).where(eq(jobSources.isActive, true));

    for (const source of sources) {
      try {
        await this.updateSourceHealth(source.id, source.name);
      } catch (err: any) {
        logger.error({ err, source: source.name }, "Failed to update source health");
      }
    }

    logger.info({ count: sources.length }, "Source health metrics updated");
  }

  async updateSourceHealth(sourceId: number, sourceName: string): Promise<{
    level: HealthLevel;
    score: number;
  }> {
    const logs = await db
      .select({
        status: scrapeLogs.status,
        jobsScraped: scrapeLogs.jobsScraped,
        jobsFailed: scrapeLogs.jobsFailed,
        errors: scrapeLogs.errors,
        duration: scrapeLogs.duration,
        startedAt: scrapeLogs.startedAt,
        completedAt: scrapeLogs.completedAt,
      })
      .from(scrapeLogs)
      .where(eq(scrapeLogs.sourceName, sourceName))
      .orderBy(desc(scrapeLogs.startedAt))
      .limit(50);

    if (logs.length === 0) return { level: "healthy", score: 100 };

    const totalRuns = logs.length;
    const successfulRuns = logs.filter((l) => l.status === "completed").length;
    const failedRuns = logs.filter((l) => l.status === "completed_with_errors" || l.status === "failed").length;

    let consecutiveFailures = 0;
    for (const log of logs) {
      if (log.status === "completed_with_errors" || log.status === "failed") {
        consecutiveFailures++;
      } else {
        break;
      }
    }

    const lastRunAt = logs[0]?.completedAt || logs[0]?.startedAt || null;
    const lastSuccess = logs.find((l) => l.status === "completed");
    const lastFailure = logs.find((l) => l.status === "completed_with_errors" || l.status === "failed");

    const totalJobs = logs.reduce((sum, l) => sum + (l.jobsScraped || 0), 0);
    const avgJobsPerRun = totalRuns > 0 ? totalJobs / totalRuns : 0;

    const durations = logs
      .filter((l) => l.duration != null)
      .map((l) => l.duration as number);
    const lastDurationMs = durations.length > 0 ? durations[0] * 1000 : null;

    const errorTexts = logs.flatMap((l) => l.errors || []);
    const status403Count = errorTexts.filter((e) =>
      e.toLowerCase().includes("403") || e.toLowerCase().includes("forbidden") || e.toLowerCase().includes("blocked"),
    ).length;
    const zeroJobRuns = logs.filter((l) => (l.jobsScraped || 0) === 0).length;

    const lastError = logs[0]?.errors && logs[0].errors.length > 0
      ? logs[0].errors[0]
      : null;

    const metrics: SourceMetrics = {
      sourceName,
      sourceId,
      totalRuns,
      successfulRuns,
      failedRuns,
      lastRunAt: lastRunAt ? new Date(lastRunAt) : null,
      lastSuccessAt: lastSuccess?.completedAt ? new Date(lastSuccess.completedAt) : null,
      lastFailureAt: lastFailure?.completedAt ? new Date(lastFailure.completedAt) : lastFailure?.startedAt ? new Date(lastFailure.startedAt) : null,
      lastError,
      consecutiveFailures,
      totalJobs,
      avgJobsPerRun,
      lastDurationMs,
      status403Count,
      zeroJobRuns,
    };

    const { level, score } = await this.computeHealthLevel(metrics);

    await db
      .insert(sourceHealth)
      .values({
        sourceId,
        sourceName,
        runsTotal: totalRuns,
        runsSuccessful: successfulRuns,
        runsFailed: failedRuns,
        lastRunAt: metrics.lastRunAt,
        lastSuccessAt: metrics.lastSuccessAt,
        lastFailureAt: metrics.lastFailureAt,
        lastError,
        consecutiveFailures,
        jobsTotal: totalJobs,
        jobsNewTotal: totalJobs,
        jobsAvgPerRun: avgJobsPerRun,
        status403Count,
        selectorFailures: 0,
        navigationFailures: 0,
        zeroJobRuns,
        avgDurationMs: durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length * 1000 : 0,
        lastDurationMs: lastDurationMs ?? undefined,
        healthLevel: level,
        healthScore: score,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: sourceHealth.sourceName,
        set: {
          sourceId,
          runsTotal: totalRuns,
          runsSuccessful: successfulRuns,
          runsFailed: failedRuns,
          lastRunAt: metrics.lastRunAt,
          lastSuccessAt: metrics.lastSuccessAt,
          lastFailureAt: metrics.lastFailureAt,
          lastError,
          consecutiveFailures,
          jobsTotal: totalJobs,
          jobsNewTotal: totalJobs,
          jobsAvgPerRun: avgJobsPerRun,
          status403Count,
          selectorFailures: 0,
          navigationFailures: 0,
          zeroJobRuns,
          avgDurationMs: durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length * 1000 : 0,
          lastDurationMs: lastDurationMs ?? undefined,
          healthLevel: level,
          healthScore: score,
          updatedAt: new Date(),
        },
      });

    logger.info({ source: sourceName, level, score }, "Source health updated");
    return { level, score };
  }

  async getSourceHealth(sourceName: string) {
    const [health] = await db
      .select()
      .from(sourceHealth)
      .where(eq(sourceHealth.sourceName, sourceName))
      .limit(1);
    return health ?? null;
  }

  async getAllSourceHealth() {
    return db
      .select()
      .from(sourceHealth)
      .orderBy(desc(sourceHealth.healthScore));
  }
}

export const sourceHealthMonitor = new SourceHealthMonitor();
