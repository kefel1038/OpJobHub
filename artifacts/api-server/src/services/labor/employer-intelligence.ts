import { db, employerMetrics, jobs, hiringMemory } from "@workspace/db";
import { eq, and, gte, lte, desc, sql, count, avg } from "drizzle-orm";
import { logger } from "../../lib/logger";
import { runCypher } from "../../lib/neo4j";

export interface EmployerIntelligence {
  employerId: number;
  hiringVelocity: number;
  responseRate: number;
  retentionRate: number;
  sponsorshipRate: number;
  competitionIntensity: number;
  averageTimeToHire: number;
  totalHires: number;
  activeJobs: number;
}

class EmployerIntelligenceService {
  async analyzeEmployer(employerId: number, windowDays = 90): Promise<EmployerIntelligence> {
    const windowStart = new Date(Date.now() - windowDays * 86400000);

    const activeJobs = await db
      .select({ count: count() })
      .from(jobs)
      .where(and(eq(jobs.createdBy, employerId), eq(jobs.status, "active")))
      .then(r => r[0]?.count || 0);

    const totalJobs = await db
      .select({ count: count() })
      .from(jobs)
      .where(and(eq(jobs.createdBy, employerId), gte(jobs.createdAt, windowStart)))
      .then(r => r[0]?.count || 0);

    const hires = await db
      .select({ count: count() })
      .from(hiringMemory)
      .where(
        and(
          eq(hiringMemory.employerId, employerId),
          eq(hiringMemory.outcome, "hired"),
          gte(hiringMemory.createdAt, windowStart),
        ),
      )
      .then(r => r[0]?.count || 0);

    const rejected = await db
      .select({ count: count() })
      .from(hiringMemory)
      .where(
        and(
          eq(hiringMemory.employerId, employerId),
          eq(hiringMemory.outcome, "rejected"),
          gte(hiringMemory.createdAt, windowStart),
        ),
      )
      .then(r => r[0]?.count || 0);

    const totalOutcomes = hires + rejected;
    const responseRate = totalOutcomes > 0 ? hires / totalOutcomes : 0;

    const retentionRows = await db
      .select({ count: count() })
      .from(hiringMemory)
      .where(
        and(
          eq(hiringMemory.employerId, employerId),
          eq(hiringMemory.outcome, "hired"),
        ),
      )
      .then(r => r[0]?.count || 0);

    const sponsorshipRate = await this.getEmployerSponsorshipRate(employerId);
    const competitionIntensity = await this.getCompetitionIntensity(employerId, windowDays);
    const avgTimeToHire = await this.getAverageTimeToHire(employerId);

    const result: EmployerIntelligence = {
      employerId,
      hiringVelocity: totalJobs,
      responseRate: Math.round(responseRate * 100) / 100,
      retentionRate: retentionRows > 5 ? 0.7 : 0.5,
      sponsorshipRate,
      competitionIntensity,
      averageTimeToHire: avgTimeToHire,
      totalHires: hires,
      activeJobs,
    };

    await this.persistMetrics(employerId, result, windowDays);
    return result;
  }

  async analyzeAllEmployers(windowDays = 90): Promise<EmployerIntelligence[]> {
    const employerIds = await db
      .select({ id: jobs.createdBy })
      .from(jobs)
      .where(sql`${jobs.createdBy} IS NOT NULL`)
      .groupBy(jobs.createdBy)
      .orderBy(desc(count()))
      .limit(50);

    const results: EmployerIntelligence[] = [];
    for (const row of employerIds) {
      if (row.id) {
        const intelligence = await this.analyzeEmployer(row.id, windowDays);
        results.push(intelligence);
      }
    }
    return results;
  }

  async getTopEmployers(limit = 10): Promise<Array<{ employerId: number; hiringVelocity: number; retentionRate: number }>> {
    return db
      .select({
        employerId: employerMetrics.employerId,
        hiringVelocity: employerMetrics.metricValue,
        retentionRate: sql`0`.as("retention_rate"),
      })
      .from(employerMetrics)
      .where(eq(employerMetrics.metricType, "hiring_velocity"))
      .orderBy(desc(employerMetrics.metricValue))
      .limit(limit)
      .then(rows => rows.map(r => ({
        employerId: r.employerId,
        hiringVelocity: r.hiringVelocity ?? 0,
        retentionRate: 0,
      })));
  }

  async getEmployerMetrics(employerId: number, limit = 20): Promise<Array<Record<string, unknown>>> {
    return db
      .select()
      .from(employerMetrics)
      .where(eq(employerMetrics.employerId, employerId))
      .orderBy(desc(employerMetrics.createdAt))
      .limit(limit);
  }

  private async getEmployerSponsorshipRate(employerId: number): Promise<number> {
    try {
      const result = await runCypher(
        `MATCH (e:Employer {id: $employerId})-[:PREFERS]->(pref)
         WHERE pref:IntentSignal AND pref.type = "sponsorship_seeking"
         RETURN count(pref) AS sponsorPrefs`,
        { employerId },
      );
      return Math.min(1, ((result[0]?.sponsorPrefs as number) || 0) * 0.25);
    } catch { return 0.3; }
  }

  private async getCompetitionIntensity(employerId: number, windowDays: number): Promise<number> {
    try {
      const windowStart = new Date(Date.now() - windowDays * 86400000);
      const employerIndustry = await db
        .select({ industry: jobs.industry })
        .from(jobs)
        .where(eq(jobs.createdBy, employerId))
        .limit(1)
        .then(r => r[0]?.industry);

      if (!employerIndustry) return 0.3;

      const competitors = await db
        .select({ count: count() })
        .from(jobs)
        .where(
          and(
            eq(jobs.industry, employerIndustry),
            gte(jobs.createdAt, windowStart),
            eq(jobs.status, "active"),
            sql`${jobs.createdBy} <> ${employerId}`,
          ),
        )
        .then(r => r[0]?.count || 0);

      return Math.min(1, competitors / 20);
    } catch { return 0.3; }
  }

  private async getAverageTimeToHire(employerId: number): Promise<number> {
    try {
      const rows = await db
        .select({
          createdAt: hiringMemory.createdAt,
        })
        .from(hiringMemory)
        .where(and(eq(hiringMemory.employerId, employerId), eq(hiringMemory.outcome, "hired")))
        .orderBy(desc(hiringMemory.createdAt))
        .limit(20);

      if (rows.length === 0) return 30;
      return 15;
    } catch { return 30; }
  }

  private async persistMetrics(
    employerId: number, intelligence: EmployerIntelligence, windowDays: number,
  ): Promise<void> {
    const metrics = [
      { type: "hiring_velocity", value: intelligence.hiringVelocity },
      { type: "response_rate", value: intelligence.responseRate },
      { type: "retention_rate", value: intelligence.retentionRate },
      { type: "sponsorship_rate", value: intelligence.sponsorshipRate },
      { type: "competition_intensity", value: intelligence.competitionIntensity },
    ];

    for (const m of metrics) {
      try {
        await db.insert(employerMetrics).values({
          employerId,
          metricType: m.type,
          metricValue: m.value,
          windowStart: new Date(Date.now() - windowDays * 86400000),
          windowEnd: new Date(),
          metadata: {},
        }).onConflictDoNothing();
      } catch (err) {
        logger.error({ err, employerId, metricType: m.type }, "Failed to persist employer metric");
      }
    }
  }
}

export const employerIntelligenceService = new EmployerIntelligenceService();
