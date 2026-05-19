import { db, jobs, scrapeLogs, jobSources, sourceHealth } from "@workspace/db";
import { eq, and, gte, lt, desc, count, sql } from "drizzle-orm";
import { logger } from "../../lib/logger";

export interface DailyScrapeReport {
  date: string;
  sourcesRun: number;
  jobsIngested: number;
  jobsNew: number;
  jobsUpdated: number;
  jobsArchived: number;
  jobsDeleted: number;
  duplicatesRemoved: number;
  failures: number;
  healthWarnings: string[];
  totalActiveJobs: number;
  totalExpiredJobs: number;
  avgDuration: number;
}

export class ScrapeReporter {
  async generateDailyReport(): Promise<DailyScrapeReport> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayLogs = await db
      .select()
      .from(scrapeLogs)
      .where(
        and(
          gte(scrapeLogs.startedAt, today),
          lt(scrapeLogs.startedAt, tomorrow),
        ),
      )
      .orderBy(desc(scrapeLogs.startedAt));

    const sourcesRun = todayLogs.length;
    const jobsIngested = todayLogs.reduce((s, l) => s + (l.jobsScraped || 0), 0);
    const jobsNew = todayLogs.reduce((s, l) => s + (l.jobsNew || 0), 0);
    const jobsUpdated = todayLogs.reduce((s, l) => s + (l.jobsUpdated || 0), 0);
    const duplicatesRemoved = todayLogs.reduce((s, l) => s + (l.jobsDuplicates || 0), 0);
    const failures = todayLogs.reduce((s, l) => s + (l.jobsFailed || 0), 0);

    const durations = todayLogs
      .filter((l) => l.duration != null)
      .map((l) => l.duration as number);
    const avgDuration = durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0;

    const [{ active }] = await db
      .select({ active: count() })
      .from(jobs)
      .where(and(eq(jobs.status, "active"), eq(jobs.isArchived, false)));

    const [{ expired }] = await db
      .select({ expired: count() })
      .from(jobs)
      .where(eq(jobs.status, "expired"));

    const unhealthySources = await db
      .select()
      .from(sourceHealth)
      .where(
        and(
          eq(sourceHealth.healthLevel, "warning"),
          gte(sourceHealth.updatedAt, today),
        ),
      );

    const [{ archived }] = await db
      .select({ archived: count() })
      .from(jobs)
      .where(
        and(
          eq(jobs.isArchived, true),
          gte(jobs.archivedAt ?? sql`NOW() - INTERVAL '1 day'`, today),
        ),
      );

    const report: DailyScrapeReport = {
      date: today.toISOString().split("T")[0],
      sourcesRun,
      jobsIngested,
      jobsNew,
      jobsUpdated,
      jobsArchived: Number(archived),
      jobsDeleted: 0,
      duplicatesRemoved,
      failures,
      healthWarnings: unhealthySources.map((s) =>
        `${s.sourceName}: score=${s.healthScore} (${s.healthLevel})`,
      ),
      totalActiveJobs: Number(active),
      totalExpiredJobs: Number(expired),
      avgDuration,
    };

    await db.insert(scrapeLogs).values({
      sourceName: "daily-report",
      status: "completed",
      jobsScraped: report.jobsIngested,
      jobsNew: report.jobsNew,
      jobsUpdated: report.jobsUpdated,
      jobsDuplicates: report.duplicatesRemoved,
      jobsFailed: report.failures,
      metadata: report as any,
      startedAt: today,
      completedAt: new Date(),
      duration: avgDuration,
    });

    logger.info(report, "Daily scrape report generated");
    return report;
  }

  async getLatestReport(): Promise<DailyScrapeReport | null> {
    const [log] = await db
      .select()
      .from(scrapeLogs)
      .where(eq(scrapeLogs.sourceName, "daily-report"))
      .orderBy(desc(scrapeLogs.startedAt))
      .limit(1);

    if (!log) return null;
    return (log.metadata as unknown as DailyScrapeReport) ?? null;
  }

  async sendNotification(report: DailyScrapeReport): Promise<void> {
    const webhookUrl = process.env.REPORT_WEBHOOK_URL;
    if (!webhookUrl) {
      logger.info("No REPORT_WEBHOOK_URL configured, skipping notification");
      return;
    }

    try {
      const payload = {
        text: [
          `📊 *Daily Scrape Report — ${report.date}*`,
          ``,
          `• Sources run: ${report.sourcesRun}`,
          `• Jobs ingested: ${report.jobsIngested}`,
          `• New: ${report.jobsNew} | Updated: ${report.jobsUpdated}`,
          `• Archived: ${report.jobsArchived} | Deleted: ${report.jobsDeleted}`,
          `• Duplicates removed: ${report.duplicatesRemoved}`,
          `• Failures: ${report.failures}`,
          `• Active jobs: ${report.totalActiveJobs}`,
          `• Avg duration: ${report.avgDuration}s`,
          report.healthWarnings.length > 0
            ? `\n⚠️ *Health Warnings:*\n${report.healthWarnings.map((w) => `  • ${w}`).join("\n")}`
            : "",
        ].join("\n"),
      };

      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      logger.info("Report notification sent");
    } catch (err: any) {
      logger.error({ err }, "Failed to send report notification");
    }
  }
}

export const scrapeReporter = new ScrapeReporter();
