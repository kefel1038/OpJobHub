import { logger } from "../../lib/logger";
import { eventBus, RecruitmentEventTypes, type RecruitmentEvent } from "./event-bus";
import { recruitmentMemory } from "./memory";
import { sourcingAgent } from "./sourcing-agent";
import { rankingAgent } from "./ranking-agent";
import { outreachAgent } from "./outreach-agent";
import { sourceManager } from "./source-manager";
import { continuousPipeline } from "./continuous-pipeline";

export class AgentOrchestrator {
  private active = false;

  start(): void {
    if (this.active) return;
    this.active = true;

    eventBus.on(RecruitmentEventTypes.JOB_POSTED, this.handleJobPosted.bind(this));
    eventBus.on(RecruitmentEventTypes.CANDIDATE_APPLIED, this.handleCandidateApplied.bind(this));
    eventBus.on(RecruitmentEventTypes.INTERVIEW_MISSED, this.handleInterviewMissed.bind(this));
    eventBus.on(RecruitmentEventTypes.CANDIDATE_GHOSTED, this.handleCandidateGhosted.bind(this));
    eventBus.on("*", this.logAllEvents.bind(this));

    sourceManager.initializeDefaultSources().catch(err => logger.error({ err }, "Failed to init default sources"));
    continuousPipeline.startScheduledRuns(60);

    logger.info("Agent orchestrator started — listening for recruitment events — autonomous sourcing active");
  }

  stop(): void {
    this.active = false;
    logger.info("Agent orchestrator stopped");
  }

  private async handleJobPosted(event: RecruitmentEvent): Promise<void> {
    const { jobId, employerId } = event.payload as { jobId: number; employerId: number };
    logger.info({ jobId, employerId }, "Orchestrator: job posted — launching sourcing + ranking pipeline + autonomous discovery");

    const [sourceResult, externalDiscovery] = await Promise.all([
      sourcingAgent.sourceForJob(jobId, employerId),
      continuousPipeline.triggerSourcingForJob(jobId).catch(err => {
        logger.error({ err, jobId }, "Autonomous sourcing pipeline failed");
        return undefined;
      }),
    ]);

    if (sourceResult.sourcedCount > 0) {
      logger.info({ jobId, count: sourceResult.sourcedCount }, "Orchestrator: sourcing complete, now ranking");

      await rankingAgent.rankCandidatesForJob(jobId, employerId);

      await outreachAgent.batchOutreach({
        employerId,
        jobId,
        candidateIds: [],
        stage: "sourcing",
      });
    }
  }

  private async handleCandidateApplied(event: RecruitmentEvent): Promise<void> {
    const { jobId, candidateId, employerId } = event.payload as { jobId: number; candidateId: number; employerId: number };
    logger.info({ jobId, candidateId }, "Orchestrator: candidate applied — ranking");

    await rankingAgent.rankCandidatesForJob(jobId, employerId);

    await outreachAgent.generateMessage({
      employerId,
      candidateId,
      jobId,
      stage: "applied",
    });
  }

  private async handleInterviewMissed(event: RecruitmentEvent): Promise<void> {
    const { jobId, candidateId, employerId } = event.payload as { jobId: number; candidateId: number; employerId: number };
    logger.info({ jobId, candidateId }, "Orchestrator: interview missed — sending follow-up");

    await outreachAgent.generateMessage({
      employerId,
      candidateId,
      jobId,
      stage: "followup",
      customNotes: "Candidate missed scheduled interview. Politely reschedule.",
    });
  }

  private async handleCandidateGhosted(event: RecruitmentEvent): Promise<void> {
    const { jobId, candidateId, employerId } = event.payload as { jobId: number; candidateId: number; employerId: number };

    await recruitmentMemory.recordHiringOutcome({
      employerId,
      candidateId,
      jobId,
      outcome: "ghosted",
      reason: "Candidate stopped responding",
      skills: [],
      createdAt: new Date(),
    });

    await outreachAgent.generateMessage({
      employerId,
      candidateId,
      jobId,
      stage: "followup",
      customNotes: "Final follow-up before closing the application.",
    });
  }

  private logAllEvents(event: RecruitmentEvent): void {
    logger.debug({ eventType: event.type, source: event.source }, "Agent event");
  }

  async getSystemStatus(): Promise<{
    active: boolean;
    recentEvents: number;
    registeredHandlers: string[];
  }> {
    return {
      active: this.active,
      recentEvents: eventBus.getRecentEvents().length,
      registeredHandlers: [
        RecruitmentEventTypes.JOB_POSTED,
        RecruitmentEventTypes.CANDIDATE_APPLIED,
        RecruitmentEventTypes.INTERVIEW_MISSED,
        RecruitmentEventTypes.CANDIDATE_GHOSTED,
      ],
    };
  }

  async triggerPipeline(params: { jobId: number; employerId: number }): Promise<{
    sourcing: { sourcedCount: number };
    ranking: { rankedCount: number };
  }> {
    const sourcing = await sourcingAgent.sourceForJob(params.jobId, params.employerId);
    const ranking = await rankingAgent.rankCandidatesForJob(params.jobId, params.employerId);
    return { sourcing, ranking };
  }
}

export const orchestrator = new AgentOrchestrator();
