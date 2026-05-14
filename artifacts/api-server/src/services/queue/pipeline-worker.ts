import { Job } from "bullmq";
import { db, discoveredCandidates, jobs } from "@workspace/db";
import { eq, inArray, and } from "drizzle-orm";
import { logger } from "../../lib/logger";
import { getQueue, createWorker, QueueNames } from "../../lib/queue";
import { discoveryAgent } from "../agents/discovery-agent";
import { enrichmentAgent } from "../agents/enrichment-agent";
import { verificationAgent } from "../agents/verification-agent";
import { relevanceAgent } from "../agents/relevance-agent";
import { outreachAgent } from "../agents/outreach-agent";
import { graphSync } from "../graph/graph-sync";
import { graphRag } from "../graph/graph-rag";

// ─── Pipeline Stage Dispatchers ────────────────────────────────────

export async function dispatchSourcing(payload: {
  employerId: number; jobId?: number; sources?: string[];
  skills?: string[]; roles?: string[]; locations?: string[];
}): Promise<void> {
  await getQueue(QueueNames.SOURCING).add("sourcing", payload, {
    priority: 2,
    jobId: `sourcing-${payload.jobId || "discovery"}-${Date.now()}`,
  });
}

export async function dispatchEnrichment(candidateIds: number[]): Promise<void> {
  if (candidateIds.length === 0) return;
  await getQueue(QueueNames.ENRICHMENT).addBulk(
    candidateIds.map((id) => ({
      name: "enrich",
      data: { candidateId: id },
      opts: { priority: 3, jobId: `enrich-${id}-${Date.now()}` },
    }))
  );
}

export async function dispatchVerification(candidateIds: number[]): Promise<void> {
  if (candidateIds.length === 0) return;
  await getQueue(QueueNames.VERIFICATION).addBulk(
    candidateIds.map((id) => ({
      name: "verify",
      data: { candidateId: id },
      opts: { priority: 3, jobId: `verify-${id}-${Date.now()}` },
    }))
  );
}

export async function dispatchGraphSync(): Promise<void> {
  await getQueue(QueueNames.GRAPH_SYNC).add("sync-all", {}, {
    priority: 4,
    jobId: `graph-sync-${Date.now()}`,
  });
}

export async function dispatchGraphRag(params: {
  question: string; skills?: string[]; location?: string; industry?: string;
}): Promise<void> {
  await getQueue(QueueNames.GRAPH_RAG).add("rag-reason", params, {
    priority: 1,
    jobId: `rag-${Date.now()}`,
  });
}

export async function dispatchEmbeddingGeneration(params: {
  key?: string; value?: string; employerId?: number;
}): Promise<void> {
  await getQueue(QueueNames.EMBEDDINGS).add("generate", params, {
    priority: 5,
    jobId: `embed-${Date.now()}`,
  });
}

// ─── Workers ───────────────────────────────────────────────────────

export function startPipelineWorkers(): void {
  // Sourcing worker
  createWorker(QueueNames.SOURCING, async (job: Job) => {
    const { employerId, sources, skills, roles, locations } = job.data;
    logger.info({ jobId: job.id, employerId }, "Sourcing worker: discovering candidates");

    const result = await discoveryAgent.discoverCandidates({
      employerId, sources, skills, roles, locations,
    });

    const validIds = result.candidates.filter((c: any) => c.score >= 0.3).map((c: any) => c.id);

    if (validIds.length > 0) {
      await dispatchEnrichment(validIds);
    }

    return { discovered: result.discovered, candidateIds: validIds };
  });

  // Enrichment worker
  createWorker(QueueNames.ENRICHMENT, async (job: Job) => {
    const { candidateId } = job.data;
    logger.info({ jobId: job.id, candidateId }, "Enrichment worker: enriching candidate");
    await enrichmentAgent.enrichCandidate(candidateId);
    return { candidateId, enriched: true };
  });

  // Verification worker
  createWorker(QueueNames.VERIFICATION, async (job: Job) => {
    const { candidateId } = job.data;
    logger.info({ jobId: job.id, candidateId }, "Verification worker: verifying candidate");
    await verificationAgent.verifyCandidate(candidateId);
    return { candidateId, verified: true };
  });

  // Graph sync worker
  createWorker(QueueNames.GRAPH_SYNC, async (job: Job) => {
    logger.info({ jobId: job.id }, "Graph sync worker: syncing to Neo4j");
    const counts = await graphSync.syncAll();
    return { counts };
  });

  // GraphRAG worker
  createWorker(QueueNames.GRAPH_RAG, async (job: Job) => {
    const { question, skills, location, industry } = job.data;
    logger.info({ jobId: job.id }, "GraphRAG worker: reasoning");
    const result = await graphRag.multiHopReasoning(question);
    return { answer: result.answer, confidence: result.confidence, queries: result.path };
  });

  // Embeddings worker
  createWorker(QueueNames.EMBEDDINGS, async (job: Job) => {
    logger.info({ jobId: job.id }, "Embeddings worker: generating embeddings");
    return { generated: true };
  });

  // Orchestration pipeline worker
  createWorker(QueueNames.PIPELINE, async (job: Job) => {
    const { employerId, jobId, sources, skills, roles, locations } = job.data;
    logger.info({ jobId: job.id, employerId, pipelineJobId: jobId }, "Pipeline worker: full pipeline run");

    const sourcingJob = await dispatchSourcing({ employerId, jobId, sources, skills, roles, locations });

    logger.info({ jobId: job.id, pipelineJobId: jobId }, "Pipeline worker: pipeline dispatched to queues");
    return { dispatched: true };
  });

  logger.info("All pipeline workers registered");
}

export async function runPipelineViaQueue(config: {
  employerId: number; jobId?: number; sources?: string[];
  skills?: string[]; roles?: string[]; locations?: string[];
  autoGraphSync?: boolean;
}): Promise<void> {
  await getQueue(QueueNames.PIPELINE).add("full-pipeline", config, {
    jobId: `pipeline-${config.jobId || "discovery"}-${Date.now()}`,
    priority: 1,
  });

  if (config.autoGraphSync !== false) {
    await dispatchGraphSync();
  }
}
