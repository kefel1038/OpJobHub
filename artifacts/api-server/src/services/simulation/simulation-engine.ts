import { db, hiringSimulations, hiringMemory, discoveredCandidates } from "@workspace/db";
import { eq, and, sql, desc } from "drizzle-orm";
import { logger } from "../../lib/logger";
import { runCypher } from "../../lib/neo4j";
import { graphBuilder } from "../graph/graph-builder";

export interface SimulationResult {
  probability: number;
  confidence: number;
  confidenceIntervalLower: number;
  confidenceIntervalUpper: number;
  riskFactors: string[];
  positiveFactors: string[];
  simulationInputs: Record<string, unknown>;
}

interface FactorWeight {
  name: string;
  weight: number;
  value: number;
  isPositive: boolean;
}

class SimulationEngine {
  async simulateHiringSuccess(params: {
    employerId: number;
    candidateId?: number;
    jobId?: number;
    candidateSkills?: string[];
    jobSkills?: string[];
    location?: string;
    industry?: string;
    experienceLevel?: string;
  }): Promise<SimulationResult> {
    const factors: FactorWeight[] = [];

    const skillOverlap = params.candidateSkills && params.jobSkills
      ? params.candidateSkills.filter(s => params.jobSkills!.includes(s)).length / Math.max(params.jobSkills.length, 1)
      : 0.5;
    factors.push({ name: "skill_match", weight: 0.3, value: skillOverlap, isPositive: true });

    if (params.candidateId && params.employerId) {
      const prefMatch = await this.getRecruiterPreferenceMatch(params.employerId, params.candidateId);
      factors.push({ name: "recruiter_preference_alignment", weight: 0.2, value: prefMatch, isPositive: true });

      const pastSuccess = await this.getPastSimilarityScore(params.employerId, params.candidateId);
      factors.push({ name: "past_hiring_pattern", weight: 0.15, value: pastSuccess, isPositive: true });
    }

    if (params.location) {
      const migrationStability = await this.getMigrationStability(params.location);
      factors.push({ name: "migration_stability", weight: 0.1, value: migrationStability, isPositive: true });
    }

    if (params.industry) {
      const industryDemand = await this.getIndustryDemand(params.industry);
      factors.push({ name: "industry_demand", weight: 0.1, value: industryDemand, isPositive: false });
    }

    const adjacencyBonus = params.candidateSkills
      ? await this.getSkillAdjacencyScore(params.candidateSkills)
      : 0.5;
    factors.push({ name: "skill_adjacency", weight: 0.1, value: adjacencyBonus, isPositive: true });

    const intentScore = params.candidateId
      ? await this.getCandidateIntentScore(params.candidateId)
      : 0.5;
    factors.push({ name: "candidate_intent", weight: 0.05, value: intentScore, isPositive: true });

    return this.computeSimulation(factors, "hiring_success");
  }

  async simulateRetention(params: {
    employerId: number;
    candidateId: number;
    location?: string;
    industry?: string;
    experienceLevel?: string;
  }): Promise<SimulationResult> {
    const factors: FactorWeight[] = [];

    const tenurePrediction = await this.getTenurePrediction(params.candidateId);
    factors.push({ name: "historical_tenure", weight: 0.25, value: tenurePrediction, isPositive: true });

    if (params.location) {
      const reloIntent = await this.getRelocationIntent(params.candidateId);
      factors.push({ name: "relocation_intent", weight: 0.2, value: 1 - reloIntent, isPositive: true });
    }

    const careerGrowth = await this.getCareerGrowthPotential(params.candidateId);
    factors.push({ name: "career_growth_potential", weight: 0.2, value: careerGrowth, isPositive: true });

    const industryStability = params.industry
      ? await this.getIndustryStability(params.industry)
      : 0.5;
    factors.push({ name: "industry_stability", weight: 0.15, value: industryStability, isPositive: true });

    const churnSignals = await this.getChurnSignals(params.candidateId);
    factors.push({ name: "churn_signals", weight: 0.2, value: 1 - churnSignals, isPositive: true });

    return this.computeSimulation(factors, "retention_12m");
  }

  async simulateInterviewSuccess(params: {
    employerId: number;
    candidateId: number;
    jobId?: number;
  }): Promise<SimulationResult> {
    const factors: FactorWeight[] = [];

    const skillConfidence = await this.getSkillConfidence(params.candidateId);
    factors.push({ name: "skill_proficiency", weight: 0.3, value: skillConfidence, isPositive: true });

    const experienceLevel = await this.getExperienceLevel(params.candidateId);
    factors.push({ name: "experience_appropriateness", weight: 0.2, value: experienceLevel, isPositive: true });

    const communicationScore = await this.getCommunicationScore(params.candidateId);
    factors.push({ name: "communication_quality", weight: 0.15, value: communicationScore, isPositive: true });

    const prepSignals = await this.getPreparationSignals(params.candidateId);
    factors.push({ name: "preparation_signals", weight: 0.15, value: prepSignals, isPositive: true });

    const interestLevel = await this.getInterestLevel(params.candidateId);
    factors.push({ name: "candidate_interest", weight: 0.2, value: interestLevel, isPositive: true });

    return this.computeSimulation(factors, "interview_success");
  }

  async simulateOfferAcceptance(params: {
    employerId: number;
    candidateId: number;
    salary?: number;
    location?: string;
  }): Promise<SimulationResult> {
    const factors: FactorWeight[] = [];

    const engagementScore = await this.getEngagementScore(params.candidateId);
    factors.push({ name: "candidate_engagement", weight: 0.2, value: engagementScore, isPositive: true });

    const marketDemand = await this.getMarketDemandForCandidate(params.candidateId);
    factors.push({ name: "market_competition", weight: 0.2, value: 1 - marketDemand, isPositive: true });

    const intentStrength = await this.getIntentStrength(params.candidateId);
    factors.push({ name: "intent_strength", weight: 0.2, value: intentStrength, isPositive: true });

    if (params.location) {
      const locationFit = await this.getLocationFit(params.candidateId, params.location);
      factors.push({ name: "location_fit", weight: 0.15, value: locationFit, isPositive: true });
    }

    const competitorLikelihood = await this.getCompetitorOfferLikelihood(params.candidateId);
    factors.push({ name: "competing_offers", weight: 0.25, value: 1 - competitorLikelihood, isPositive: true });

    return this.computeSimulation(factors, "offer_acceptance");
  }

  async simulateSponsorshipSuccess(params: {
    employerId: number;
    candidateId: number;
    nationality?: string;
    currentLocation?: string;
  }): Promise<SimulationResult> {
    const factors: FactorWeight[] = [];

    const visaReadiness = await this.getVisaReadiness(params.candidateId);
    factors.push({ name: "visa_readiness", weight: 0.25, value: visaReadiness, isPositive: true });

    const relocationHistory = await this.getRelocationHistory(params.candidateId);
    factors.push({ name: "relocation_history", weight: 0.2, value: relocationHistory, isPositive: true });

    if (params.currentLocation) {
      const gccProximity = this.getGccProximityScore(params.currentLocation);
      factors.push({ name: "gcc_proximity", weight: 0.15, value: gccProximity, isPositive: true });
    }

    const familyStatus = await this.getFamilyStatus(params.candidateId);
    factors.push({ name: "family_mobility", weight: 0.15, value: familyStatus, isPositive: true });

    const sponsorshipIntent = await this.getSponsorshipIntent(params.candidateId);
    factors.push({ name: "sponsorship_seeking", weight: 0.25, value: sponsorshipIntent, isPositive: true });

    return this.computeSimulation(factors, "sponsorship_success");
  }

  async simulateSkillGapRisk(params: {
    jobSkills: string[];
    candidateSkills: string[];
    industry?: string;
  }): Promise<SimulationResult> {
    const missingSkills = params.jobSkills.filter(s => !params.candidateSkills.includes(s));
    const skillGapRatio = params.jobSkills.length > 0
      ? missingSkills.length / params.jobSkills.length
      : 0;

    const factors: FactorWeight[] = [
      { name: "skill_gap_ratio", weight: 0.35, value: skillGapRatio, isPositive: false },
    ];

    if (missingSkills.length > 0) {
      const adjacencyScore = await this.getSkillAdjacencyScoreForMissing(params.candidateSkills, missingSkills);
      factors.push({ name: "adjacency_transferability", weight: 0.3, value: adjacencyScore, isPositive: true });

      const learnabilityScore = await this.getLearnabilityScore(missingSkills);
      factors.push({ name: "skill_learnability", weight: 0.2, value: learnabilityScore, isPositive: true });

      if (params.industry) {
        const industryCertRequirement = await this.getCertificationRequirement(missingSkills, params.industry);
        factors.push({ name: "certification_barrier", weight: 0.15, value: 1 - industryCertRequirement, isPositive: true });
      }
    }

    return this.computeSimulation(factors, "skill_gap_risk");
  }

  async simulateAll(params: {
    employerId: number; candidateId?: number; jobId?: number;
    candidateSkills?: string[]; jobSkills?: string[];
    location?: string; industry?: string; experienceLevel?: string;
    salary?: number; nationality?: string; currentLocation?: string;
  }): Promise<Record<string, SimulationResult>> {
    const results: Record<string, SimulationResult> = {};

    const promises: [string, Promise<SimulationResult>][] = [
      ["hiring_success", this.simulateHiringSuccess(params)],
      ["interview_success", this.simulateInterviewSuccess({ employerId: params.employerId, candidateId: params.candidateId!, jobId: params.jobId })],
      ["retention", this.simulateRetention({ employerId: params.employerId, candidateId: params.candidateId!, location: params.location, industry: params.industry })],
    ];

    if (params.jobSkills && params.candidateSkills) {
      promises.push(["skill_gap_risk", this.simulateSkillGapRisk({ jobSkills: params.jobSkills, candidateSkills: params.candidateSkills, industry: params.industry })]);
    }

    if (params.candidateId) {
      promises.push(["offer_acceptance", this.simulateOfferAcceptance({ employerId: params.employerId, candidateId: params.candidateId, salary: params.salary, location: params.location })]);
      promises.push(["sponsorship_success", this.simulateSponsorshipSuccess({ employerId: params.employerId, candidateId: params.candidateId, nationality: params.nationality, currentLocation: params.currentLocation })]);
    }

    const settled = await Promise.allSettled(promises.map(([key, p]) => p.then(r => ({ key, r }))));
    for (const s of settled) {
      if (s.status === "fulfilled") results[s.value.key] = s.value.r;
    }

    await this.persistSimulationBatch(params.employerId, results, params.candidateId, params.jobId);
    return results;
  }

  private computeSimulation(factors: FactorWeight[], simulationType: string): SimulationResult {
    const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
    const normalizedFactors = factors.map(f => ({ ...f, weight: f.weight / totalWeight }));

    let weightedSum = 0;
    let confidenceSum = 0;

    const riskFactors: string[] = [];
    const positiveFactors: string[] = [];

    for (const f of normalizedFactors) {
      weightedSum += f.weight * f.value;
      confidenceSum += f.weight;
      if (f.value < 0.4 && !f.isPositive) riskFactors.push(f.name.replace(/_/g, " "));
      else if (f.value > 0.7 && f.isPositive) positiveFactors.push(f.name.replace(/_/g, " "));
    }

    const baseProbability = Math.max(0, Math.min(1, weightedSum));

    const monteCarloIterations = 1000;
    let sumProb = 0;
    let sumSqProb = 0;
    const samples: number[] = [];

    for (let i = 0; i < monteCarloIterations; i++) {
      const noise = (Math.random() * 2 - 1) * 0.1;
      const perturbedFactors = normalizedFactors.map(f => ({
        ...f,
        value: Math.max(0, Math.min(1, f.value + noise * (1 - f.weight))),
      }));
      const perturbedSum = perturbedFactors.reduce((s, f) => s + f.weight * f.value, 0);
      const prob = Math.max(0, Math.min(1, perturbedSum));
      sumProb += prob;
      sumSqProb += prob * prob;
      samples.push(prob);
    }

    const meanProb = sumProb / monteCarloIterations;
    const variance = sumSqProb / monteCarloIterations - meanProb * meanProb;
    const stdDev = Math.sqrt(Math.max(0, variance));

    const confidence = Math.max(0, Math.min(1, 0.3 + 0.7 * confidenceSum));
    const ciLower = Math.max(0, meanProb - 1.96 * stdDev);
    const ciUpper = Math.min(1, meanProb + 1.96 * stdDev);

    return {
      probability: Math.round(meanProb * 100) / 100,
      confidence: Math.round(confidence * 100) / 100,
      confidenceIntervalLower: Math.round(ciLower * 100) / 100,
      confidenceIntervalUpper: Math.round(ciUpper * 100) / 100,
      riskFactors,
      positiveFactors,
      simulationInputs: { factorCount: factors.length, totalWeight },
    };
  }

  private async persistSimulationBatch(
    employerId: number, results: Record<string, SimulationResult>,
    candidateId?: number, jobId?: number,
  ): Promise<void> {
    for (const [simType, result] of Object.entries(results)) {
      await db.insert(hiringSimulations).values({
        employerId,
        candidateId: candidateId ?? null,
        jobId: jobId ?? null,
        simulationType: simType,
        probability: result.probability,
        confidence: result.confidence,
        confidenceIntervalLower: result.confidenceIntervalLower,
        confidenceIntervalUpper: result.confidenceIntervalUpper,
        riskFactors: result.riskFactors,
        positiveFactors: result.positiveFactors,
        simulationInputs: result.simulationInputs as any,
      }).onConflictDoNothing();
    }
  }

  // ─── Helper methods ──────────────────────────────────────────

  private async getRecruiterPreferenceMatch(employerId: number, candidateId: number): Promise<number> {
    try {
      const result = await runCypher(
        `MATCH (e:Employer {id: $employerId})-[:PREFERS]->(pref)
         MATCH (c:Candidate {id: $candidateId})
         OPTIONAL MATCH (c)-[:HAS_SKILL]->(s:Skill) WHERE pref:Skill AND s.name = pref.name
         OPTIONAL MATCH (c)-[:LOCATED_IN]->(l:Location) WHERE pref:Location AND l.name = pref.name
         OPTIONAL MATCH (c)-[:BELONGS_TO]->(ind:Industry) WHERE pref:Industry AND ind.name = pref.name
         WITH count(DISTINCT pref) AS totalPrefs, 
              count(DISTINCT s) + count(DISTINCT l) + count(DISTINCT ind) AS matchedPrefs
         RETURN CASE WHEN totalPrefs > 0 THEN toFloat(matchedPrefs) / toFloat(totalPrefs) ELSE 0.5 END AS score`,
        { employerId, candidateId }
      );
      return (result[0]?.score as number) || 0.5;
    } catch { return 0.5; }
  }

  private async getPastSimilarityScore(employerId: number, candidateId: number): Promise<number> {
    try {
      const result = await runCypher(
        `MATCH (c:Candidate {id: $candidateId})-[:HAS_SKILL]->(skill:Skill)
         MATCH (e:Employer {id: $employerId})-[:HIRED_BY]->(hired:Candidate)-[:HAS_SKILL]->(skill)
         WITH count(DISTINCT skill) AS sharedSkills, count(DISTINCT hired) AS similarHires
         RETURN CASE WHEN similarHires > 0 THEN toFloat(sharedSkills) / (toFloat(similarHires) * 5.0) ELSE 0.3 END AS score`,
        { employerId, candidateId }
      );
      return (result[0]?.score as number) || 0.3;
    } catch { return 0.3; }
  }

  private async getSkillAdjacencyScore(skills: string[]): Promise<number> {
    if (!skills.length) return 0.5;
    try {
      let totalAdjacent = 0;
      for (const skill of skills.slice(0, 5)) {
        const result = await runCypher(
          `MATCH (s:Skill {name: $skill})<-[:HAS_SKILL]-(c)-[:HAS_SKILL]->(adj:Skill)
           WHERE adj.name <> $skill
           RETURN count(DISTINCT adj) AS adjCount`,
          { skill: skill.toLowerCase() }
        );
        totalAdjacent += (result[0]?.adjCount as number) || 0;
      }
      return Math.min(1, totalAdjacent / 20);
    } catch { return 0.5; }
  }

  private async getSkillAdjacencyScoreForMissing(candidateSkills: string[], missingSkills: string[]): Promise<number> {
    if (!candidateSkills.length || !missingSkills.length) return 0.5;
    try {
      const result = await runCypher(
        `MATCH (s:Skill) WHERE s.name IN $candidateSkills
         MATCH (s)<-[:HAS_SKILL]-(c:Candidate)
         MATCH (c)-[:HAS_SKILL]->(adj:Skill) WHERE adj.name IN $missingSkills
         RETURN count(DISTINCT c) > 0 AS hasTransition`,
        { candidateSkills: candidateSkills.map(s => s.toLowerCase()), missingSkills: missingSkills.map(s => s.toLowerCase()) }
      );
      return result[0]?.hasTransition ? 0.7 : 0.3;
    } catch { return 0.5; }
  }

  private async getMigrationStability(location: string): Promise<number> {
    try {
      const result = await runCypher(
        `MATCH (c:Candidate)-[:LOCATED_IN]->(:Location {name: $location})
         OPTIONAL MATCH (c)-[:INTERESTED_IN]->(reloc:IntentSignal {type: "relocation_intent"})
         WITH count(DISTINCT c) AS total, count(DISTINCT reloc) AS relocCount
         RETURN CASE WHEN total > 0 THEN 1.0 - toFloat(relocCount) / toFloat(total) ELSE 0.8 END AS stability`,
        { location }
      );
      return (result[0]?.stability as number) || 0.8;
    } catch { return 0.8; }
  }

  private async getIndustryDemand(industry: string): Promise<number> {
    try {
      const result = await runCypher(
        `MATCH (ind:Industry {name: $industry})<-[:BELONGS_TO]-(c:Candidate)
         RETURN count(c) AS candidateCount`,
        { industry }
      );
      const count = (result[0]?.candidateCount as number) || 0;
      return Math.min(1, count / 20);
    } catch { return 0.5; }
  }

  private async getCandidateIntentScore(candidateId: number): Promise<number> {
    try {
      const result = await runCypher(
        `MATCH (c:Candidate {id: $candidateId})-[:INTERESTED_IN]->(intent:IntentSignal)
         RETURN count(intent) AS intentCount`,
        { candidateId }
      );
      const count = (result[0]?.intentCount as number) || 0;
      return Math.min(1, count * 0.25);
    } catch { return 0.5; }
  }

  private async getTenurePrediction(candidateId: number): Promise<number> {
    try {
      const rows = await db
        .select()
        .from(hiringMemory)
        .where(and(
          eq(hiringMemory.candidateId, candidateId),
          eq(hiringMemory.outcome, "hired"),
        ))
        .orderBy(desc(hiringMemory.createdAt))
        .limit(10);

      if (rows.length > 0) {
        let totalMonths = 0;
        for (const row of rows) {
          const created = new Date(row.createdAt);
          const months = (Date.now() - created.getTime()) / (30 * 24 * 60 * 60 * 1000);
          totalMonths += months;
        }
        const avgMonths = totalMonths / rows.length;
        return Math.min(1, avgMonths / 12);
      }
      return 0.5;
    } catch { return 0.5; }
  }

  private async getRelocationIntent(candidateId: number): Promise<number> {
    try {
      const result = await runCypher(
        `MATCH (c:Candidate {id: $candidateId})-[:INTERESTED_IN]->(int:IntentSignal {type: "relocation_intent"})
         RETURN count(int) > 0 AS hasIntent`,
        { candidateId }
      );
      return result[0]?.hasIntent ? 0.7 : 0.2;
    } catch { return 0.3; }
  }

  private async getCareerGrowthPotential(candidateId: number): Promise<number> {
    try {
      const result = await runCypher(
        `MATCH (c:Candidate {id: $candidateId})
         OPTIONAL MATCH (c)-[:HAS_SKILL]->(s:Skill)
         OPTIONAL MATCH (c)-[:MATCHES]->(r:JobRole)
         OPTIONAL MATCH (c)-[:STUDIED_AT]->(u:University)
         RETURN count(DISTINCT s) AS skills, count(DISTINCT r) AS roles,
                CASE WHEN u IS NOT NULL THEN 1 ELSE 0 END AS hasEducation`,
        { candidateId }
      );
      const r = result[0] as any;
      const skills = (r?.skills as number) || 0;
      return Math.min(1, (skills / 15 + (r?.hasEducation ? 0.3 : 0) + (r?.roles ? 0.2 : 0)) / 1.5);
    } catch { return 0.5; }
  }

  private async getIndustryStability(industry: string): Promise<number> {
    try {
      const result = await runCypher(
        `MATCH (ind:Industry {name: $industry})<-[:BELONGS_TO]-(c:Candidate)
         OPTIONAL MATCH (c)-[:INTERESTED_IN]->(reloc:IntentSignal {type: "relocation_intent"})
         WITH ind, count(DISTINCT c) AS total, count(DISTINCT reloc) AS relocCount
         RETURN CASE WHEN total > 0 THEN 1.0 - toFloat(relocCount) / toFloat(total) ELSE 0.7 END AS stability`,
        { industry }
      );
      return (result[0]?.stability as number) || 0.7;
    } catch { return 0.7; }
  }

  private async getChurnSignals(candidateId: number): Promise<number> {
    try {
      const result = await runCypher(
        `MATCH (c:Candidate {id: $candidateId})
         OPTIONAL MATCH (c)-[:INTERESTED_IN]->(int:IntentSignal)
         WHERE int.type IN ["career_change", "immediate_availability"]
         RETURN count(int) AS churnSignalCount`,
        { candidateId }
      );
      const count = (result[0]?.churnSignalCount as number) || 0;
      return Math.min(1, count * 0.3);
    } catch { return 0.2; }
  }

  private async getSkillConfidence(candidateId: number): Promise<number> {
    try {
      const result = await runCypher(
        `MATCH (c:Candidate {id: $candidateId})-[:HAS_SKILL]->(s:Skill)
         RETURN count(s) AS skillCount`,
        { candidateId }
      );
      const count = (result[0]?.skillCount as number) || 0;
      return Math.min(1, count / 10);
    } catch { return 0.5; }
  }

  private async getExperienceLevel(candidateId: number): Promise<number> {
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

  private async getCommunicationScore(candidateId: number): Promise<number> {
    try {
      const result = await runCypher(
        `MATCH (c:Candidate {id: $candidateId})
         RETURN c.fullName AS name, c.headline AS headline`,
        { candidateId }
      );
      const headline = (result[0]?.headline as string) || "";
      return headline.length > 20 ? 0.7 : 0.4;
    } catch { return 0.5; }
  }

  private async getPreparationSignals(candidateId: number): Promise<number> {
    try {
      const result = await runCypher(
        `MATCH (c:Candidate {id: $candidateId})
         OPTIONAL MATCH (c)-[:CERTIFIED_IN]->(cert:Certification)
         RETURN count(cert) AS certCount`,
        { candidateId }
      );
      return Math.min(1, ((result[0]?.certCount as number) || 0) * 0.2);
    } catch { return 0.5; }
  }

  private async getInterestLevel(candidateId: number): Promise<number> {
    try {
      const result = await runCypher(
        `MATCH (c:Candidate {id: $candidateId})-[:INTERESTED_IN]->(int:IntentSignal)
         WHERE int.type IN ["employment_intent", "immediate_availability"]
         RETURN count(int) AS interestCount`,
        { candidateId }
      );
      return Math.min(1, ((result[0]?.interestCount as number) || 0) * 0.3);
    } catch { return 0.5; }
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

  private async getMarketDemandForCandidate(candidateId: number): Promise<number> {
    try {
      const result = await runCypher(
        `MATCH (c:Candidate {id: $candidateId})-[:HAS_SKILL]->(s:Skill)
         MATCH (other:Candidate)-[:HAS_SKILL]->(s)
         RETURN count(DISTINCT other) AS competition`,
        { candidateId }
      );
      const competition = (result[0]?.competition as number) || 0;
      return Math.min(1, competition / 50);
    } catch { return 0.5; }
  }

  private async getIntentStrength(candidateId: number): Promise<number> {
    try {
      const result = await runCypher(
        `MATCH (c:Candidate {id: $candidateId})-[:INTERESTED_IN]->(int:IntentSignal)
         RETURN count(int) AS signalCount`,
        { candidateId }
      );
      return Math.min(1, ((result[0]?.signalCount as number) || 0) * 0.25);
    } catch { return 0.3; }
  }

  private async getLocationFit(candidateId: number, location: string): Promise<number> {
    try {
      const result = await runCypher(
        `MATCH (c:Candidate {id: $candidateId})
         RETURN c.location AS currentLocation`,
        { candidateId }
      );
      const current = (result[0]?.currentLocation as string) || "";
      return current.toLowerCase() === location.toLowerCase() ? 0.9 : 0.4;
    } catch { return 0.5; }
  }

  private async getCompetitorOfferLikelihood(candidateId: number): Promise<number> {
    const marketDemand = await this.getMarketDemandForCandidate(candidateId);
    const intent = await this.getIntentStrength(candidateId);
    return Math.min(1, marketDemand * 0.6 + (1 - intent) * 0.4);
  }

  private async getVisaReadiness(candidateId: number): Promise<number> {
    try {
      const result = await runCypher(
        `MATCH (c:Candidate {id: $candidateId})
         RETURN c.visaStatus AS visaStatus, c.nationality AS nationality`,
        { candidateId }
      );
      const r = result[0] as any;
      const visaStatus = (r?.visaStatus as string) || "";
      if (visaStatus.toLowerCase().includes("ready") || visaStatus.toLowerCase().includes("sponsored")) return 0.8;
      return 0.4;
    } catch { return 0.5; }
  }

  private async getRelocationHistory(candidateId: number): Promise<number> {
    try {
      const result = await runCypher(
        `MATCH (c:Candidate {id: $candidateId})
         RETURN c.previousEmployers IS NOT NULL AS hasHistory`,
        { candidateId }
      );
      return result[0]?.hasHistory ? 0.6 : 0.3;
    } catch { return 0.4; }
  }

  private getGccProximityScore(location: string): number {
    const gccCountries = ["qatar", "uae", "saudi arabia", "kuwait", "bahrain", "oman"];
    const gccNearby = ["egypt", "jordan", "lebanon", "india", "pakistan", "bangladesh", "sri lanka", "philippines"];
    const loc = location.toLowerCase();
    if (gccCountries.some(c => loc.includes(c))) return 0.9;
    if (gccNearby.some(c => loc.includes(c))) return 0.6;
    return 0.3;
  }

  private async getFamilyStatus(candidateId: number): Promise<number> {
    return 0.5;
  }

  private async getSponsorshipIntent(candidateId: number): Promise<number> {
    try {
      const result = await runCypher(
        `MATCH (c:Candidate {id: $candidateId})-[:INTERESTED_IN]->(int:IntentSignal {type: "sponsorship_seeking"})
         RETURN count(int) > 0 AS seeking`,
        { candidateId }
      );
      return result[0]?.seeking ? 0.8 : 0.3;
    } catch { return 0.5; }
  }

  private async getLearnabilityScore(skills: string[]): Promise<number> {
    try {
      const result = await runCypher(
        `MATCH (s:Skill) WHERE s.name IN $skills
         OPTIONAL MATCH (s)<-[:HAS_SKILL]-(c:Candidate)
         RETURN avg(size(c.skills)) AS avgAdjacentSkills`,
        { skills: skills.map(s => s.toLowerCase()) }
      );
      const avg = (result[0]?.avgAdjacentSkills as number) || 0;
      return Math.min(1, avg / 20);
    } catch { return 0.5; }
  }

  private async getCertificationRequirement(skills: string[], industry: string): Promise<number> {
    try {
      const result = await runCypher(
        `MATCH (ind:Industry {name: $industry})<-[:BELONGS_TO]-(c:Candidate)
         MATCH (c)-[:CERTIFIED_IN]->(cert:Certification)
         RETURN count(DISTINCT cert) > 0 AS hasCerts`,
        { industry }
      );
      return result[0]?.hasCerts ? 0.4 : 0.6;
    } catch { return 0.5; }
  }
}

export const simulationEngine = new SimulationEngine();
