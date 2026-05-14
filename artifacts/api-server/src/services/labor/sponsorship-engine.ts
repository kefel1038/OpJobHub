import { db, sponsorshipOutcomes, hiringMemory } from "@workspace/db";
import { eq, and, gte, lte, desc, sql, count, avg } from "drizzle-orm";
import { logger } from "../../lib/logger";
import { runCypher } from "../../lib/neo4j";

export interface SponsorshipIntelligence {
  employerId: number;
  approvalRate: number;
  averageProcessingDays: number;
  averageRetentionDays: number;
  totalApplications: number;
  approvedCount: number;
  rejectedCount: number;
  pendingCount: number;
  averageSponsorCost: number;
  topNationalities: string[];
  topRoles: string[];
}

export interface SponsorshipSummary {
  totalApplications: number;
  overallApprovalRate: number;
  averageProcessingDays: number;
  averageRetentionDays: number;
  topSponsoringEmployers: Array<{ employerId: number; count: number; approvalRate: number }>;
  topSourceCountries: string[];
  topVisaTypes: string[];
}

class SponsorshipEngine {
  async analyzeEmployerSponsorship(employerId: number): Promise<SponsorshipIntelligence> {
    const outcomes = await db
      .select()
      .from(sponsorshipOutcomes)
      .where(eq(sponsorshipOutcomes.employerId, employerId))
      .orderBy(desc(sponsorshipOutcomes.createdAt));

    const total = outcomes.length;
    const approved = outcomes.filter(o => o.status === "approved");
    const rejected = outcomes.filter(o => o.status === "rejected");
    const pending = outcomes.filter(o => o.status === "pending");

    const approvalRate = total > 0 ? approved.length / total : 0;
    const avgProcessingDays = approved.length > 0
      ? approved.reduce((s, o) => s + (o.processingDays ?? 0), 0) / approved.length
      : 0;
    const avgRetentionDays = approved.length > 0
      ? approved.reduce((s, o) => s + (o.retentionDays ?? 0), 0) / approved.length
      : 0;
    const avgCost = outcomes.length > 0
      ? outcomes.reduce((s, o) => s + (o.sponsorCost ?? 0), 0) / outcomes.length
      : 0;

    const nationalityCount = new Map<string, number>();
    for (const o of outcomes) {
      if (o.nationality) nationalityCount.set(o.nationality, (nationalityCount.get(o.nationality) || 0) + 1);
    }
    const topNationalities = [...nationalityCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([k]) => k);

    const roleCount = new Map<string, number>();
    for (const o of outcomes) {
      if (o.jobId) {
        const key = `job_${o.jobId}`;
        roleCount.set(key, (roleCount.get(key) || 0) + 1);
      }
    }
    const topRoles = [...roleCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k]) => k);

    return {
      employerId,
      approvalRate: Math.round(approvalRate * 100) / 100,
      averageProcessingDays: Math.round(avgProcessingDays),
      averageRetentionDays: Math.round(avgRetentionDays),
      totalApplications: total,
      approvedCount: approved.length,
      rejectedCount: rejected.length,
      pendingCount: pending.length,
      averageSponsorCost: Math.round(avgCost * 100) / 100,
      topNationalities,
      topRoles,
    };
  }

  async getSponsorshipSummary(): Promise<SponsorshipSummary> {
    const allOutcomes = await db.select().from(sponsorshipOutcomes);
    const total = allOutcomes.length;
    const approved = allOutcomes.filter(o => o.status === "approved").length;
    const overallApprovalRate = total > 0 ? approved / total : 0;
    const avgProcessingDays = allOutcomes.length > 0
      ? allOutcomes.reduce((s, o) => s + (o.processingDays ?? 0), 0) / allOutcomes.length
      : 0;
    const avgRetentionDays = allOutcomes.length > 0
      ? allOutcomes.reduce((s, o) => s + (o.retentionDays ?? 0), 0) / allOutcomes.length
      : 0;

    const employerMap = new Map<number, { count: number; approved: number }>();
    for (const o of allOutcomes) {
      const entry = employerMap.get(o.employerId) || { count: 0, approved: 0 };
      entry.count++;
      if (o.status === "approved") entry.approved++;
      employerMap.set(o.employerId, entry);
    }
    const topSponsoringEmployers = [...employerMap.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([id, data]) => ({
        employerId: id,
        count: data.count,
        approvalRate: data.count > 0 ? Math.round((data.approved / data.count) * 100) / 100 : 0,
      }));

    const countryCount = new Map<string, number>();
    const visaTypeCount = new Map<string, number>();
    for (const o of allOutcomes) {
      if (o.nationality) countryCount.set(o.nationality, (countryCount.get(o.nationality) || 0) + 1);
      if (o.visaType) visaTypeCount.set(o.visaType, (visaTypeCount.get(o.visaType) || 0) + 1);
    }
    const topSourceCountries = [...countryCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k]) => k);
    const topVisaTypes = [...visaTypeCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k]) => k);

    return {
      totalApplications: total,
      overallApprovalRate: Math.round(overallApprovalRate * 100) / 100,
      averageProcessingDays: Math.round(avgProcessingDays),
      averageRetentionDays: Math.round(avgRetentionDays),
      topSponsoringEmployers,
      topSourceCountries,
      topVisaTypes,
    };
  }

  async recordSponsorshipOutcome(params: {
    employerId: number; candidateId: number; jobId?: number;
    nationality?: string; destinationCountry?: string; visaType?: string;
    status: string; processingDays?: number; sponsorCost?: number;
    retentionDays?: number; salaryAtSponsorship?: number; currentSalary?: number;
    metadata?: Record<string, unknown>;
  }): Promise<{ id: number }> {
    const [inserted] = await db.insert(sponsorshipOutcomes).values({
      employerId: params.employerId,
      candidateId: params.candidateId,
      jobId: params.jobId || null,
      nationality: params.nationality || null,
      destinationCountry: params.destinationCountry || null,
      visaType: params.visaType || null,
      status: params.status,
      applicationDate: new Date(),
      approvalDate: params.status === "approved" ? new Date() : null,
      processingDays: params.processingDays || null,
      sponsorCost: params.sponsorCost || null,
      retentionDays: params.retentionDays || 0,
      salaryAtSponsorship: params.salaryAtSponsorship || null,
      currentSalary: params.currentSalary || null,
      metadata: (params.metadata ?? {}) as any,
    }).returning();
    return { id: inserted.id };
  }

  async getEmployerSponsorshipHistory(employerId: number, limit = 20): Promise<Array<Record<string, unknown>>> {
    return db
      .select()
      .from(sponsorshipOutcomes)
      .where(eq(sponsorshipOutcomes.employerId, employerId))
      .orderBy(desc(sponsorshipOutcomes.createdAt))
      .limit(limit);
  }

  async getRoleSponsorshipLikelihood(role: string): Promise<number> {
    try {
      const result = await runCypher(
        `MATCH (r:JobRole {name: $role})<-[:MATCHES]-(c:Candidate)
         OPTIONAL MATCH (c)-[:INTERESTED_IN]->(s:IntentSignal {type: "sponsorship_seeking"})
         RETURN count(DISTINCT c) AS total, count(DISTINCT s) AS seeking`,
        { role: role.toLowerCase() },
      );
      const total = (result[0]?.total as number) || 1;
      const seeking = (result[0]?.seeking as number) || 0;
      return Math.min(1, seeking / total);
    } catch { return 0.3; }
  }

  async getNationalitySponsorshipRate(nationality: string): Promise<number> {
    const rows = await db
      .select({ approved: count(), total: count() })
      .from(sponsorshipOutcomes)
      .where(eq(sponsorshipOutcomes.nationality, nationality));

    const total = rows[0]?.total || 0;
    if (total === 0) return 0.5;
    const approved = await db
      .select({ count: count() })
      .from(sponsorshipOutcomes)
      .where(
        and(
          eq(sponsorshipOutcomes.nationality, nationality),
          eq(sponsorshipOutcomes.status, "approved"),
        ),
      )
      .then(r => r[0]?.count || 0);
    return Math.round((approved / total) * 100) / 100;
  }
}

export const sponsorshipEngine = new SponsorshipEngine();
