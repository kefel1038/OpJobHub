import { runCypher, verifyNeo4jConnection } from "../../lib/neo4j";
import { logger } from "../../lib/logger";

export type NodeLabel = "Candidate" | "Employer" | "Skill" | "Certification" | "Industry" | "Location" | "University" | "IntentSignal" | "JobRole" | "MigrationPath";
export type RelationType =
  "HAS_SKILL" | "WORKED_AT" | "INTERESTED_IN" | "MATCHES" | "HIRED_BY" | "PREFERS"
  | "CONNECTED_TO" | "MIGRATES_TO" | "STUDIED_AT" | "CERTIFIED_IN" | "LOCATED_IN"
  | "SEEKS" | "BELONGS_TO" | "SIMILAR_TO" | "TRANSITIONS_TO" | "SPONSORS"
  | "RECOMMENDS" | "AVOIDS" | "REQUIRES" | "ADJACENT_TO";

export interface Neo4jNode {
  labels: NodeLabel[];
  properties: Record<string, unknown>;
}

export interface Neo4jRelation {
  type: RelationType;
  fromLabels: NodeLabel[];
  fromMatch: Record<string, unknown>;
  toLabels: NodeLabel[];
  toMatch: Record<string, unknown>;
  properties?: Record<string, unknown>;
}

class GraphBuilder {
  async initializeConstraints(): Promise<void> {
    const constraints = [
      "CREATE CONSTRAINT IF NOT EXISTS FOR (c:Candidate) REQUIRE c.id IS UNIQUE",
      "CREATE CONSTRAINT IF NOT EXISTS FOR (e:Employer) REQUIRE e.id IS UNIQUE",
      "CREATE CONSTRAINT IF NOT EXISTS FOR (s:Skill) REQUIRE s.name IS UNIQUE",
      "CREATE CONSTRAINT IF NOT EXISTS FOR (c:Certification) REQUIRE c.name IS UNIQUE",
      "CREATE CONSTRAINT IF NOT EXISTS FOR (i:Industry) REQUIRE i.name IS UNIQUE",
      "CREATE CONSTRAINT IF NOT EXISTS FOR (l:Location) REQUIRE l.name IS UNIQUE",
      "CREATE CONSTRAINT IF NOT EXISTS FOR (u:University) REQUIRE u.name IS UNIQUE",
      "CREATE CONSTRAINT IF NOT EXISTS FOR (j:JobRole) REQUIRE j.name IS UNIQUE",
      "CREATE CONSTRAINT IF NOT EXISTS FOR (m:MigrationPath) REQUIRE m.id IS UNIQUE",
      "CREATE CONSTRAINT IF NOT EXISTS FOR (is:IntentSignal) REQUIRE is.id IS UNIQUE",
    ];

    for (const cql of constraints) {
      try {
        await runCypher(cql);
      } catch (err) {
        logger.error({ err, cql }, "Failed to create Neo4j constraint");
      }
    }
    logger.info("Neo4j constraints initialized");
  }

  async upsertNode(labels: NodeLabel[], properties: Record<string, unknown>): Promise<void> {
    const labelStr = labels.map(l => `\`${l}\``).join(":");
    const props = Object.keys(properties);
    const setClauses = props.map(p => `n.\`${p}\` = $${p}`).join(", ");
    const matchKey = properties.id ? "n.id = $id" : props.map(p => `n.\`${p}\` = $${p}`).join(" AND ");

    await runCypher(
      `MERGE (n:${labelStr} { ${matchKey} })
       ON CREATE SET ${setClauses}, n.createdAt = datetime()
       ON MATCH SET ${setClauses}, n.updatedAt = datetime()`,
      properties
    );
  }

  async createRelation(relation: Neo4jRelation): Promise<void> {
    const fromLabel = relation.fromLabels.map(l => `\`${l}\``).join(":");
    const toLabel = relation.toLabels.map(l => `\`${l}\``).join(":");

    const fromMatch = Object.entries(relation.fromMatch)
      .map(([k, v]) => `f.\`${k}\` = $from_${k}`).join(" AND ");
    const toMatch = Object.entries(relation.toMatch)
      .map(([k, v]) => `t.\`${k}\` = $to_${k}`).join(" AND ");

    const params: Record<string, unknown> = {};
    Object.entries(relation.fromMatch).forEach(([k, v]) => { params[`from_${k}`] = v; });
    Object.entries(relation.toMatch).forEach(([k, v]) => { params[`to_${k}`] = v; });

    const relProps = relation.properties || {};
    const relKeys = Object.keys(relProps);
    const relSet = relKeys.length > 0
      ? `SET r.${relKeys.map(k => `\`${k}\` = $rel_${k}`).join(", ")}`
      : "";

    Object.entries(relProps).forEach(([k, v]) => { params[`rel_${k}`] = v; });

    await runCypher(
      `MATCH (f:${fromLabel}) WHERE ${fromMatch}
       MATCH (t:${toLabel}) WHERE ${toMatch}
       MERGE (f)-[r:\`${relation.type}\`]->(t)
       ${relSet}
       RETURN r`,
      params
    );
  }

  async deleteNode(label: NodeLabel, id: number | string): Promise<void> {
    await runCypher(
      `MATCH (n:\`${label}\` {id: $id})
       DETACH DELETE n`,
      { id }
    );
  }

  async clearGraph(): Promise<void> {
    await runCypher("MATCH (n) DETACH DELETE n");
    logger.info("Neo4j graph cleared");
  }

  async getNodeCount(): Promise<Record<string, number>> {
    const labels: NodeLabel[] = ["Candidate", "Employer", "Skill", "Certification", "Industry", "Location", "University", "IntentSignal", "JobRole", "MigrationPath"];
    const counts: Record<string, number> = {};

    for (const label of labels) {
      const result = await runCypher(`MATCH (n:\`${label}\`) RETURN count(n) AS count`);
      counts[label] = (result[0]?.count as number) || 0;
    }

    const relResult = await runCypher("MATCH ()-[r]->() RETURN count(r) AS count");
    counts._relationships = (relResult[0]?.count as number) || 0;

    return counts;
  }

  async getNeighbors(nodeLabel: NodeLabel, id: number | string, relationTypes?: RelationType[], depth = 1): Promise<any[]> {
    const relFilter = relationTypes && relationTypes.length > 0
      ? `[${relationTypes.map(r => `"${r}"`).join(", ")}]`
      : "[]";

    const result = await runCypher(
      `MATCH (n:\`${nodeLabel}\` {id: $id})
       CALL apoc.neighbors.bycount(n, ${relFilter}, ${depth})
       YIELD node, count
       RETURN properties(node) AS node, labels(node) AS labels, count
       ORDER BY count DESC
       LIMIT 50`,
      { id }
    );
    return result;
  }

  async shortestPath(fromLabel: NodeLabel, fromId: number | string, toLabel: NodeLabel, toId: number | string, maxHops = 6): Promise<any[]> {
    const result = await runCypher(
      `MATCH p = shortestPath(
         (f:\`${fromLabel}\` {id: $fromId})-[*..${maxHops}]-(t:\`${toLabel}\` {id: $toId})
       )
       UNWIND nodes(p) AS node
       RETURN properties(node) AS node, labels(node) AS labels
       LIMIT 20`,
      { fromId, toId }
    );
    return result;
  }
}

export const graphBuilder = new GraphBuilder();
