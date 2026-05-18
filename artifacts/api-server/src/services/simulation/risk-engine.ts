import { db, riskProfiles, discoveredCandidates } from "@workspace/db";
import { eq, and, desc, sql } from "drizzle-orm";
import { logger } from "../../lib/logger";
import { runCypher } from "../../lib/neo4j";

export interface RiskResult {
  riskScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  contributingFactors: string[];
  mitigationSuggestions: string[];
}

class RiskEngine {
  async assessChurnRisk(params: {
    employerId: number;
    candidateId: number;
    jobId?: number;
  }): Promise<RiskResult> {
    const contributingFactors: string[] = [];
    const mitigationSuggestions: string[] = [];

    const tenureScore = await this.getTenureRisk(params.candidateId);
    if (tenureScore > 0.6) contributingFactors.push("Short historical tenure");
    if (tenureScore > 0.8) mitigationSuggestions.push("Consider longer probation with retention incentives");

    const relocationIntent = await this.getRelocationIntent(params.candidateId);
    if (relocationIntent > 0.5) {
      contributingFactors.push("Active relocation intent");
      mitigationSuggestions.push("Explore remote work options or relocation support");
    }

    const careerChangeIntent = await this.getCareerChangeIntent(params.candidateId);
    if (careerChangeIntent > 0.5) {
      contributingFactors.push("Career change signals detected");
      mitigationSuggestions.push("Discuss career growth path and upskilling opportunities");
    }

    const engagement = await this.getEngagementScore(params.candidateId);
    if (engagement < 0.4) {
      contributingFactors.push("Low profile engagement");
      mitigationSuggestions.push("Increase communication and feedback loops");
    }

    const score = tenureScore * 0.3 + relocationIntent * 0.25 + careerChangeIntent * 0.25 + (1 - engagement) * 0.2;
    const result = this.buildResult(score, contributingFactors, mitigationSuggestions);
    await this.persistRisk(params.employerId, params.candidateId, params.jobId, "churn", result);
    return result;
  }

  async assessMismatchRisk(params: {
    employerId: number;
    candidateId: number;
    jobId?: number;
    jobSkills?: string[];
    candidateSkills?: string[];
  }): Promise<RiskResult> {
    const contributingFactors: string[] = [];
    const mitigationSuggestions: string[] = [];

    let skillGap = 0;
    if (params.jobSkills && params.candidateSkills) {
      const missing = params.jobSkills.filter(s => !(params.candidateSkills ?? []).includes(s));
      skillGap = params.jobSkills.length > 0 ? missing.length / params.jobSkills.length : 0;
      if (skillGap > 0.3) {
        contributingFactors.push(`${missing.length} skill gap${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}`);
        mitigationSuggestions.push("Provide training plan for missing skills");
      }
    }

    const experienceFit = await this.getExperienceFit(params.candidateId);
    if (experienceFit < 0.4) {
      contributingFactors.push("Experience level mismatch");
      mitigationSuggestions.push("Adjust role expectations or consider mentorship pairing");
    }

    const locationFit = await this.getLocationFit(params.candidateId);
    if (locationFit < 0.4) {
      contributingFactors.push("Geographic mismatch");
      mitigationSuggestions.push("Consider remote or hybrid arrangement");
    }

    const score = skillGap * 0.4 + (1 - experienceFit) * 0.35 + (1 - locationFit) * 0.25;
    const result = this.buildResult(score, contributingFactors, mitigationSuggestions);
    await this.persistRisk(params.employerId, params.candidateId, params.jobId, "mismatch", result);
    return result;
  }

  async assessSponsorshipFailureRisk(params: {
    employerId: number;
    candidateId: number;
    jobId?: number;
  }): Promise<RiskResult> {
    const contributingFactors: string[] = [];
    const mitigationSuggestions: string[] = [];

    const visaStatus = await this.getVisaStatus(params.candidateId);
    if (visaStatus === "none") {
      contributingFactors.push("No current visa status");
      mitigationSuggestions.push("Begin sponsorship process early");
    } else if (visaStatus === "temporary") {
      contributingFactors.push("Temporary visa — expiry risk");
      mitigationSuggestions.push("Plan visa renewal timeline");
    }

    const relocationHistory = await this.getRelocationHistory(params.candidateId);
    if (relocationHistory < 0.3) {
      contributingFactors.push("Limited relocation experience");
      mitigationSuggestions.push("Provide relocation assistance and onboarding support");
    }

    const intentStrength = await this.getSponsorshipIntent(params.candidateId);
    if (intentStrength < 0.5) {
      contributingFactors.push("Weak sponsorship-seeking signals");
      mitigationSuggestions.push("Verify candidate commitment to relocation");
    }

    const score = (visaStatus === "none" ? 0.8 : visaStatus === "temporary" ? 0.5 : 0.2) * 0.4
      + (1 - relocationHistory) * 0.3
      + (1 - intentStrength) * 0.3;
    const result = this.buildResult(score, contributingFactors, mitigationSuggestions);
    await this.persistRisk(params.employerId, params.candidateId, params.jobId, "sponsorship_failure", result);
    return result;
  }

  async assessFraudRisk(params: {
    employerId: number;
    candidateId: number;
    jobId?: number;
  }): Promise<RiskResult> {
    const contributingFactors: string[] = [];
    const mitigationSuggestions: string[] = [];

    const candidate = await db
      .select({
        authenticityScore: discoveredCandidates.authenticityScore,
        spamProbability: discoveredCandidates.spamProbability,
        fraudProbability: discoveredCandidates.fraudProbability,
        verificationStatus: discoveredCandidates.verificationStatus,
      })
      .from(discoveredCandidates)
      .where(eq(discoveredCandidates.id, params.candidateId))
      .limit(1)
      .then(rows => rows[0]);

    if (!candidate) return this.buildResult(0.5, ["No verification data available"], ["Request candidate verification"]);

    if (candidate.authenticityScore !== null && candidate.authenticityScore < 0.5) {
      contributingFactors.push("Low authenticity score");
      mitigationSuggestions.push("Request additional identity verification");
    }
    if (candidate.spamProbability !== null && candidate.spamProbability > 0.5) {
      contributingFactors.push("High spam probability");
      mitigationSuggestions.push("Review candidate source and engagement history");
    }
    if (candidate.fraudProbability !== null && candidate.fraudProbability > 0.5) {
      contributingFactors.push("Elevated fraud probability");
      mitigationSuggestions.push("Conduct thorough background check");
    }
    if (candidate.verificationStatus === "rejected") {
      contributingFactors.push("Previously rejected by verification");
      mitigationSuggestions.push("Manual review required");
    }

    const score = (candidate.authenticityScore !== null ? 1 - candidate.authenticityScore : 0.5) * 0.35
      + (candidate.spamProbability ?? 0) * 0.3
      + (candidate.fraudProbability ?? 0) * 0.35;
    const result = this.buildResult(score, contributingFactors, mitigationSuggestions);
    await this.persistRisk(params.employerId, params.candidateId, params.jobId, "fraud", result);
    return result;
  }

  async assessSkillObsolescenceRisk(params: {
    employerId: number;
    candidateId: number;
    industry?: string;
    jobId?: number;
  }): Promise<RiskResult> {
    const contributingFactors: string[] = [];
    const mitigationSuggestions: string[] = [];

    const skillCount = await this.getCandidateSkillCount(params.candidateId);
    if (skillCount < 3) {
      contributingFactors.push("Very limited skill set");
      mitigationSuggestions.push("Encourage continuous learning and certification");
    }

    const certCount = await this.getCandidateCertCount(params.candidateId);
    if (certCount === 0) {
      contributingFactors.push("No certifications");
      mitigationSuggestions.push("Identify industry-relevant certifications");
    }

    const industryDemand = params.industry ? await this.getIndustryDemand(params.industry) : 0.5;
    if (industryDemand < 0.3) {
      contributingFactors.push("Low industry demand for current skills");
      mitigationSuggestions.push("Explore adjacent high-demand skill areas");
    }

    const score = (skillCount < 3 ? 0.6 : 1 - Math.min(1, skillCount / 15)) * 0.35
      + (certCount === 0 ? 0.7 : 0.2) * 0.3
      + (1 - industryDemand) * 0.35;
    const result = this.buildResult(score, contributingFactors, mitigationSuggestions);
    await this.persistRisk(params.employerId, params.candidateId, params.jobId, "skill_obsolescence", result);
    return result;
  }

  async assessMigrationInstability(params: {
    employerId: number;
    candidateId: number;
    jobId?: number;
  }): Promise<RiskResult> {
    const contributingFactors: string[] = [];
    const mitigationSuggestions: string[] = [];

    const relocationIntent = await this.getRelocationIntent(params.candidateId);
    if (relocationIntent > 0.6) {
      contributingFactors.push("Strong relocation intent");
      mitigationSuggestions.push("Clarify long-term location commitment");
    }

    const regionStability = await this.getRegionStability(params.candidateId);
    if (regionStability < 0.4) {
      contributingFactors.push("Region with high emigration");
      mitigationSuggestions.push("Consider multi-country talent pool");
    }

    const score = relocationIntent * 0.5 + (1 - regionStability) * 0.5;
    const result = this.buildResult(score, contributingFactors, mitigationSuggestions);
    await this.persistRisk(params.employerId, params.candidateId, params.jobId, "migration_instability", result);
    return result;
  }

  async assessAll(
    employerId: number,
    candidateId: number,
    jobId?: number,
    jobSkills?: string[],
    candidateSkills?: string[],
  ): Promise<Record<string, RiskResult>> {
    const [churn, mismatch, sponsorship, fraud, obsolescence, migration] = await Promise.all([
      this.assessChurnRisk({ employerId, candidateId, jobId }),
      this.assessMismatchRisk({ employerId, candidateId, jobId, jobSkills, candidateSkills }),
      this.assessSponsorshipFailureRisk({ employerId, candidateId, jobId }),
      this.assessFraudRisk({ employerId, candidateId, jobId }),
      this.assessSkillObsolescenceRisk({ employerId, candidateId, industry: undefined, jobId }),
      this.assessMigrationInstability({ employerId, candidateId, jobId }),
    ]);

    return { churn, mismatch, sponsorship_failure: sponsorship, fraud, skill_obsolescence: obsolescence, migration_instability: migration };
  }

  private buildResult(score: number, contributingFactors: string[], mitigationSuggestions: string[]): RiskResult {
    const clampedScore = Math.max(0, Math.min(1, score));
    return {
      riskScore: Math.round(clampedScore * 100) / 100,
      riskLevel: this.determineRiskLevel(clampedScore),
      contributingFactors,
      mitigationSuggestions,
    };
  }

  private determineRiskLevel(score: number): "low" | "medium" | "high" | "critical" {
    if (score >= 0.8) return "critical";
    if (score >= 0.6) return "high";
    if (score >= 0.3) return "medium";
    return "low";
  }

  private async persistRisk(
    employerId: number, candidateId: number, jobId: number | undefined,
    riskType: string, result: RiskResult,
  ): Promise<void> {
    try {
      await db.insert(riskProfiles).values({
        employerId,
        candidateId: candidateId || null,
        jobId: jobId || null,
        riskType,
        riskScore: result.riskScore,
        riskLevel: result.riskLevel,
        contributingFactors: result.contributingFactors,
        mitigationSuggestions: result.mitigationSuggestions,
        active: true,
      }).onConflictDoNothing();
    } catch (err) {
      logger.error({ err, riskType }, "Failed to persist risk profile");
    }
  }

  // ─── Helper methods ──────────────────────────────────────────

  private async getTenureRisk(candidateId: number): Promise<number> {
    try {
      const result = await runCypher(
        `MATCH (c:Candidate {id: $candidateId})
         RETURN c.previousEmployers AS employers`,
        { candidateId }
      );
      const employers = (result[0]?.employers as string[]) || [];
      return employers.length > 3 ? 0.7 : employers.length > 1 ? 0.4 : 0.2;
    } catch { return 0.3; }
  }

  private async getRelocationIntent(candidateId: number): Promise<number> {
    try {
      const result = await runCypher(
        `MATCH (c:Candidate {id: $candidateId})-[:INTERESTED_IN]->(int:IntentSignal {type: "relocation_intent"})
         RETURN count(int) AS intentCount`,
        { candidateId }
      );
      return Math.min(1, ((result[0]?.intentCount as number) || 0) * 0.3);
    } catch { return 0.2; }
  }

  private async getCareerChangeIntent(candidateId: number): Promise<number> {
    try {
      const result = await runCypher(
        `MATCH (c:Candidate {id: $candidateId})-[:INTERESTED_IN]->(int:IntentSignal {type: "career_change"})
         RETURN count(int) > 0 AS hasIntent`,
        { candidateId }
      );
      return result[0]?.hasIntent ? 0.7 : 0.2;
    } catch { return 0.2; }
  }

  private async getEngagementScore(candidateId: number): Promise<number> {
    try {
      const result = await runCypher(
        `MATCH (c:Candidate {id: $candidateId})
         RETURN c.headline IS NOT NULL AS hasHeadline,
                c.location IS NOT NULL AS hasLocation,
                size(c.skills) > 0 AS hasSkills`,
        { candidateId }
      );
      const r = result[0] as any;
      return ((r?.hasHeadline ? 0.3 : 0) + (r?.hasLocation ? 0.3 : 0) + (r?.hasSkills ? 0.4 : 0));
    } catch { return 0.5; }
  }

  private async getExperienceFit(candidateId: number): Promise<number> {
    try {
      const result = await runCypher(
        `MATCH (c:Candidate {id: $candidateId})
         RETURN c.experienceLevel AS level`,
        { candidateId }
      );
      const level = result[0]?.level as string;
      const levels: Record<string, number> = { entry: 0.3, junior: 0.5, mid: 0.7, senior: 0.85, lead: 0.95, executive: 0.9 };
      return levels[level] || 0.5;
    } catch { return 0.5; }
  }

  private async getLocationFit(candidateId: number): Promise<number> {
    try {
      const result = await runCypher(
        `MATCH (c:Candidate {id: $candidateId})
         RETURN c.location AS location`,
        { candidateId }
      );
      return (result[0]?.location as string) ? 0.7 : 0.3;
    } catch { return 0.5; }
  }

  private async getVisaStatus(candidateId: number): Promise<string> {
    try {
      const result = await runCypher(
        `MATCH (c:Candidate {id: $candidateId})
         RETURN c.visaStatus AS status`,
        { candidateId }
      );
      return (result[0]?.status as string) || "none";
    } catch { return "none"; }
  }

  private async getRelocationHistory(candidateId: number): Promise<number> {
    try {
      const result = await runCypher(
        `MATCH (c:Candidate {id: $candidateId})
         RETURN c.previousEmployers IS NOT NULL AS hasHistory`,
        { candidateId }
      );
      return result[0]?.hasHistory ? 0.6 : 0.2;
    } catch { return 0.3; }
  }

  private async getSponsorshipIntent(candidateId: number): Promise<number> {
    try {
      const result = await runCypher(
        `MATCH (c:Candidate {id: $candidateId})-[:INTERESTED_IN]->(int:IntentSignal {type: "sponsorship_seeking"})
         RETURN count(int) > 0 AS seeking`,
        { candidateId }
      );
      return result[0]?.seeking ? 0.8 : 0.3;
    } catch { return 0.4; }
  }

  private async getCandidateSkillCount(candidateId: number): Promise<number> {
    try {
      const result = await runCypher(
        `MATCH (c:Candidate {id: $candidateId})-[:HAS_SKILL]->(s:Skill)
         RETURN count(s) AS count`,
        { candidateId }
      );
      return (result[0]?.count as number) || 0;
    } catch { return 0; }
  }

  private async getCandidateCertCount(candidateId: number): Promise<number> {
    try {
      const result = await runCypher(
        `MATCH (c:Candidate {id: $candidateId})-[:CERTIFIED_IN]->(cert:Certification)
         RETURN count(cert) AS count`,
        { candidateId }
      );
      return (result[0]?.count as number) || 0;
    } catch { return 0; }
  }

  private async getIndustryDemand(industry: string): Promise<number> {
    try {
      const result = await runCypher(
        `MATCH (ind:Industry {name: $industry})<-[:BELONGS_TO]-(c:Candidate)
         RETURN count(c) AS count`,
        { industry }
      );
      return Math.min(1, ((result[0]?.count as number) || 0) / 20);
    } catch { return 0.5; }
  }

  private async getRegionStability(candidateId: number): Promise<number> {
    try {
      const result = await runCypher(
        `MATCH (c:Candidate {id: $candidateId})-[:LOCATED_IN]->(l:Location)
         OPTIONAL MATCH (l)<-[:LOCATED_IN]-(other:Candidate)-[:INTERESTED_IN]->(reloc:IntentSignal {type: "relocation_intent"})
         WITH count(DISTINCT other) AS total, count(DISTINCT reloc) AS relocCount
         RETURN CASE WHEN total > 0 THEN 1.0 - toFloat(relocCount) / toFloat(total) ELSE 0.6 END AS stability`,
        { candidateId }
      );
      return (result[0]?.stability as number) || 0.6;
    } catch { return 0.6; }
  }
}

export const riskEngine = new RiskEngine();
