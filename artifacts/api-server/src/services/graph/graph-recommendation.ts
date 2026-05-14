import { runCypher } from "../../lib/neo4j";
import { logger } from "../../lib/logger";

export interface GraphMatchResult {
  candidateId: number | string;
  fullName: string;
  headline: string;
  location: string;
  matchedSkills: string[];
  matchScore: number;
  pathways: string[];
  graphDepth: number;
}

class GraphRecommendation {
  async recommendCandidatesForJob(jobTitle: string, requiredSkills: string[], location?: string, limit = 20): Promise<GraphMatchResult[]> {
    const params: Record<string, unknown> = { jobTitle, limit };
    const skillFilters = requiredSkills.map((_, i) => {
      params[`skill${i}`] = _.toLowerCase();
      return `EXISTS((c)-[:HAS_SKILL]->(:Skill {name: $skill${i}}))`;
    });

    const locationFilter = location ? "AND EXISTS((c)-[:LOCATED_IN]->(:Location {name: $location}))" : "";
    if (location) params.location = location;

    const result = await runCypher(
      `MATCH (c:Candidate)
       WHERE ${skillFilters.join(" AND ")} ${locationFilter}
       OPTIONAL MATCH (c)-[:MATCHES]->(role:JobRole {name: $jobTitle})
       OPTIONAL MATCH (c)-[:HAS_SKILL]->(skill:Skill)
       OPTIONAL MATCH (c)-[:LOCATED_IN]->(loc:Location)
       OPTIONAL MATCH (c)-[:WORKED_AT]->(emp:Employer)
       OPTIONAL MATCH (c)-[:INTERESTED_IN]->(intent:IntentSignal)
       WITH c,
            collect(DISTINCT skill.name) AS skills,
            collect(DISTINCT loc.name) AS locations,
            collect(DISTINCT emp.name) AS employers,
            collect(DISTINCT intent.type) AS intents,
            CASE WHEN role IS NOT NULL THEN 10 ELSE 0 END AS roleBonus
       RETURN properties(c) AS candidate,
              skills, locations, employers, intents,
              (size(skills) * 5 + roleBonus) AS matchScore
       ORDER BY matchScore DESC
       LIMIT $limit`,
      params
    );

    return result.map(r => ({
      candidateId: (r.candidate as any)?.id,
      fullName: (r.candidate as any)?.fullName,
      headline: (r.candidate as any)?.headline,
      location: (r.locations as string[])?.[0] || "",
      matchedSkills: (r.skills as string[]) || [],
      matchScore: (r.matchScore as number) || 0,
      pathways: (r.employers as string[]) || [],
      graphDepth: 0,
    }));
  }

  async hiddenTalentDiscovery(requiredSkills: string[], adjacentSkills: string[], limit = 15): Promise<GraphMatchResult[]> {
    const params: Record<string, unknown> = { limit };
    const hasAnyAdjacent = adjacentSkills.map((s, i) => {
      params[`adjSkill${i}`] = s.toLowerCase();
      return `EXISTS((c)-[:HAS_SKILL]->(:Skill {name: $adjSkill${i}}))`;
    });

    const missingAllRequired = requiredSkills.map((_, i) => {
      params[`reqSkill${i}`] = _.toLowerCase();
      return `NOT EXISTS((c)-[:HAS_SKILL]->(:Skill {name: $reqSkill${i}}))`;
    });

    const result = await runCypher(
      `MATCH (c:Candidate)
       WHERE ${hasAnyAdjacent.join(" OR ")}
         AND ${missingAllRequired.join(" AND ")}
       OPTIONAL MATCH (c)-[:HAS_SKILL]->(s:Skill)
       OPTIONAL MATCH (c)-[:MATCHES]->(role:JobRole)
       OPTIONAL MATCH (c)-[:LOCATED_IN]->(loc:Location)
       OPTIONAL MATCH (c)-[:WORKED_AT]->(emp:Employer)
       WITH c,
            collect(DISTINCT s.name) AS skills,
            collect(DISTINCT role.name) AS roles,
            collect(DISTINCT loc.name) AS locations,
            collect(DISTINCT emp.name) AS employers
       RETURN properties(c) AS candidate, skills, roles, locations, employers
       LIMIT $limit`,
      params
    );

    return result.map(r => ({
      candidateId: (r.candidate as any)?.id,
      fullName: (r.candidate as any)?.fullName,
      headline: (r.candidate as any)?.headline,
      location: (r.locations as string[])?.[0] || "",
      matchedSkills: (r.skills as string[]) || [],
      matchScore: 0,
      pathways: (r.employers as string[]) || [],
      graphDepth: 0,
    }));
  }

  async recruiterPreferenceCandidates(employerId: number, limit = 20): Promise<any[]> {
    return runCypher(
      `MATCH (e:Employer {id: $employerId})
       MATCH (e)-[:PREFERS]->(pref)
       OPTIONAL MATCH (c:Candidate)
       WHERE
         (pref:Skill AND EXISTS((c)-[:HAS_SKILL]->(pref))) OR
         (pref:Location AND EXISTS((c)-[:LOCATED_IN]->(pref))) OR
         (pref:Industry AND EXISTS((c)-[:BELONGS_TO]->(pref))) OR
         (pref:Certification AND EXISTS((c)-[:CERTIFIED_IN]->(pref)))
       OPTIONAL MATCH (c)-[:HAS_SKILL]->(s:Skill)
       OPTIONAL MATCH (c)-[:LOCATED_IN]->(loc:Location)
       OPTIONAL MATCH (c)-[:WORKED_AT]->(emp:Employer)
       OPTIONAL MATCH (c)-[:INTERESTED_IN]->(intent:IntentSignal)
       WITH c, pref,
            collect(DISTINCT s.name) AS skills,
            collect(DISTINCT loc.name) AS locations,
            collect(DISTINCT emp.name) AS employers,
            collect(DISTINCT intent.type) AS intents
       WHERE c IS NOT NULL
       RETURN properties(c) AS candidate, labels(pref)[0] AS prefType,
              pref.name AS prefValue, skills, locations, employers, intents
       LIMIT $limit`,
      { employerId }
    );
  }

  async similarHires(candidateId: number | string, limit = 10): Promise<any[]> {
    return runCypher(
      `MATCH (c:Candidate {id: $candidateId})
       MATCH (c)-[:HAS_SKILL]->(skill:Skill)
       MATCH (other:Candidate)-[:HAS_SKILL]->(skill)
       WHERE other <> c
       WITH other, count(DISTINCT skill) AS sharedSkills
       ORDER BY sharedSkills DESC
       LIMIT $limit
       OPTIONAL MATCH (other)-[:HAS_SKILL]->(allSkills:Skill)
       OPTIONAL MATCH (other)-[:LOCATED_IN]->(loc:Location)
       OPTIONAL MATCH (other)-[:WORKED_AT]->(emp:Employer)
       RETURN properties(other) AS candidate,
              collect(DISTINCT allSkills.name) AS skills,
              collect(DISTINCT loc.name) AS locations,
              collect(DISTINCT emp.name) AS employers,
              sharedSkills`,
      { candidateId, limit }
    );
  }

  async multiHopTalentQuery(params: {
    skills?: string[];
    location?: string;
    industry?: string;
    certification?: string;
    currentEmployer?: string;
    intentType?: string;
    minSkills?: number;
    limit?: number;
  }): Promise<any[]> {
    const conditions: string[] = [];
    const cypherParams: Record<string, unknown> = {};

    if (params.skills?.length) {
      params.skills.forEach((s, i) => {
        cypherParams[`skill${i}`] = s.toLowerCase();
      });
    }

    if (params.location) cypherParams.location = params.location;
    if (params.industry) cypherParams.industry = params.industry;
    if (params.certification) cypherParams.certification = params.certification;
    if (params.currentEmployer) cypherParams.employer = params.currentEmployer;
    if (params.intentType) cypherParams.intent = params.intentType;
    cypherParams.limit = params.limit || 20;

    return runCypher(
      `MATCH (c:Candidate)
       OPTIONAL MATCH (c)-[:HAS_SKILL]->(skill:Skill)
       OPTIONAL MATCH (c)-[:LOCATED_IN]->(loc:Location)
       OPTIONAL MATCH (c)-[:BELONGS_TO]->(ind:Industry)
       OPTIONAL MATCH (c)-[:CERTIFIED_IN]->(cert:Certification)
       OPTIONAL MATCH (c)-[:WORKED_AT]->(emp:Employer)
       OPTIONAL MATCH (c)-[:INTERESTED_IN]->(intent:IntentSignal)
       WITH c,
            collect(DISTINCT skill.name) AS skills,
            collect(DISTINCT loc.name) AS locations,
            collect(DISTINCT ind.name) AS industries,
            collect(DISTINCT cert.name) AS certifications,
            collect(DISTINCT emp.name) AS employers,
            collect(DISTINCT intent.type) AS intents
       WHERE
         ${params.skills?.length ? `size([s IN skills WHERE s IN [${params.skills.map((_, i) => `$skill${i}`).join(", ")}]]) >= ${params.minSkills || 1}` : "1=1"}
         ${params.location ? "AND $location IN locations" : ""}
         ${params.industry ? "AND $industry IN industries" : ""}
         ${params.certification ? "AND $certification IN certifications" : ""}
         ${params.currentEmployer ? "AND $employer IN employers" : ""}
         ${params.intentType ? "AND $intent IN intents" : ""}
       RETURN properties(c) AS candidate, skills, locations, industries, certifications, employers, intents,
              size([s IN skills WHERE s IN [${params.skills?.length ? params.skills.map((_, i) => `$skill${i}`).join(", ") : ""}]]) AS matchedSkills
       ORDER BY matchedSkills DESC
       LIMIT $limit`,
      cypherParams
    );
  }
}

export const graphRecommendation = new GraphRecommendation();
