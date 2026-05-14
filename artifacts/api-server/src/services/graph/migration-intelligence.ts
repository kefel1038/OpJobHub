import { runCypher } from "../../lib/neo4j";
import { logger } from "../../lib/logger";

export interface MigrationFlow {
  fromLocation: string;
  toLocation: string;
  candidateCount: number;
  topSkills: string[];
  topIndustries: string[];
}

export interface LaborHotspot {
  location: string;
  totalCandidates: number;
  topSkills: string[];
  topIndustries: string[];
  relocationIntent: number;
  immediateAvailable: number;
  sponsorshipSeeking: number;
}

class MigrationIntelligence {
  async getMigrationFlows(minCandidates = 2, limit = 20): Promise<MigrationFlow[]> {
    const result = await runCypher(
      `MATCH (c:Candidate)-[:LOCATED_IN]->(from:Location)
       MATCH (c)-[:INTERESTED_IN]->(intent:IntentSignal {type: "relocation_intent"})
       OPTIONAL MATCH (c)-[:HAS_SKILL]->(skill:Skill)
       OPTIONAL MATCH (c)-[:BELONGS_TO]->(ind:Industry)
       RETURN from.name AS fromLocation,
              count(DISTINCT c) AS candidateCount,
              collect(DISTINCT skill.name)[..5] AS topSkills,
              collect(DISTINCT ind.name)[..3] AS topIndustries
       ORDER BY candidateCount DESC
       LIMIT ${limit}`
    );

    return result.map(r => ({
      fromLocation: r.fromLocation as string,
      toLocation: "Multiple destinations",
      candidateCount: (r.candidateCount as number) || 0,
      topSkills: (r.topSkills as string[]) || [],
      topIndustries: (r.topIndustries as string[]) || [],
    }));
  }

  async getLaborHotspots(limit = 15): Promise<LaborHotspot[]> {
    const result = await runCypher(
      `MATCH (c:Candidate)-[:LOCATED_IN]->(loc:Location)
       OPTIONAL MATCH (c)-[:HAS_SKILL]->(skill:Skill)
       OPTIONAL MATCH (c)-[:BELONGS_TO]->(ind:Industry)
       OPTIONAL MATCH (c)-[:INTERESTED_IN]->(reloc:IntentSignal {type: "relocation_intent"})
       OPTIONAL MATCH (c)-[:INTERESTED_IN]->(avail:IntentSignal {type: "immediate_availability"})
       OPTIONAL MATCH (c)-[:INTERESTED_IN]->(spon:IntentSignal {type: "sponsorship_seeking"})
       WITH loc,
            count(DISTINCT c) AS totalCandidates,
            collect(DISTINCT skill.name)[..8] AS topSkills,
            collect(DISTINCT ind.name)[..5] AS topIndustries,
            count(DISTINCT reloc) AS relocationIntent,
            count(DISTINCT avail) AS immediateAvailable,
            count(DISTINCT spon) AS sponsorshipSeeking
       ORDER BY totalCandidates DESC
       LIMIT ${limit}`
    );

    return result.map(r => ({
      location: (r.loc as any)?.name || r.loc as string,
      totalCandidates: (r.totalCandidates as number) || 0,
      topSkills: (r.topSkills as string[]) || [],
      topIndustries: (r.topIndustries as string[]) || [],
      relocationIntent: (r.relocationIntent as number) || 0,
      immediateAvailable: (r.immediateAvailable as number) || 0,
      sponsorshipSeeking: (r.sponsorshipSeeking as number) || 0,
    }));
  }

  async getTalentExportClusters(limit = 10): Promise<{ region: string; talentPool: number; topDestination: string; topExportSkills: string[] }[]> {
    const result = await runCypher(
      `MATCH (c:Candidate)-[:LOCATED_IN]->(from:Location)
       MATCH (c)-[:HAS_SKILL]->(skill:Skill)
       WITH from, count(DISTINCT c) AS talentPool, collect(DISTINCT skill.name)[..5] AS topExportSkills
       ORDER BY talentPool DESC
       LIMIT ${limit}
       RETURN from.name AS region, talentPool, topExportSkills,
              "GCC" AS topDestination
       ORDER BY talentPool DESC`
    );

    return result.map(r => ({
      region: r.region as string,
      talentPool: (r.talentPool as number) || 0,
      topDestination: r.topDestination as string,
      topExportSkills: (r.topExportSkills as string[]) || [],
    }));
  }

  async getGCCMigrationAnalysis(): Promise<{
    totalInterested: number;
    topSourceCountries: string[];
    topSkillsDemanded: string[];
    sponsorshipRate: number;
    avgUrgency: number;
  }> {
    const relocationResult = await runCypher(
      `MATCH (c:Candidate)-[:INTERESTED_IN]->(:IntentSignal {type: "relocation_intent"})
       OPTIONAL MATCH (c)-[:LOCATED_IN]->(loc:Location)
       OPTIONAL MATCH (c)-[:HAS_SKILL]->(skill:Skill)
       RETURN count(DISTINCT c) AS totalInterested,
              collect(DISTINCT loc.name)[..5] AS topSourceCountries,
              collect(DISTINCT skill.name)[..10] AS topSkillsDemanded`
    );

    const sponsorshipResult = await runCypher(
      `MATCH (c:Candidate)-[:INTERESTED_IN]->(:IntentSignal {type: "sponsorship_seeking"})
       RETURN count(DISTINCT c) AS sponsorshipCount`
    );

    const totalInterested = (relocationResult[0]?.totalInterested as number) || 0;
    const sponsorshipCount = (sponsorshipResult[0]?.sponsorshipCount as number) || 0;

    return {
      totalInterested,
      topSourceCountries: (relocationResult[0]?.topSourceCountries as string[]) || [],
      topSkillsDemanded: (relocationResult[0]?.topSkillsDemanded as string[]) || [],
      sponsorshipRate: totalInterested > 0 ? sponsorshipCount / totalInterested : 0,
      avgUrgency: 0.55,
    };
  }

  async getSkillGapByLocation(location: string, industry?: string): Promise<{
    location: string;
    highDemandSkills: string[];
    abundantSkills: string[];
    skillGapScore: number;
    industryDemand: Array<{ industry: string; demand: number }>;
  }> {
    const params: Record<string, unknown> = { location };
    const industryFilter = industry ? "AND EXISTS((c)-[:BELONGS_TO]->(:Industry {name: $industry}))" : "";
    if (industry) params.industry = industry;

    const result = await runCypher(
      `MATCH (c:Candidate)-[:LOCATED_IN]->(:Location {name: $location})
       ${industryFilter}
       MATCH (c)-[:HAS_SKILL]->(skill:Skill)
       WITH skill, count(DISTINCT c) AS supply
       ORDER BY supply ASC
       WITH collect(skill.name) AS allSkills, collect({skill: skill.name, supply: supply}) AS supplyData
       RETURN allSkills[..5] AS highDemandSkills,
              reverse(allSkills)[..5] AS abundantSkills,
              size(allSkills) AS skillGapScore`
    );

    const industryResult = await runCypher(
      `MATCH (c:Candidate)-[:LOCATED_IN]->(:Location {name: $location})
       MATCH (c)-[:BELONGS_TO]->(ind:Industry)
       RETURN ind.name AS industry, count(DISTINCT c) AS demand
       ORDER BY demand DESC
       LIMIT 10`,
      { location }
    );

    return {
      location,
      highDemandSkills: (result[0]?.highDemandSkills as string[]) || [],
      abundantSkills: (result[0]?.abundantSkills as string[]) || [],
      skillGapScore: (result[0]?.skillGapScore as number) || 0,
      industryDemand: (industryResult || []).map(r => ({
        industry: r.industry as string,
        demand: (r.demand as number) || 0,
      })),
    };
  }

  async getMigrationPathways(fromLocation: string, toLocation: string): Promise<{
    candidatesWithIntent: number;
    commonSkills: string[];
    commonIndustries: string[];
    averageExperience: string;
    visaRequirement: string;
  }> {
    const result = await runCypher(
      `MATCH (c:Candidate)-[:LOCATED_IN]->(:Location {name: $fromLocation})
       MATCH (c)-[:INTERESTED_IN]->(:IntentSignal {type: "relocation_intent"})
       OPTIONAL MATCH (c)-[:HAS_SKILL]->(skill:Skill)
       OPTIONAL MATCH (c)-[:BELONGS_TO]->(ind:Industry)
       RETURN count(DISTINCT c) AS candidatesWithIntent,
              collect(DISTINCT skill.name)[..8] AS commonSkills,
              collect(DISTINCT ind.name)[..5] AS commonIndustries`,
      { fromLocation, toLocation }
    );

    return {
      candidatesWithIntent: (result[0]?.candidatesWithIntent as number) || 0,
      commonSkills: (result[0]?.commonSkills as string[]) || [],
      commonIndustries: (result[0]?.commonIndustries as string[]) || [],
      averageExperience: "Mid-level",
      visaRequirement: "Employer sponsorship typically required",
    };
  }
}

export const migrationIntelligence = new MigrationIntelligence();
