import { db, upskillingRecommendations, skillTrends, laborMetrics, discoveredCandidates } from "@workspace/db";
import { eq, and, gte, lte, desc, sql, count, avg } from "drizzle-orm";
import { logger } from "../../lib/logger";
import { runCypher } from "../../lib/neo4j";

export interface UpskillingPathway {
  currentSkill: string;
  targetSkill: string;
  skillGap: number;
  estimatedTimeMonths: number;
  confidence: number;
  demandProjection: number;
  salaryPremium: number;
  certifications: string[];
  learningPathways: string[];
  relevanceScore: number;
}

class UpskillingEngine {
  async findAdjacentUpskillingPathways(skillName: string): Promise<UpskillingPathway[]> {
    try {
      const adjacencies = await runCypher(
        `MATCH (s:Skill {name: $skill})-[:ADJACENT_TO]->(adj:Skill)
         OPTIONAL MATCH (adj)<-[:HAS_SKILL]-(c:Candidate)
         WITH adj, count(DISTINCT c) AS candidateCount
         RETURN adj.name AS targetSkill, candidateCount
         ORDER BY candidateCount DESC LIMIT 15`,
        { skill: skillName.toLowerCase() },
      );

      const pathways: UpskillingPathway[] = [];
      for (const row of adjacencies) {
        const targetSkill = row.targetSkill as string;
        if (!targetSkill) continue;

        const forecast = await this.getSkillForecast(targetSkill);
        const gapScore = 0.3 + Math.random() * 0.4;
        const estimatedMonths = Math.round(2 + gapScore * 6);

        pathways.push({
          currentSkill: skillName,
          targetSkill,
          skillGap: Math.round(gapScore * 100) / 100,
          estimatedTimeMonths: estimatedMonths,
          confidence: Math.round((0.6 + Math.random() * 0.3) * 100) / 100,
          demandProjection: forecast.demandProjection,
          salaryPremium: forecast.salaryPremium,
          certifications: this.suggestCertifications(targetSkill),
          learningPathways: this.suggestLearningPathways(skillName, targetSkill),
          relevanceScore: Math.round((0.5 + Math.random() * 0.4) * 100) / 100,
        });
      }

      return pathways.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 8);
    } catch (err) {
      logger.error({ err, skill: skillName }, "Failed to find upskilling pathways");
      return [];
    }
  }

  async generateRecommendations(candidateId: number): Promise<UpskillingPathway[]> {
    try {
      const skills = await runCypher(
        `MATCH (c:Candidate {id: $candidateId})-[:HAS_SKILL]->(s:Skill)
         RETURN s.name AS skill`,
        { candidateId },
      );

      const candidateSkills = skills.map((r: any) => r.skill as string).filter(Boolean);
      if (candidateSkills.length === 0) return [];

      const allPathways: UpskillingPathway[] = [];
      for (const skill of candidateSkills.slice(0, 5)) {
        const pathways = await this.findAdjacentUpskillingPathways(skill);
        allPathways.push(...pathways);
      }

      const seen = new Set<string>();
      const unique: UpskillingPathway[] = [];
      for (const p of allPathways.sort((a, b) => b.relevanceScore - a.relevanceScore)) {
        const key = `${p.currentSkill}->${p.targetSkill}`;
        if (!seen.has(key)) {
          seen.add(key);
          unique.push(p);
        }
      }

      for (const p of unique.slice(0, 5)) {
        await this.persistRecommendation(candidateId, p);
      }

      return unique.slice(0, 5);
    } catch (err) {
      logger.error({ err, candidateId }, "Failed to generate upskilling recommendations");
      return [];
    }
  }

  async recommendCertifications(skillName: string): Promise<Array<{ certification: string; provider: string; estimatedCost: number; durationMonths: number; demandImpact: number }>> {
    const certMap: Record<string, Array<{ certification: string; provider: string; estimatedCost: number; durationMonths: number }>> = {
      "telecom": [
        { certification: "5G Network Engineering", provider: "Coursera/Qualcomm", estimatedCost: 500, durationMonths: 4 },
        { certification: "Fiber Optic Installation", provider: "Fiber Optic Association", estimatedCost: 300, durationMonths: 2 },
        { certification: "RF Engineering", provider: "IEEE", estimatedCost: 800, durationMonths: 6 },
      ],
      "networking": [
        { certification: "CCNA", provider: "Cisco", estimatedCost: 400, durationMonths: 3 },
        { certification: "Network Security", provider: "CompTIA", estimatedCost: 350, durationMonths: 3 },
        { certification: "AWS Advanced Networking", provider: "Amazon", estimatedCost: 500, durationMonths: 4 },
      ],
      "software": [
        { certification: "AWS Developer", provider: "Amazon", estimatedCost: 300, durationMonths: 3 },
        { certification: "Full Stack Development", provider: "Meta/Coursera", estimatedCost: 400, durationMonths: 5 },
        { certification: "Cloud Architecture", provider: "Google Cloud", estimatedCost: 450, durationMonths: 4 },
      ],
    };

    const normalized = skillName.toLowerCase();
    for (const [key, certs] of Object.entries(certMap)) {
      if (normalized.includes(key)) {
        const demandImpact = await this.getCertificationDemandImpact(skillName);
        return certs.map(c => ({ ...c, demandImpact }));
      }
    }

    return [
      { certification: `${skillName} Professional Certificate`, provider: "LinkedIn Learning", estimatedCost: 200, durationMonths: 3, demandImpact: Math.round((0.3 + Math.random() * 0.4) * 100) / 100 },
    ];
  }

  async getRecommendations(candidateId?: number, limit = 20): Promise<Array<Record<string, unknown>>> {
    const conditions = candidateId ? [eq(upskillingRecommendations.candidateId, candidateId)] : [];
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const query = where
      ? db.select().from(upskillingRecommendations).where(where).orderBy(desc(upskillingRecommendations.createdAt)).limit(limit)
      : db.select().from(upskillingRecommendations).orderBy(desc(upskillingRecommendations.createdAt)).limit(limit);
    return query;
  }

  private async getSkillForecast(skillName: string): Promise<{ demandProjection: number; salaryPremium: number }> {
    const trends = await db
      .select()
      .from(skillTrends)
      .where(
        and(
          eq(skillTrends.skillName, skillName),
          gte(skillTrends.createdAt, new Date(Date.now() - 90 * 86400000)),
        ),
      )
      .orderBy(desc(skillTrends.createdAt))
      .limit(5);

    const demandScore = trends[0]?.demandScore || 0.5;
    const growthRate = trends[0]?.growthRate || 0;
    const salaryPremium = trends[0]?.salaryPremium || 0;

    return {
      demandProjection: Math.round(Math.min(1, demandScore * (1 + growthRate)) * 100) / 100,
      salaryPremium: Math.round(salaryPremium * 100) / 100,
    };
  }

  private async getCertificationDemandImpact(skillName: string): Promise<number> {
    const supply = await db
      .select({ count: count() })
      .from(discoveredCandidates)
      .where(
        and(
          sql`${discoveredCandidates.skills} ? ${skillName}`,
          gte(discoveredCandidates.createdAt, new Date(Date.now() - 180 * 86400000)),
        ),
      )
      .then(r => r[0]?.count || 0);

    return Math.round(Math.min(1, 0.5 + supply * 0.01) * 100) / 100;
  }

  private suggestCertifications(targetSkill: string): string[] {
    const certs: Record<string, string[]> = {
      "network": ["CCNA", "Network+", "JNCIA"],
      "security": ["CISSP", "Security+", "CEH"],
      "cloud": ["AWS Solutions Architect", "Azure Administrator", "GCP Engineer"],
      "data": ["AWS Data Analytics", "Google Data Engineer", "Azure Data Scientist"],
      "ai": ["TensorFlow Developer", "AWS ML Specialty", "Azure AI Engineer"],
      "telecom": ["5G NR Certification", "RF Engineering", "Fiber Optic Technician"],
    };

    const normalized = targetSkill.toLowerCase();
    for (const [key, list] of Object.entries(certs)) {
      if (normalized.includes(key)) return list;
    }
    return [`${targetSkill} Foundation`, `${targetSkill} Advanced`];
  }

  private suggestLearningPathways(current: string, target: string): string[] {
    return [
      `Master ${current} fundamentals`,
      `Build ${target} foundational knowledge`,
      `Complete ${target} certification program`,
      `Apply ${target} in practical projects`,
      `Combine ${current} + ${target} for hybrid roles`,
    ];
  }

  private async persistRecommendation(candidateId: number, pathway: UpskillingPathway): Promise<void> {
    try {
      const existing = await db
        .select({ id: upskillingRecommendations.id })
        .from(upskillingRecommendations)
        .where(
          and(
            eq(upskillingRecommendations.candidateId, candidateId),
            eq(upskillingRecommendations.targetSkill, pathway.targetSkill),
          ),
        )
        .limit(1);

      if (existing.length === 0) {
        await db.insert(upskillingRecommendations).values({
          candidateId,
          currentSkill: pathway.currentSkill,
          targetSkill: pathway.targetSkill,
          recommendationType: "upskill",
          title: `Upskill from ${pathway.currentSkill} to ${pathway.targetSkill}`,
          description: `Develop ${pathway.targetSkill} skills with estimated ${pathway.estimatedTimeMonths} months of focused learning`,
          skillGap: pathway.skillGap,
          estimatedTimeMonths: pathway.estimatedTimeMonths,
          confidence: pathway.confidence,
          demandProjection: pathway.demandProjection,
          salaryPremium: pathway.salaryPremium,
          certifications: pathway.certifications,
          learningPathways: pathway.learningPathways,
          metadata: { relevanceScore: pathway.relevanceScore },
        });
      }
    } catch (err) {
      logger.error({ err, candidateId, targetSkill: pathway.targetSkill }, "Failed to persist upskilling recommendation");
    }
  }
}

export const upskillingEngine = new UpskillingEngine();
