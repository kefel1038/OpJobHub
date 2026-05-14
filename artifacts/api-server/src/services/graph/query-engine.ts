import { runCypher, runCypherRaw } from "../../lib/neo4j";
import { logger } from "../../lib/logger";

export interface GraphQuery {
  matchLabels?: string[];
  whereConditions?: string[];
  returnFields?: string[];
  orderBy?: string;
  limit?: number;
  skip?: number;
  params?: Record<string, unknown>;
}

export interface TraversalQuery {
  startLabel: string;
  startId: number | string;
  traversalPattern: string;
  maxHops?: number;
  returnFields?: string;
  limit?: number;
}

class GraphQueryEngine {
  async executeQuery(query: GraphQuery): Promise<any[]> {
    const matchClause = query.matchLabels
      ? `MATCH ${query.matchLabels.join(", ")}`
      : "MATCH (n)";
    const whereClause = query.whereConditions && query.whereConditions.length > 0
      ? `WHERE ${query.whereConditions.join(" AND ")}`
      : "";
    const returnClause = query.returnFields
      ? `RETURN ${query.returnFields.join(", ")}`
      : "RETURN n";
    const orderClause = query.orderBy ? `ORDER BY ${query.orderBy}` : "";
    const limitClause = query.limit ? `LIMIT ${query.limit}` : "";
    const skipClause = query.skip ? `SKIP ${query.skip}` : "";

    const cypher = `${matchClause} ${whereClause} ${returnClause} ${orderClause} ${skipClause} ${limitClause}`;
    return runCypher(cypher, query.params);
  }

  async multiHopDiscovery(params: TraversalQuery): Promise<any[]> {
    const pattern = params.traversalPattern;
    const maxHops = params.maxHops || 3;
    const returnFields = params.returnFields || "n, relationships(p)";
    const limit = params.limit || 50;

    const cypher = `
      MATCH p = (start:\`${params.startLabel}\` {id: $startId})${pattern.repeat(maxHops)}
      WITH p, last(nodes(p)) AS n
      WHERE n <> start
      RETURN ${returnFields}
      LIMIT ${limit}
    `;

    return runCypher(cypher, { startId: params.startId });
  }

  async findHiddenGems(skillNames: string[], location?: string, limit = 20): Promise<any[]> {
    const skillConditions = skillNames.map((_, i) => `s${i}.name = $skill${i}`).join(" OR ");
    const params: Record<string, unknown> = {};
    skillNames.forEach((s, i) => { params[`skill${i}`] = s.toLowerCase(); });

    const locationClause = location
      ? `AND (c)-[:LOCATED_IN]->(:Location {name: $location})`
      : "";

    if (location) params.location = location;

    return runCypher(
      `MATCH (c:Candidate)
       WHERE c.verificationStatus IS NULL OR c.verificationStatus = "verified"
       ${locationClause}
       OPTIONAL MATCH (c)-[r:HAS_SKILL]->(s:Skill) WHERE ${skillConditions}
       WITH c, count(r) AS matchedSkills
       WHERE matchedSkills = 0
       OPTIONAL MATCH (c)-[:HAS_SKILL]->(allSkills:Skill)
       OPTIONAL MATCH (c)-[:LOCATED_IN]->(loc:Location)
       OPTIONAL MATCH (c)-[:MATCHES]->(role:JobRole)
       RETURN properties(c) AS candidate,
              collect(DISTINCT allSkills.name) AS candidateSkills,
              collect(DISTINCT loc.name) AS locations,
              collect(DISTINCT role.name) AS roles,
              size(collect(DISTINCT allSkills.name)) AS totalSkills
       ORDER BY totalSkills DESC
       LIMIT ${limit}`,
      params
    );
  }

  async skillAdjacency(targetSkill: string, minWeight = 0.3, limit = 20): Promise<any[]> {
    return runCypher(
      `MATCH (target:Skill {name: $targetSkill})
       MATCH (c:Candidate)-[:HAS_SKILL]->(target)
       MATCH (c)-[:HAS_SKILL]->(adjacent:Skill)
       WHERE adjacent <> target
       WITH adjacent, count(DISTINCT c) AS frequency
       WHERE frequency >= $minCount
       RETURN adjacent.name AS skill, frequency
       ORDER BY frequency DESC
       LIMIT ${limit}`,
      { targetSkill: targetSkill.toLowerCase(), minCount: Math.ceil(minWeight * 10) }
    );
  }

  async careerTransitions(fromRole: string, limit = 20): Promise<any[]> {
    return runCypher(
      `MATCH (from:JobRole {name: $fromRole})
       MATCH (c:Candidate)-[:MATCHES]->(from)
       MATCH (c)-[:MATCHES]->(to:JobRole)
       WHERE to <> from
       WITH to, count(DISTINCT c) AS transitions
       RETURN to.name AS targetRole, transitions
       ORDER BY transitions DESC
       LIMIT ${limit}`,
      { fromRole }
    );
  }

  async talentClusterQuery(skillNames: string[], limit = 30): Promise<any[]> {
    const params: Record<string, unknown> = {};
    const skillParams = skillNames.map((s, i) => {
      params[`skill${i}`] = s.toLowerCase();
      return `(c)-[:HAS_SKILL]->(:Skill {name: $skill${i}})`;
    });

    return runCypher(
      `MATCH (c:Candidate)
       WHERE ${skillParams.join(" AND ")}
       OPTIONAL MATCH (c)-[:HAS_SKILL]->(allSkills:Skill)
       OPTIONAL MATCH (c)-[:LOCATED_IN]->(loc:Location)
       OPTIONAL MATCH (c)-[:WORKED_AT]->(emp:Employer)
       OPTIONAL MATCH (c)-[:BELONGS_TO]->(ind:Industry)
       OPTIONAL MATCH (c)-[:INTERESTED_IN]->(intent:IntentSignal)
       RETURN properties(c) AS candidate,
              collect(DISTINCT allSkills.name) AS skills,
              collect(DISTINCT loc.name) AS locations,
              collect(DISTINCT emp.name) AS employers,
              collect(DISTINCT ind.name) AS industries,
              collect(DISTINCT intent.type) AS intents
       LIMIT ${limit}`,
      params
    );
  }

  async shortestPathBetween(fromLabel: string, fromId: number | string, toLabel: string, toId: number | string, maxDepth = 5): Promise<any> {
    const result = await runCypher(
      `MATCH p = shortestPath(
         (f:\`${fromLabel}\` {id: $fromId})-[*..${maxDepth}]-(t:\`${toLabel}\` {id: $toId})
       )
       RETURN [node IN nodes(p) | {labels: labels(node), properties: properties(node)}] AS path,
              length(p) AS depth`,
      { fromId, toId }
    );
    return result[0] || null;
  }

  async executeRawCypher(query: string, params?: Record<string, unknown>): Promise<{ records: any[]; summary: any }> {
    try {
      return await runCypherRaw(query, params);
    } catch (err) {
      logger.error({ err, query: query.slice(0, 200) }, "Cypher query execution failed");
      throw err;
    }
  }
}

export const graphQueryEngine = new GraphQueryEngine();
