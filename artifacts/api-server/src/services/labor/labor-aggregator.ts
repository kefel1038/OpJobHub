import { db, discoveredCandidates, jobs, hiringSimulations, intentSignals, laborMetrics } from "@workspace/db";
import { eq, and, gte, lte, desc, sql, count, avg } from "drizzle-orm";
import { logger } from "../../lib/logger";
import { runCypher } from "../../lib/neo4j";

export interface DemandMetric {
  role: string;
  industry: string;
  region: string;
  demandCount: number;
  growthRate: number;
  sponsorshipDemand: number;
  urgencyScore: number;
}

export interface SupplyMetric {
  skill: string;
  region: string;
  candidateCount: number;
  relocationReadiness: number;
  engagementLevel: number;
}

interface AggregatedMetric {
  metricType: string;
  metricName: string;
  metricValue: number;
  previousValue: number;
  changeRate: number;
  region?: string;
  industry?: string;
  role?: string;
  skill?: string;
  confidence: number;
  sampleSize: number;
}

class LaborAggregator {
  async aggregateDemandIntelligence(windowDays = 90): Promise<DemandMetric[]> {
    const windowStart = new Date(Date.now() - windowDays * 86400000);

    const jobDemand = await db
      .select({
        title: jobs.title,
        industry: jobs.industry,
        location: jobs.location,
        count: count(),
      })
      .from(jobs)
      .where(
        and(
          gte(jobs.createdAt, windowStart),
          eq(jobs.status, "active"),
          sql`${jobs.title} IS NOT NULL`,
        ),
      )
      .groupBy(jobs.title, jobs.industry, jobs.location)
      .orderBy(desc(count()))
      .limit(100);

    const demand: DemandMetric[] = [];
    for (const row of jobDemand) {
      const priorCount = await this.getPriorCount(
        "jobs", row.title || "", row.industry || "", row.location || "",
        windowDays,
      );
      const growthRate = priorCount > 0 ? ((row.count - priorCount) / priorCount) * 100 : 0;

      const sponsorshipCount = await this.getSponsorshipDemand(row.title || "", row.location || "");
      const urgencyScore = await this.getUrgencyScore(row.title || "");

      demand.push({
        role: row.title || "",
        industry: row.industry || "",
        region: row.location || "",
        demandCount: row.count,
        growthRate: Math.round(growthRate * 100) / 100,
        sponsorshipDemand: sponsorshipCount,
        urgencyScore,
      });
    }

    return demand;
  }

  async aggregateSupplyIntelligence(windowDays = 90): Promise<SupplyMetric[]> {
    const windowStart = new Date(Date.now() - windowDays * 86400000);

    const candidates = await db
      .select({
        skills: discoveredCandidates.normalizedSkills,
        location: discoveredCandidates.location,
        count: count(),
      })
      .from(discoveredCandidates)
      .where(gte(discoveredCandidates.createdAt, windowStart))
      .groupBy(discoveredCandidates.normalizedSkills, discoveredCandidates.location)
      .orderBy(desc(count()))
      .limit(100);

    const supply: SupplyMetric[] = [];
    for (const row of candidates) {
      if (!row.skills || !row.location) continue;
      for (const skill of row.skills.slice(0, 5)) {
        const relocationReadiness = await this.getRelocationReadiness(skill, row.location);
        const engagementLevel = await this.getEngagementLevel(skill, row.location);
        supply.push({
          skill,
          region: row.location,
          candidateCount: row.count,
          relocationReadiness,
          engagementLevel,
        });
      }
    }
    return supply;
  }

  async aggregateWorkforceMetrics(windowDays = 90): Promise<AggregatedMetric[]> {
    const metrics: AggregatedMetric[] = [];
    const windowStart = new Date(Date.now() - windowDays * 86400000);

    const hiringVelocity = await this.computeHiringVelocity(windowDays);
    metrics.push(hiringVelocity);

    const sponsorshipDemand = await this.computeSponsorshipDemandMetric(windowDays);
    metrics.push(sponsorshipDemand);

    const talentScarcity = await this.computeTalentScarcity(windowDays);
    metrics.push(talentScarcity);

    const wagePressure = await this.computeWagePressure(windowDays);
    metrics.push(wagePressure);

    const candidateEngagement = await this.computeCandidateEngagement(windowDays);
    metrics.push(candidateEngagement);

    return metrics;
  }

  async persistMetrics(metrics: AggregatedMetric[]): Promise<void> {
    for (const m of metrics) {
      await db.insert(laborMetrics).values({
        metricType: m.metricType,
        metricName: m.metricName,
        metricValue: m.metricValue,
        previousValue: m.previousValue,
        changeRate: m.changeRate,
        region: m.region || null,
        industry: m.industry || null,
        role: m.role || null,
        skill: m.skill || null,
        confidence: m.confidence,
        sampleSize: m.sampleSize,
        windowStart: new Date(Date.now() - 90 * 86400000),
        windowEnd: new Date(),
        metadata: {},
      }).onConflictDoNothing();
    }
  }

  private async getPriorCount(
    type: string, title: string, industry: string, location: string, windowDays: number,
  ): Promise<number> {
    const priorStart = new Date(Date.now() - windowDays * 2 * 86400000);
    const priorEnd = new Date(Date.now() - windowDays * 86400000);
    try {
      const rows = await db
        .select({ count: count() })
        .from(jobs)
        .where(
          and(
            gte(jobs.createdAt, priorStart),
            lte(jobs.createdAt, priorEnd),
            eq(jobs.title, title),
            eq(jobs.industry, industry),
            eq(jobs.location, location),
          ),
        );
      return rows[0]?.count || 0;
    } catch { return 0; }
  }

  private async getSponsorshipDemand(role: string, location: string): Promise<number> {
    try {
      const result = await runCypher(
        `MATCH (j:JobRole {name: $role})<-[:MATCHES]-(c:Candidate)
         OPTIONAL MATCH (c)-[:INTERESTED_IN]->(int:IntentSignal {type: "sponsorship_seeking"})
         RETURN count(DISTINCT c) AS total, count(DISTINCT int) AS seeking`,
        { role: role.toLowerCase(), location: location.toLowerCase() },
      );
      const total = (result[0]?.total as number) || 1;
      const seeking = (result[0]?.seeking as number) || 0;
      return Math.round((seeking / total) * 100) / 100;
    } catch { return 0.3; }
  }

  private async getUrgencyScore(role: string): Promise<number> {
    try {
      const result = await runCypher(
        `MATCH (j:JobRole {name: $role})<-[:MATCHES]-(c:Candidate)
         OPTIONAL MATCH (c)-[:INTERESTED_IN]->(int:IntentSignal {type: "immediate_availability"})
         RETURN count(DISTINCT c) AS total, count(DISTINCT int) AS urgent`,
        { role: role.toLowerCase() },
      );
      const total = (result[0]?.total as number) || 1;
      const urgent = (result[0]?.urgent as number) || 0;
      return Math.min(1, urgent / Math.max(total, 1));
    } catch { return 0.3; }
  }

  private async getRelocationReadiness(skill: string, region: string): Promise<number> {
    try {
      const result = await runCypher(
        `MATCH (s:Skill {name: $skill})<-[:HAS_SKILL]-(c:Candidate)-[:LOCATED_IN]->(l:Location {name: $region})
         OPTIONAL MATCH (c)-[:INTERESTED_IN]->(reloc:IntentSignal {type: "relocation_intent"})
         WITH count(DISTINCT c) AS total, count(DISTINCT reloc) AS relocCount
         RETURN CASE WHEN total > 0 THEN toFloat(relocCount) / toFloat(total) ELSE 0.3 END AS readiness`,
        { skill: skill.toLowerCase(), region: region.toLowerCase() },
      );
      return (result[0]?.readiness as number) || 0.3;
    } catch { return 0.3; }
  }

  private async getEngagementLevel(skill: string, region: string): Promise<number> {
    try {
      const result = await runCypher(
        `MATCH (s:Skill {name: $skill})<-[:HAS_SKILL]-(c:Candidate)-[:LOCATED_IN]->(l:Location {name: $region})
         RETURN count(c) AS total`,
        { skill: skill.toLowerCase(), region: region.toLowerCase() },
      );
      return Math.min(1, ((result[0]?.total as number) || 0) / 50);
    } catch { return 0.3; }
  }

  private async computeHiringVelocity(windowDays: number): Promise<AggregatedMetric> {
    const windowStart = new Date(Date.now() - windowDays * 86400000);
    const priorStart = new Date(Date.now() - windowDays * 2 * 86400000);
    const priorEnd = new Date(Date.now() - windowDays * 86400000);

    const current = await db
      .select({ count: count() })
      .from(jobs)
      .where(and(gte(jobs.createdAt, windowStart), eq(jobs.status, "active")))
      .then(r => r[0]?.count || 0);

    const previous = await db
      .select({ count: count() })
      .from(jobs)
      .where(
        and(gte(jobs.createdAt, priorStart), lte(jobs.createdAt, priorEnd), eq(jobs.status, "active")),
      )
      .then(r => r[0]?.count || 0);

    return {
      metricType: "hiring_velocity",
      metricName: "Overall Hiring Velocity",
      metricValue: current,
      previousValue: previous,
      changeRate: previous > 0 ? Math.round(((current - previous) / previous) * 10000) / 100 : 0,
      confidence: 0.7,
      sampleSize: current + previous,
    };
  }

  private async computeSponsorshipDemandMetric(windowDays: number): Promise<AggregatedMetric> {
    const windowStart = new Date(Date.now() - windowDays * 86400000);
    const signals = await db
      .select({ count: count() })
      .from(intentSignals)
      .where(
        and(gte(intentSignals.createdAt, windowStart), eq(intentSignals.signalType, "sponsorship_seeking")),
      )
      .then(r => r[0]?.count || 0);

    const total = await db
      .select({ count: count() })
      .from(intentSignals)
      .where(gte(intentSignals.createdAt, windowStart))
      .then(r => r[0]?.count || 1);

    return {
      metricType: "sponsorship_demand",
      metricName: "Sponsorship Demand Index",
      metricValue: total > 0 ? Math.round((signals / total) * 10000) / 100 : 0,
      previousValue: 0,
      changeRate: 0,
      confidence: 0.6,
      sampleSize: total,
    };
  }

  private async computeTalentScarcity(windowDays: number): Promise<AggregatedMetric> {
    const jobCount = await db
      .select({ count: count() })
      .from(jobs)
      .where(eq(jobs.status, "active"))
      .then(r => r[0]?.count || 1);

    const candidateCount = await db
      .select({ count: count() })
      .from(discoveredCandidates)
      .where(eq(discoveredCandidates.status, "verified"))
      .then(r => r[0]?.count || 1);

    const ratio = jobCount / Math.max(candidateCount, 1);
    return {
      metricType: "talent_scarcity",
      metricName: "Talent Scarcity Index",
      metricValue: Math.round(Math.min(1, ratio / 10) * 10000) / 100,
      previousValue: 0,
      changeRate: 0,
      confidence: 0.65,
      sampleSize: jobCount + candidateCount,
    };
  }

  private async computeWagePressure(windowDays: number): Promise<AggregatedMetric> {
    const jobsWithSalary = await db
      .select({
        min: avg(jobs.salaryMin),
        max: avg(jobs.salaryMax),
        count: count(),
      })
      .from(jobs)
      .where(and(eq(jobs.status, "active"), sql`${jobs.salaryMin} IS NOT NULL`));

    const avgSalary = (Number(jobsWithSalary[0]?.min || 0) + Number(jobsWithSalary[0]?.max || 0)) / 2;
    return {
      metricType: "wage_pressure",
      metricName: "Wage Pressure Index",
      metricValue: Math.round(Math.min(1, avgSalary / 200000) * 10000) / 100,
      previousValue: 0,
      changeRate: 0,
      confidence: 0.5,
      sampleSize: jobsWithSalary[0]?.count || 0,
    };
  }

  private async computeCandidateEngagement(windowDays: number): Promise<AggregatedMetric> {
    const windowStart = new Date(Date.now() - windowDays * 86400000);
    const recent = await db
      .select({ count: count() })
      .from(discoveredCandidates)
      .where(gte(discoveredCandidates.updatedAt, windowStart))
      .then(r => r[0]?.count || 0);

    const total = await db
      .select({ count: count() })
      .from(discoveredCandidates)
      .then(r => r[0]?.count || 1);

    return {
      metricType: "candidate_engagement",
      metricName: "Candidate Engagement Index",
      metricValue: Math.round((recent / Math.max(total, 1)) * 10000) / 100,
      previousValue: 0,
      changeRate: 0,
      confidence: 0.7,
      sampleSize: total,
    };
  }
}

export const laborAggregator = new LaborAggregator();
