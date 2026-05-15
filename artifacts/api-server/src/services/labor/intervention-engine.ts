import { db, interventions, ecosystemAlerts } from "@workspace/db";
import { eq, and, gte, lte, desc, sql, count } from "drizzle-orm";
import { logger } from "../../lib/logger";

export interface InterventionResult {
  id: number;
  interventionType: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  targetType: string;
  targetName: string;
  expectedImpact: Record<string, unknown>;
  confidence: number;
  costEstimate: number;
  roi: number;
}

class InterventionEngine {
  async generateSourcingIntervention(
    role: string, region?: string, shortageScore = 0.5,
  ): Promise<InterventionResult> {
    const title = `Sourcing intervention for ${role}${region ? ` in ${region}` : ""}`;
    const priority = shortageScore > 0.6 ? "high" : shortageScore > 0.4 ? "medium" : "low";
    const description = shortageScore > 0.6
      ? `Critical: scale sourcing across multiple corridors for ${role}`
      : `Increase sourcing pipeline for ${role} to prevent emerging shortage`;

    const expectedImpact = {
      coverageIncrease: Math.round(shortageScore * 40) + 20,
      timeToFillReduction: Math.round(shortageScore * 15) + 5,
      candidateQuality: "moderate",
    };

    const [inserted] = await db.insert(interventions).values({
      interventionType: "sourcing",
      title,
      description,
      priority,
      targetType: "role",
      targetId: role,
      targetName: role,
      expectedImpact: expectedImpact as any,
      confidence: shortageScore,
      costEstimate: Math.round(shortageScore * 5000),
      roi: Math.round(shortageScore * 300),
      metadata: { region, generatedBy: "intervention-engine" },
    }).returning();

    return this.toResult(inserted);
  }

  async generateMigrationIntervention(
    source: string, destination: string, opportunityScore = 0.5,
  ): Promise<InterventionResult> {
    const title = `Migration corridor optimization: ${source} → ${destination}`;
    const priority = opportunityScore > 0.6 ? "high" : opportunityScore > 0.4 ? "medium" : "low";
    const description = `Optimize migration pathway from ${source} to ${destination} — ` +
      (opportunityScore > 0.5
        ? "strong corridor potential with active pipeline"
        : "emerging corridor requiring structured program development");

    const expectedImpact = {
      candidateFlowIncrease: Math.round(opportunityScore * 60),
      sponsorshipSuccess: Math.round(opportunityScore * 30) + 40,
      timeToPlacement: "reduced by 15-30 days",
    };

    const [inserted] = await db.insert(interventions).values({
      interventionType: "migration",
      title,
      description,
      priority,
      targetType: "corridor",
      targetId: `${source}:${destination}`,
      targetName: `${source} → ${destination}`,
      expectedImpact: expectedImpact as any,
      confidence: opportunityScore,
      costEstimate: Math.round(opportunityScore * 8000),
      roi: Math.round(opportunityScore * 400),
      metadata: { source, destination, generatedBy: "intervention-engine" },
    }).returning();

    return this.toResult(inserted);
  }

  async generateRetentionIntervention(
    targetType: string, targetName: string, churnRisk = 0.5,
  ): Promise<InterventionResult> {
    const title = `Retention improvement for ${targetName}`;
    const priority = churnRisk > 0.6 ? "high" : churnRisk > 0.4 ? "medium" : "low";
    const description = churnRisk > 0.5
      ? `High churn risk detected for ${targetName} — implement retention program`
      : `Proactive retention measures recommended for ${targetName}`;

    const expectedImpact = {
      churnReduction: Math.round(churnRisk * 30) + 10,
      retentionImprovement: Math.round(churnRisk * 25) + 15,
      engagementScore: "improved",
    };

    const [inserted] = await db.insert(interventions).values({
      interventionType: "retention",
      title,
      description,
      priority,
      targetType,
      targetId: targetName,
      targetName,
      expectedImpact: expectedImpact as any,
      confidence: churnRisk,
      costEstimate: Math.round(churnRisk * 3000),
      roi: Math.round(churnRisk * 500),
      metadata: { churnRisk, generatedBy: "intervention-engine" },
    }).returning();

    return this.toResult(inserted);
  }

  async generateUpskillingIntervention(
    currentSkill: string, targetSkill: string, gapScore = 0.5,
  ): Promise<InterventionResult> {
    const title = `Upskilling pathway: ${currentSkill} → ${targetSkill}`;
    const priority = gapScore > 0.6 ? "high" : "medium";
    const description = `Develop structured upskilling program from ${currentSkill} to ${targetSkill} ` +
      `to address projected shortage (gap: ${Math.round(gapScore * 100)}%)`;

    const expectedImpact = {
      skillGapReduction: Math.round(gapScore * 50) + 20,
      certificationCompletion: "60-90 days",
      salaryUplift: Math.round(gapScore * 25) + 5,
    };

    const [inserted] = await db.insert(interventions).values({
      interventionType: "upskilling",
      title,
      description,
      priority,
      targetType: "skill",
      targetId: targetSkill,
      targetName: `${currentSkill} → ${targetSkill}`,
      expectedImpact: expectedImpact as any,
      confidence: gapScore,
      costEstimate: Math.round(gapScore * 2000),
      roi: Math.round(gapScore * 600),
      metadata: { currentSkill, targetSkill, gapScore, generatedBy: "intervention-engine" },
    }).returning();

    return this.toResult(inserted);
  }

  async generateSponsorshipIntervention(
    nationality: string, destination: string, bottleneckScore = 0.5,
  ): Promise<InterventionResult> {
    const title = `Sponsorship optimization: ${nationality} → ${destination}`;
    const priority = bottleneckScore > 0.6 ? "critical" : bottleneckScore > 0.4 ? "high" : "medium";
    const description = bottleneckScore > 0.5
      ? `Sponsorship bottleneck detected for ${nationality} → ${destination} — optimize application process`
      : `Proactive sponsorship program enhancement for ${nationality} → ${destination}`;

    const expectedImpact = {
      approvalRateImprovement: Math.round((1 - bottleneckScore) * 30) + 20,
      processingTimeReduction: "10-20 days",
      applicationVolume: "increase by 30-50%",
    };

    const [inserted] = await db.insert(interventions).values({
      interventionType: "sponsorship",
      title,
      description,
      priority,
      targetType: "corridor",
      targetId: `${nationality}:${destination}`,
      targetName: `${nationality} → ${destination}`,
      expectedImpact: expectedImpact as any,
      confidence: bottleneckScore,
      costEstimate: Math.round(bottleneckScore * 4000),
      roi: Math.round(bottleneckScore * 350),
      metadata: { nationality, destination, generatedBy: "intervention-engine" },
    }).returning();

    return this.toResult(inserted);
  }

  async getInterventions(limit = 20, status?: string): Promise<Array<Record<string, unknown>>> {
    const conditions = [];
    if (status) conditions.push(eq(interventions.status, status));
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const query = where
      ? db.select().from(interventions).where(where).orderBy(desc(interventions.createdAt)).limit(limit)
      : db.select().from(interventions).orderBy(desc(interventions.createdAt)).limit(limit);
    return query;
  }

  async getInterventionById(id: number): Promise<Record<string, unknown> | null> {
    const rows = await db.select().from(interventions).where(eq(interventions.id, id)).limit(1);
    return rows[0] || null;
  }

  async updateInterventionStatus(id: number, status: string): Promise<void> {
    const updates: Record<string, unknown> = { status };
    if (status === "active") updates.activatedAt = new Date();
    if (status === "completed" || status === "dismissed") updates.completedAt = new Date();
    await db.update(interventions).set(updates).where(eq(interventions.id, id));
  }

  private toResult(record: any): InterventionResult {
    return {
      id: record.id,
      interventionType: record.interventionType,
      title: record.title,
      description: record.description || "",
      priority: record.priority,
      status: record.status,
      targetType: record.targetType || "",
      targetName: record.targetName || "",
      expectedImpact: (record.expectedImpact || {}) as Record<string, unknown>,
      confidence: record.confidence || 0.5,
      costEstimate: record.costEstimate || 0,
      roi: record.roi || 0,
    };
  }
}

export const interventionEngine = new InterventionEngine();
