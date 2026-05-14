import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { logger } from "../../lib/logger";
import { signalCollector } from "./behavioral-signals";

export interface ReasoningFactor {
  factor: string;
  weight: number;
  source: "inferred_preference" | "semantic_match" | "behavioral_learning" | "skill_match" | "experience_match" | "location_match" | "certification_match" | "recruiter_history" | "ai_scoring" | "confidence_gate";
  detail?: string;
}

export interface DecisionArtifact {
  decisionType: string;
  agentType: string;
  targetId?: number;
  targetType?: string;
  score?: number;
  confidence: number;
  reasoning: ReasoningFactor[];
  inputContext?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export class ReasoningEngine {
  async recordDecision(employerId: number, artifact: DecisionArtifact): Promise<number | null> {
    try {
      const result = await db.execute(sql`
        INSERT INTO agent_reasoning_logs (employer_id, agent_type, decision_type, target_id, target_type, score, confidence, reasoning, input_context, metadata)
        VALUES (${employerId}, ${artifact.agentType}, ${artifact.decisionType},
                ${artifact.targetId ?? null}, ${artifact.targetType ?? null},
                ${artifact.score ?? null}, ${artifact.confidence},
                ${JSON.stringify(artifact.reasoning)}::jsonb,
                ${JSON.stringify(artifact.inputContext || {})}::jsonb,
                ${JSON.stringify(artifact.metadata || {})}::jsonb)
        RETURNING id
      `);
      return Number((result.rows?.[0] as any)?.id || 0);
    } catch (err) {
      logger.error({ err, employerId, decisionType: artifact.decisionType }, "Failed to record decision reasoning");
      return null;
    }
  }

  async getDecisionLog(employerId: number, limit = 50, offset = 0): Promise<any[]> {
    try {
      const rows = await db.execute(sql`
        SELECT id, agent_type, decision_type, target_id, target_type, score, confidence, reasoning, metadata, created_at
        FROM agent_reasoning_logs
        WHERE employer_id = ${employerId}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `);
      return rows.rows || [];
    } catch {
      return [];
    }
  }

  async getDecisionById(decisionId: number): Promise<any | null> {
    try {
      const rows = await db.execute(sql`
        SELECT * FROM agent_reasoning_logs WHERE id = ${decisionId}
      `);
      return rows.rows?.[0] || null;
    } catch {
      return null;
    }
  }

  async getDecisionsForTarget(employerId: number, targetId: number, targetType: string): Promise<any[]> {
    try {
      const rows = await db.execute(sql`
        SELECT id, agent_type, decision_type, score, confidence, reasoning, created_at
        FROM agent_reasoning_logs
        WHERE employer_id = ${employerId} AND target_id = ${targetId} AND target_type = ${targetType}
        ORDER BY created_at DESC
      `);
      return rows.rows || [];
    } catch {
      return [];
    }
  }

  async explainRanking(employerId: number, candidateId: number, jobId: number): Promise<any | null> {
    try {
      const rows = await db.execute(sql`
        SELECT reasoning, score, confidence, created_at
        FROM agent_reasoning_logs
        WHERE employer_id = ${employerId}
          AND decision_type = 'candidate_ranking'
          AND target_id = ${candidateId}
          AND target_type = 'candidate'
          AND (input_context->>'jobId')::int = ${jobId}
        ORDER BY created_at DESC
        LIMIT 1
      `);
      return rows.rows?.[0] || null;
    } catch {
      return null;
    }
  }

  generateRankingReasoning(factors: {
    skillMatch: number; experienceMatch: number; locationMatch: number;
    certificationMatch: number; recruiterPreferenceBoost: number;
    semanticScore: number; confidenceGateScore: number;
  }): ReasoningFactor[] {
    const factors_arr: ReasoningFactor[] = [];
    if (factors.skillMatch > 0) factors_arr.push({ factor: "Skill alignment", weight: factors.skillMatch, source: "skill_match" });
    if (factors.experienceMatch > 0) factors_arr.push({ factor: "Experience relevance", weight: factors.experienceMatch, source: "experience_match" });
    if (factors.locationMatch > 0) factors_arr.push({ factor: "Location fit", weight: factors.locationMatch, source: "location_match" });
    if (factors.certificationMatch > 0) factors_arr.push({ factor: "Certification alignment", weight: factors.certificationMatch, source: "certification_match" });
    if (factors.recruiterPreferenceBoost > 0) factors_arr.push({ factor: "Recruiter hiring history similarity", weight: factors.recruiterPreferenceBoost, source: "behavioral_learning" });
    if (factors.semanticScore > 0) factors_arr.push({ factor: "Semantic profile match", weight: factors.semanticScore, source: "semantic_match" });
    if (factors.confidenceGateScore > 0) factors_arr.push({ factor: "Confidence gate assessment", weight: factors.confidenceGateScore, source: "confidence_gate" });
    return factors_arr;
  }

  generateOutreachReasoning(stage: string, candidateName: string, jobTitle: string): ReasoningFactor[] {
    return [
      { factor: `Pipeline stage: ${stage}`, weight: 0.3, source: "ai_scoring", detail: `Candidate is in ${stage} stage for ${jobTitle}` },
      { factor: "Recruiter outreach preference", weight: 0.25, source: "behavioral_learning", detail: "Employer has historical outreach patterns for this stage" },
      { factor: "Candidate engagement likelihood", weight: 0.2, source: "ai_scoring", detail: `Score based on ${candidateName}'s profile completeness and activity` },
      { factor: "Timing optimization", weight: 0.15, source: "ai_scoring", detail: "Current stage duration suggests follow-up is appropriate" },
    ];
  }

  generateSourcingReasoning(matchedSkills: string[], preferenceSkills: string[], score: number): ReasoningFactor[] {
    const factors: ReasoningFactor[] = [];
    const commonSkills = matchedSkills.filter((s) => preferenceSkills.includes(s));
    const uniqueSkills = matchedSkills.filter((s) => !preferenceSkills.includes(s));
    if (commonSkills.length > 0) factors.push({ factor: `Preferred skill match: ${commonSkills.join(", ")}`, weight: 0.35, source: "behavioral_learning" });
    if (uniqueSkills.length > 0) factors.push({ factor: `Additional matching skills: ${uniqueSkills.join(", ")}`, weight: 0.25, source: "skill_match" });
    factors.push({ factor: `Overall sourcing score: ${score}/100`, weight: 0.2, source: "ai_scoring" });
    return factors;
  }
}

export const reasoningEngine = new ReasoningEngine();
