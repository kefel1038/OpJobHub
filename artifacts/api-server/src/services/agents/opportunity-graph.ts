import { db, discoveredCandidates, opportunityGraphEdges, candidateEnrichments, intentSignals } from "@workspace/db";
import { eq, and, sql, inArray } from "drizzle-orm";
import { logger } from "../../lib/logger";

export interface GraphQuery {
  relationType?: string;
  relationValue?: string;
  candidateId?: number;
  limit?: number;
}

export interface RelatedCandidate {
  candidateId: number;
  fullName: string | null;
  email: string | null;
  headline: string | null;
  location: string | null;
  relationType: string;
  relationValue: string;
  weight: number;
}

class OpportunityGraph {
  async addEdge(params: {
    candidateId: number;
    relationType: string;
    relationValue: string;
    weight?: number;
    source?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await db.insert(opportunityGraphEdges).values({
      candidateId: params.candidateId,
      relationType: params.relationType,
      relationValue: params.relationValue,
      weight: params.weight || 1.0,
      source: params.source || "manual",
      metadata: params.metadata || {},
    }).onConflictDoNothing();
  }

  async buildFromCandidate(candidateId: number): Promise<number> {
    const [candidate] = await db.select()
      .from(discoveredCandidates)
      .where(eq(discoveredCandidates.id, candidateId))
      .limit(1);

    if (!candidate) return 0;

    const enrichments = await db.select()
      .from(candidateEnrichments)
      .where(eq(candidateEnrichments.candidateId, candidateId));

    const edges: Array<{ relationType: string; relationValue: string; weight: number }> = [];

    for (const skill of candidate.skills || []) {
      edges.push({ relationType: "has_skill", relationValue: skill, weight: 1.0 });
    }
    for (const skill of candidate.normalizedSkills || []) {
      edges.push({ relationType: "has_skill", relationValue: skill, weight: 1.0 });
    }
    if (candidate.location) {
      edges.push({ relationType: "located_in", relationValue: candidate.location, weight: 0.8 });
    }
    if (candidate.currentEmployer) {
      edges.push({ relationType: "works_at", relationValue: candidate.currentEmployer, weight: 0.9 });
    }
    for (const cert of candidate.certifications || []) {
      edges.push({ relationType: "certified_in", relationValue: cert, weight: 0.7 });
    }
    for (const prevEmployer of candidate.previousEmployers || []) {
      edges.push({ relationType: "previously_worked_at", relationValue: prevEmployer, weight: 0.6 });
    }
    if (candidate.industry) {
      edges.push({ relationType: "in_industry", relationValue: candidate.industry, weight: 0.5 });
    }

    for (const enrichment of enrichments) {
      const data = enrichment.enrichmentData as Record<string, unknown>;
      if (data.inferredSkills && Array.isArray(data.inferredSkills)) {
        for (const skill of data.inferredSkills as string[]) {
          edges.push({ relationType: "has_skill", relationValue: skill, weight: 0.6 });
        }
      }
      if (data.recommendedRoles && Array.isArray(data.recommendedRoles)) {
        for (const role of data.recommendedRoles as string[]) {
          edges.push({ relationType: "suited_for", relationValue: role, weight: 0.5 });
        }
      }
    }

    for (const edge of edges) {
      await db.insert(opportunityGraphEdges).values({
        candidateId,
        ...edge,
        source: "graph_builder",
      }).onConflictDoNothing();
    }

    return edges.length;
  }

  async query(params: GraphQuery): Promise<RelatedCandidate[]> {
    const conditions = [];
    if (params.relationType) conditions.push(eq(opportunityGraphEdges.relationType, params.relationType));
    if (params.relationValue) conditions.push(eq(opportunityGraphEdges.relationValue, params.relationValue));
    if (params.candidateId) conditions.push(eq(opportunityGraphEdges.candidateId, params.candidateId));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const limit = params.limit || 50;

    const edges = await db.select({
      candidateId: opportunityGraphEdges.candidateId,
      relationType: opportunityGraphEdges.relationType,
      relationValue: opportunityGraphEdges.relationValue,
      weight: opportunityGraphEdges.weight,
      fullName: discoveredCandidates.fullName,
      email: discoveredCandidates.email,
      headline: discoveredCandidates.headline,
      location: discoveredCandidates.location,
    })
      .from(opportunityGraphEdges)
      .innerJoin(discoveredCandidates, eq(discoveredCandidates.id, opportunityGraphEdges.candidateId))
      .where(whereClause)
      .orderBy(sql`${opportunityGraphEdges.weight} DESC`)
      .limit(limit);

    return edges as RelatedCandidate[];
  }

  async findSimilarCandidates(candidateId: number, limit = 10): Promise<RelatedCandidate[]> {
    const myEdges = await db.select({
      relationType: opportunityGraphEdges.relationType,
      relationValue: opportunityGraphEdges.relationValue,
    })
      .from(opportunityGraphEdges)
      .where(eq(opportunityGraphEdges.candidateId, candidateId));

    if (myEdges.length === 0) return [];

    const conditions = myEdges.map(e =>
      sql`(${opportunityGraphEdges.relationType} = ${e.relationType} AND ${opportunityGraphEdges.relationValue} = ${e.relationValue})`
    );
    const whereClause: any = and(
      sql`${opportunityGraphEdges.candidateId} != ${candidateId}`,
      ...conditions,
    );

    const similar = await db.select({
      candidateId: opportunityGraphEdges.candidateId,
      relationType: opportunityGraphEdges.relationType,
      relationValue: opportunityGraphEdges.relationValue,
      weight: opportunityGraphEdges.weight,
      fullName: discoveredCandidates.fullName,
      email: discoveredCandidates.email,
      headline: discoveredCandidates.headline,
      location: discoveredCandidates.location,
    })
      .from(opportunityGraphEdges)
      .innerJoin(discoveredCandidates, eq(discoveredCandidates.id, opportunityGraphEdges.candidateId))
      .where(whereClause)
      .orderBy(sql`${opportunityGraphEdges.weight} DESC`)
      .limit(limit * 3);

    const grouped = new Map<number, RelatedCandidate & { matchCount: number }>();
    for (const s of similar) {
      const existing = grouped.get(s.candidateId);
      if (existing) {
        existing.matchCount++;
        existing.weight = Math.min(1.0, existing.weight + 0.1);
      } else {
        grouped.set(s.candidateId, { ...s, weight: s.weight ?? 0, matchCount: 1 });
      }
    }

    return Array.from(grouped.values())
      .sort((a, b) => b.matchCount - a.matchCount || b.weight - a.weight)
      .slice(0, limit);
  }

  async getGraphSummary(employerId?: number): Promise<{
    totalNodes: number;
    totalEdges: number;
    topSkills: Array<{ value: string; count: number }>;
    topLocations: Array<{ value: string; count: number }>;
    topIndustries: Array<{ value: string; count: number }>;
  }> {
    const conditions = employerId
      ? [sql`c.${sql.identifier("matched_by_employer_id")} = ${employerId}`]
      : [];

    const whereClause = conditions.length > 0
      ? and(...conditions.map(c => sql`${discoveredCandidates.id} IN (SELECT id FROM discovered_candidates WHERE ${c})`))
      : undefined;

    const totalNodes = await db.select({ count: sql<number>`count(*)::int` })
      .from(discoveredCandidates)
      .where(employerId ? eq(discoveredCandidates.matchedByEmployerId, employerId) : undefined)
      .then(r => r[0]?.count || 0);

    const totalEdges = await db.select({ count: sql<number>`count(*)::int` })
      .from(opportunityGraphEdges)
      .where(whereClause || undefined)
      .then(r => r.find((x: any) => x)?.count || 0);

    const topSkills = await db.select({
      value: opportunityGraphEdges.relationValue,
      count: sql<number>`count(*)::int`,
    })
      .from(opportunityGraphEdges)
      .where(eq(opportunityGraphEdges.relationType, "has_skill"))
      .groupBy(opportunityGraphEdges.relationValue)
      .orderBy(sql`count(*) DESC`)
      .limit(20) as any;

    const topLocations = await db.select({
      value: opportunityGraphEdges.relationValue,
      count: sql<number>`count(*)::int`,
    })
      .from(opportunityGraphEdges)
      .where(eq(opportunityGraphEdges.relationType, "located_in"))
      .groupBy(opportunityGraphEdges.relationValue)
      .orderBy(sql`count(*) DESC`)
      .limit(10) as any;

    const topIndustries = await db.select({
      value: opportunityGraphEdges.relationValue,
      count: sql<number>`count(*)::int`,
    })
      .from(opportunityGraphEdges)
      .where(eq(opportunityGraphEdges.relationType, "in_industry"))
      .groupBy(opportunityGraphEdges.relationValue)
      .orderBy(sql`count(*) DESC`)
      .limit(10) as any;

    return {
      totalNodes,
      totalEdges,
      topSkills: topSkills || [],
      topLocations: topLocations || [],
      topIndustries: topIndustries || [],
    };
  }
}

export const opportunityGraph = new OpportunityGraph();
