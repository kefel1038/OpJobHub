import { runCypher } from "../../lib/neo4j";
import { openrouter } from "../../lib/openai";
import { logger } from "../../lib/logger";

const RAG_SYSTEM_PROMPT = `You are OpJobHub's GraphRAG — a graph-enhanced recruitment intelligence AI.
You have access to a workforce knowledge graph with candidates, skills, employers, locations, and relationships.
Use the graph context provided to generate accurate, personalized recruitment insights.
Respond professionally and data-driven.`;

class GraphRAG {
  async enhanceQuery(originalQuery: string, graphContext: string): Promise<string> {
    return `## Labor Graph Context\n${graphContext}\n\n## Recruiter Query\n${originalQuery}\n\n## Response\n`;
  }

  async retrieveContext(params: {
    skills?: string[];
    location?: string;
    industry?: string;
    employerId?: number;
    depth?: number;
  }): Promise<string> {
    const parts: string[] = [];

    if (params.skills?.length) {
      const skillResults = await runCypher(
        `MATCH (s:Skill) WHERE s.name IN $skills
         OPTIONAL MATCH (s)<-[r:HAS_SKILL]-(c:Candidate)
         WITH s, count(r) AS candidateCount
         RETURN s.name AS skill, candidateCount
         ORDER BY candidateCount DESC`,
        { skills: params.skills.map(s => s.toLowerCase()) }
      );
      if (skillResults.length > 0) {
        parts.push("## Skill Availability\n" + skillResults.map((r: any) =>
          `- ${r.skill}: ${r.candidateCount} candidates`
        ).join("\n"));
      }
    }

    if (params.location) {
      const locationResults = await runCypher(
        `MATCH (loc:Location {name: $location})<-[:LOCATED_IN]-(c:Candidate)
         OPTIONAL MATCH (c)-[:HAS_SKILL]->(s:Skill)
         OPTIONAL MATCH (c)-[:BELONGS_TO]->(ind:Industry)
         RETURN count(DISTINCT c) AS totalCandidates,
                collect(DISTINCT s.name)[..8] AS topSkills,
                collect(DISTINCT ind.name)[..5] AS topIndustries`,
        { location: params.location }
      );
      if (locationResults[0]) {
        const r = locationResults[0] as any;
        parts.push(`## Location: ${params.location}\n- Total candidates: ${r.totalCandidates}\n- Top skills: ${(r.topSkills || []).join(", ")}\n- Top industries: ${(r.topIndustries || []).join(", ")}`);
      }
    }

    if (params.industry) {
      const industryResults = await runCypher(
        `MATCH (ind:Industry {name: $industry})<-[:BELONGS_TO]-(c:Candidate)
         OPTIONAL MATCH (c)-[:HAS_SKILL]->(s:Skill)
         RETURN count(DISTINCT c) AS totalCandidates,
                collect(DISTINCT s.name)[..8] AS topSkills`,
        { industry: params.industry }
      );
      if (industryResults[0]) {
        const r = industryResults[0] as any;
        parts.push(`## Industry: ${params.industry}\n- Total candidates: ${r.totalCandidates}\n- Top skills: ${(r.topSkills || []).join(", ")}`);
      }
    }

    if (params.employerId) {
      const employerResults = await runCypher(
        `MATCH (e:Employer {id: $employerId})
         OPTIONAL MATCH (e)-[:PREFERS]->(p)
         OPTIONAL MATCH (c:Candidate)-[:WORKED_AT]->(e)
         RETURN e.name AS employerName,
                collect(DISTINCT labels(p)[0] + ": " + p.name) AS preferences,
                count(DISTINCT c) AS candidateConnections`,
        { employerId: params.employerId }
      );
      if (employerResults[0]) {
        const r = employerResults[0] as any;
        parts.push(`## Employer Context\n- Name: ${r.employerName}\n- Preferences: ${(r.preferences || []).join(", ")}\n- Graph connections: ${r.candidateConnections}`);
      }
    }

    if (params.depth && params.depth > 0) {
      const adjacencyResults = await runCypher(
        `MATCH (s:Skill)<-[:HAS_SKILL]-(c)-[:HAS_SKILL]->(adjacent:Skill)
         WHERE s.name IN $skills AND adjacent <> s
         WITH adjacent, count(DISTINCT c) AS cooccurrence
         ORDER BY cooccurrence DESC
         LIMIT 10
         RETURN adjacent.name AS skill, cooccurrence`,
        { skills: params.skills?.map(s => s.toLowerCase()) || [] }
      );
      if (adjacencyResults.length > 0) {
        parts.push("## Skill Adjacency (co-occurrence)\n" + adjacencyResults.map((r: any) =>
          `- ${r.skill}: ${r.cooccurrence} candidates`
        ).join("\n"));
      }
    }

    return parts.join("\n\n");
  }

  async chat(recruiterMessage: string, graphParams?: {
    skills?: string[];
    location?: string;
    industry?: string;
    employerId?: number;
    depth?: number;
  }): Promise<{ reply: string; graphContext: string }> {
    const graphContext = await this.retrieveContext(graphParams || {});
    const enhancedQuery = await this.enhanceQuery(recruiterMessage, graphContext);

    try {
      const completion = await openrouter().chat.completions.create({
        model: "openrouter/free",
        messages: [
          { role: "system", content: RAG_SYSTEM_PROMPT },
          { role: "user", content: enhancedQuery.slice(0, 4000) },
        ],
        temperature: 0.5,
        max_tokens: 1000,
      });

      return {
        reply: completion.choices[0].message.content || "Unable to generate response from graph context.",
        graphContext,
      };
    } catch (err) {
      logger.error({ err }, "GraphRAG chat failed");
      return {
        reply: "Sorry, I encountered an error while querying the knowledge graph. Please try again.",
        graphContext,
      };
    }
  }

  async multiHopReasoning(question: string): Promise<{ answer: string; path: string[]; confidence: number }> {
    try {
      const completion = await openrouter().chat.completions.create({
        model: "openrouter/free",
        messages: [
          {
            role: "system",
            content: `You are a graph reasoning AI. Based on the user's question about workforce/talent,
generate 1-3 Cypher queries that would answer it.
Think step by step about what nodes and relationships are needed.
Respond with ONLY a JSON object:
{
  "queries": ["CYPHER_QUERY_1", "CYPHER_QUERY_2"],
  "reasoning": "explanation of the graph traversal strategy"
}`,
          },
          { role: "user", content: question },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      });

      const raw = completion.choices[0].message.content || "{}";
      const parsed = JSON.parse(raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim());
      const queries: string[] = parsed.queries || [];
      const reasoning: string = parsed.reasoning || "";

      const results: string[] = [];
      for (let i = 0; i < Math.min(queries.length, 3); i++) {
        try {
          const queryResult = await runCypher(queries[i]);
          results.push(`Query ${i + 1}: ${JSON.stringify(queryResult.slice(0, 5))}`);
        } catch (err) {
          results.push(`Query ${i + 1} failed: ${err instanceof Error ? err.message : "Unknown error"}`);
        }
      }

      const answerCompletion = await openrouter().chat.completions.create({
        model: "openrouter/free",
        messages: [
          {
            role: "system",
            content: `You are answering a recruiting/talent question based on Neo4j graph query results.
Be concise, data-driven, and specific.`,
          },
          {
            role: "user",
            content: `Question: ${question}\n\nGraph Reasoning Strategy: ${reasoning}\n\nQuery Results:\n${results.join("\n")}\n\nProvide a clear, actionable answer:`,
          },
        ],
        temperature: 0.3,
        max_tokens: 800,
      });

      return {
        answer: answerCompletion.choices[0].message.content || "No answer could be generated.",
        path: queries,
        confidence: results.filter(r => !r.includes("failed")).length / Math.max(queries.length, 1),
      };
    } catch (err) {
      logger.error({ err }, "Multi-hop reasoning failed");
      return { answer: "I encountered an error during graph reasoning.", path: [], confidence: 0 };
    }
  }
}

export const graphRag = new GraphRAG();
