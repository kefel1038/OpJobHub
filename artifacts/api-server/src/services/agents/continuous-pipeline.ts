import { db, discoveryPipelines, discoveredCandidates, jobs } from "@workspace/db";
import { eq, and, sql, inArray, isNull } from "drizzle-orm";
import { logger } from "../../lib/logger";
import { eventBus, RecruitmentEventTypes } from "./event-bus";
import { discoveryAgent } from "./discovery-agent";
import { enrichmentAgent } from "./enrichment-agent";
import { verificationAgent } from "./verification-agent";
import { relevanceAgent } from "./relevance-agent";
import { outreachAgent } from "./outreach-agent";
import { sourceManager } from "./source-manager";
import { safetyEngine } from "./safety-engine";
import { approvalManager } from "./approval-manager";
import { reasoningEngine } from "./reasoning-engine";
import { runPipelineViaQueue, dispatchEnrichment, dispatchVerification, dispatchGraphSync } from "../queue/pipeline-worker";

export interface PipelineConfig {
  employerId: number;
  jobId: number;
  sources?: string[];
  skills?: string[];
  roles?: string[];
  locations?: string[];
  autoEnrich?: boolean;
  autoVerify?: boolean;
  autoMatch?: boolean;
  autoReachOut?: boolean;
}

class ContinuousPipeline {
  private activePipelines: Map<number, boolean> = new Map();
  private pipelineTimer: NodeJS.Timeout | null = null;

  async runFullPipeline(config: PipelineConfig): Promise<{
    discovery: { discovered: number };
    enrichment: { enriched: number };
    verification: { verified: number };
    matching: { matched: number };
    outreach: { contacted: number };
  }> {
    const result = {
      discovery: { discovered: 0 },
      enrichment: { enriched: 0 },
      verification: { verified: 0 },
      matching: { matched: 0 },
      outreach: { contacted: 0 },
    };

    const pipelineId = await this.createPipelineRecord(config);

    try {
      logger.info({ employerId: config.employerId, jobId: config.jobId }, "Full sourcing pipeline started");

      const discovery = await discoveryAgent.discoverCandidates({
        employerId: config.employerId,
        sources: config.sources,
        skills: config.skills,
        roles: config.roles,
        locations: config.locations,
      });
      result.discovery = { discovered: discovery.discovered };

      const discoveredIds = discovery.candidates.filter(c => c.score >= 0.3).map(c => c.id);

      if (discoveredIds.length > 0) {
        if (config.autoEnrich !== false) {
          result.enrichment.enriched = await enrichmentAgent.batchEnrich(discoveredIds);
        }

        if (config.autoVerify !== false) {
          result.verification.verified = await verificationAgent.batchVerify(discoveredIds);
        }

        if (config.autoMatch !== false) {
          const verifiedIdsResult = await db.select({ id: discoveredCandidates.id })
            .from(discoveredCandidates)
            .where(and(
              inArray(discoveredCandidates.id, discoveredIds),
              eq(discoveredCandidates.verificationStatus, "verified"),
            ));

          const verifiedIds = verifiedIdsResult.map(v => v.id);
          const matches = await relevanceAgent.batchMatch(verifiedIds, config.jobId, config.employerId);
          result.matching.matched = matches.length;

          if (config.autoReachOut && matches.length > 0) {
            const topMatches = matches.filter(m => m.score >= 70).slice(0, 5);

            for (const match of topMatches) {
              const reasoningArtifact = reasoningEngine.generateSourcingReasoning([], [], match.score);

              const approval = await approvalManager.submit({
                employerId: config.employerId,
                actionType: "candidate_outreach",
                targetId: match.candidateId,
                targetType: "discovered_candidate",
                aiSuggestion: {
                  action: "send_outreach_message",
                  candidateId: match.candidateId,
                  jobId: config.jobId,
                  matchScore: match.score,
                  recommendation: match.recommendation,
                },
                confidence: match.score / 100,
                reasoning: reasoningArtifact,
              });

              if (approval.autoExecuted) {
                await outreachAgent.generateMessage({
                  employerId: config.employerId,
                  candidateId: match.candidateId,
                  jobId: config.jobId,
                  stage: "sourcing",
                  customNotes: `AI-sourced candidate. Match score: ${match.score}/100. ${match.reasoning}`,
                });
                result.outreach.contacted++;
              }

              await reasoningEngine.recordDecision(config.employerId, {
                decisionType: "sourcing_outreach",
                agentType: "continuous-pipeline",
                targetId: match.candidateId,
                targetType: "discovered_candidate",
                score: match.score,
                confidence: match.score / 100,
                reasoning: reasoningArtifact,
                inputContext: { jobId: config.jobId, sources: config.sources },
              });
            }
          }
        }
      }

      await this.updatePipelineStats(pipelineId, result);

      await eventBus.emitEvent({
        type: RecruitmentEventTypes.AGENT_ACTION,
        source: "continuous-pipeline",
        payload: { employerId: config.employerId, jobId: config.jobId, ...result },
        timestamp: new Date(),
      });

      logger.info({ employerId: config.employerId, jobId: config.jobId, ...result }, "Full sourcing pipeline completed");
    } catch (err) {
      logger.error({ err, employerId: config.employerId, jobId: config.jobId }, "Pipeline failed");
      await this.updatePipelineStatus(pipelineId, "failed");
    }

    return result;
  }

  async triggerSourcingForJob(jobId: number): Promise<void> {
    const [job] = await db.select({
      id: jobs.id,
      title: jobs.title,
      skills: jobs.skills,
      location: jobs.location,
      companyId: jobs.companyId,
      createdBy: jobs.createdBy,
    }).from(jobs).where(eq(jobs.id, jobId)).limit(1) as any[];

    if (!job) return;

    const employerId = job.createdBy || job.companyId;
    if (!employerId) return;

    await this.runFullPipeline({
      employerId,
      jobId,
      skills: (job.skills || []).map((s: string) => s),
      roles: [job.title],
      locations: job.location ? [job.location] : undefined,
      autoEnrich: true,
      autoVerify: true,
      autoMatch: true,
      autoReachOut: false,
    });
  }

  startScheduledRuns(intervalMinutes = 60): void {
    if (this.pipelineTimer) clearInterval(this.pipelineTimer);

    this.pipelineTimer = setInterval(async () => {
      const activePipelines = await db.select()
        .from(discoveryPipelines)
        .where(and(
          eq(discoveryPipelines.isActive, true),
          sql`${discoveryPipelines.schedule} != 'manual'`,
        ));

      for (const pipeline of activePipelines) {
        if (this.activePipelines.get(pipeline.id)) continue;
        this.activePipelines.set(pipeline.id, true);

        try {
          await this.runFullPipeline({
            employerId: pipeline.employerId,
            jobId: 0,
            sources: (pipeline.sources || []) as string[],
            skills: ((pipeline.searchParams as any)?.skills || []) as string[],
            roles: ((pipeline.searchParams as any)?.roles || []) as string[],
            locations: ((pipeline.searchParams as any)?.locations || []) as string[],
          });
        } catch (err) {
          logger.error({ err, pipelineId: pipeline.id }, "Scheduled pipeline run failed");
        } finally {
          this.activePipelines.delete(pipeline.id);
        }
      }
    }, intervalMinutes * 60 * 1000);

    logger.info({ intervalMinutes }, "Scheduled pipeline runs started");
  }

  private async createPipelineRecord(config: PipelineConfig): Promise<number> {
    const [result] = await db.insert(discoveryPipelines).values({
      employerId: config.employerId,
      name: `Pipeline for job ${config.jobId}`,
      sources: config.sources || [],
      searchParams: { skills: config.skills, roles: config.roles, locations: config.locations },
      schedule: "manual",
      lastRunAt: new Date(),
      config: { autoEnrich: config.autoEnrich, autoVerify: config.autoVerify, autoMatch: config.autoMatch, autoReachOut: config.autoReachOut },
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning({ id: discoveryPipelines.id });

    return result.id;
  }

  private async updatePipelineStats(pipelineId: number, result: any): Promise<void> {
    await db.update(discoveryPipelines)
      .set({
        totalDiscovered: sql`${discoveryPipelines.totalDiscovered} + ${result.discovery.discovered}`,
        totalContacted: sql`${discoveryPipelines.totalContacted} + ${result.outreach.contacted}`,
        lastRunAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(discoveryPipelines.id, pipelineId));
  }

  private async updatePipelineStatus(pipelineId: number, status: string): Promise<void> {
    await db.update(discoveryPipelines)
      .set({ isActive: status !== "failed", updatedAt: new Date() })
      .where(eq(discoveryPipelines.id, pipelineId));
  }

  async getPipelineHistory(employerId?: number, limit = 20): Promise<any[]> {
    const conditions = employerId ? [eq(discoveryPipelines.employerId, employerId)] : [];
    return db.select()
      .from(discoveryPipelines)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(sql`created_at DESC`)
      .limit(limit);
  }
}

export const continuousPipeline = new ContinuousPipeline();
