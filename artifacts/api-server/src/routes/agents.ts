import { Router, type Request, type Response } from "express";
import { authMiddleware, requireRole } from "../lib/auth";
import { logger } from "../lib/logger";
import { orchestrator } from "../services/agents/orchestrator";
import { eventBus, RecruitmentEventTypes, type RecruitmentEvent } from "../services/agents/event-bus";
import { recruitmentMemory } from "../services/agents/memory";
import { sourcingAgent } from "../services/agents/sourcing-agent";
import { rankingAgent } from "../services/agents/ranking-agent";
import { outreachAgent } from "../services/agents/outreach-agent";
import { signalCollector } from "../services/agents/behavioral-signals";
import { preferenceEmbedder } from "../services/agents/preference-embedder";
import { reasoningEngine } from "../services/agents/reasoning-engine";
import { approvalManager } from "../services/agents/approval-manager";
import { safetyEngine } from "../services/agents/safety-engine";
import { observabilityService } from "../services/agents/observability-service";
import { overrideLearner } from "../services/agents/override-learner";
import { sourceManager } from "../services/agents/source-manager";
import { discoveryAgent } from "../services/agents/discovery-agent";
import { enrichmentAgent } from "../services/agents/enrichment-agent";
import { verificationAgent } from "../services/agents/verification-agent";
import { relevanceAgent as relevanceAgentService } from "../services/agents/relevance-agent";
import { intentDetector } from "../services/agents/intent-detector";
import { opportunityGraph } from "../services/agents/opportunity-graph";
import { continuousPipeline } from "../services/agents/continuous-pipeline";

const router = Router();
const requireEmployer = requireRole("employer", "admin");

// ─── System Management ──────────────────────────────────────────

router.post("/agents/start", authMiddleware, requireEmployer, async (_req: Request, res: Response) => {
  try {
    orchestrator.start();
    res.json({ status: "started", message: "Agent orchestrator is now active" });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.post("/agents/stop", authMiddleware, requireEmployer, async (_req: Request, res: Response) => {
  try {
    orchestrator.stop();
    res.json({ status: "stopped", message: "Agent orchestrator stopped" });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/agents/status", authMiddleware, requireEmployer, async (_req: Request, res: Response) => {
  try {
    const status = await orchestrator.getSystemStatus();
    res.json(status);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// ─── Agent-Specific Endpoints ────────────────────────────────────

router.post("/agents/sourcing/run", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const { jobId } = req.body ?? {};
    if (!jobId) {
      res.status(400).json({ error: "jobId is required" });
      return;
    }
    const employerId = req.user!.id;
    const result = await sourcingAgent.sourceForJob(jobId, employerId);
    res.json(result);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.post("/agents/ranking/run", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const { jobId } = req.body ?? {};
    if (!jobId) {
      res.status(400).json({ error: "jobId is required" });
      return;
    }
    const employerId = req.user!.id;
    const result = await rankingAgent.rankCandidatesForJob(jobId, employerId);
    res.json(result);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.post("/agents/outreach/generate", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const { candidateId, jobId, stage, customNotes } = req.body ?? {};
    if (!candidateId || !jobId || !stage) {
      res.status(400).json({ error: "candidateId, jobId, and stage are required" });
      return;
    }
    const employerId = req.user!.id;
    const result = await outreachAgent.generateMessage({ employerId, candidateId, jobId, stage, customNotes });
    res.json(result);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.post("/agents/pipeline/run", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const { jobId } = req.body ?? {};
    if (!jobId) {
      res.status(400).json({ error: "jobId is required" });
      return;
    }
    const employerId = req.user!.id;
    const result = await orchestrator.triggerPipeline({ jobId, employerId });
    res.json(result);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// ─── Memory System ─────────────────────────────────────────────

router.get("/agents/memory", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const employerId = req.user!.id;
    const [prefs, patterns] = await Promise.all([
      recruitmentMemory.getPreferences(employerId),
      recruitmentMemory.getHiringPatterns(employerId),
    ]);
    res.json({ preferences: prefs, patterns });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.post("/agents/memory/preference", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const employerId = req.user!.id;
    const { key, value, confidence } = req.body ?? {};
    if (!key || !value) {
      res.status(400).json({ error: "key and value are required" });
      return;
    }
    await recruitmentMemory.storePreference(employerId, key, value, confidence || 0.8, "manual");
    res.json({ status: "stored" });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// ─── Event Log ──────────────────────────────────────────────────

router.get("/agents/events", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const type = req.query.type as string | undefined;
    const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
    const events = eventBus.getRecentEvents(type, limit);
    res.json({ events });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// ─── Fire Custom Event ──────────────────────────────────────────

router.post("/agents/events/fire", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const { type, payload } = req.body ?? {};
    if (!type || !payload) {
      res.status(400).json({ error: "type and payload are required" });
      return;
    }
    const event: RecruitmentEvent = {
      type,
      source: "manual",
      payload,
      timestamp: new Date(),
    };
    await eventBus.emitEvent(event);
    res.json({ status: "fired", type });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// ─── Adaptive Intelligence — Behavioral Signals ─────────────────

router.post("/agents/signals/record", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const employerId = req.user!.id;
    const { actionType, candidateId, jobId, metadata } = req.body ?? {};
    if (!actionType) {
      res.status(400).json({ error: "actionType is required" });
      return;
    }
    await signalCollector.record({ employerId, actionType, candidateId, jobId, metadata });
    const contradiction = await recruitmentMemory.detectContradictions(employerId, "", "", 0);
    res.json({ status: "recorded", contradiction });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/agents/signals", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const employerId = req.user!.id;
    const limit = Math.min(200, parseInt(req.query.limit as string) || 100);
    const offset = parseInt(req.query.offset as string) || 0;
    const signals = await signalCollector.getSignals(employerId, limit, offset);
    const total = await signalCollector.getSignalCount(employerId);
    res.json({ signals, total });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// ─── Adaptive Intelligence — Preference Inference ───────────────

router.post("/agents/preferences/infer", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const employerId = req.user!.id;
    const suggestions = await signalCollector.inferPreferences(employerId);
    res.json({ inferred: suggestions.length, suggestions });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/agents/preferences/inferred", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const employerId = req.user!.id;
    const activeOnly = req.query.active_only !== "false";
    const preferences = await signalCollector.getInferredPreferences(employerId, activeOnly);
    res.json({ preferences });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.post("/agents/preferences/decay", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const employerId = req.user!.id;
    const decayed = await signalCollector.decayStalePreferences(employerId);
    res.json({ status: "decayed", count: decayed });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/agents/preferences/summary", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const employerId = req.user!.id;
    const summary = await signalCollector.getPreferenceSummary(employerId);
    res.json(summary);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/agents/preferences/consolidated", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const employerId = req.user!.id;
    const profile = await recruitmentMemory.getConsolidatedProfile(employerId);
    res.json(profile);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// ─── Adaptive Intelligence — Preference Embeddings ──────────────

router.post("/agents/embeddings/generate", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const employerId = req.user!.id;
    const { key, value } = req.body ?? {};
    if (key && value) {
      const success = await preferenceEmbedder.storeEmbedding(employerId, key, value);
      res.json({ status: success ? "embedded" : "failed" });
    } else {
      const count = await preferenceEmbedder.embedAllActivePreferences(employerId);
      res.json({ status: "embedded", count });
    }
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// ─── Phase 5B: Agent Reasoning Logs ──────────────────────────────

router.post("/agents/reasoning/record", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const employerId = req.user!.id;
    const { decisionType, agentType, targetId, targetType, score, confidence, reasoning, inputContext, metadata } = req.body ?? {};
    if (!decisionType || !agentType) {
      res.status(400).json({ error: "decisionType and agentType are required" });
      return;
    }
    const id = await reasoningEngine.recordDecision(employerId, {
      decisionType, agentType, targetId, targetType, score, confidence, reasoning, inputContext, metadata,
    });
    res.json({ id, status: "recorded" });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/agents/reasoning", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const employerId = req.user!.id;
    const limit = Math.min(200, parseInt(req.query.limit as string) || 50);
    const offset = parseInt(req.query.offset as string) || 0;
    const logs = await reasoningEngine.getDecisionLog(employerId, limit, offset);
    res.json({ logs, total: logs.length });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/agents/reasoning/target", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const employerId = req.user!.id;
    const targetId = parseInt(req.query.targetId as string);
    const targetType = req.query.targetType as string;
    if (!targetId || !targetType) {
      res.status(400).json({ error: "targetId and targetType are required" });
      return;
    }
    const logs = await reasoningEngine.getDecisionsForTarget(employerId, targetId, targetType);
    res.json({ logs });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/agents/reasoning/explain", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const employerId = req.user!.id;
    const candidateId = parseInt(req.query.candidateId as string);
    const jobId = parseInt(req.query.jobId as string);
    if (!candidateId || !jobId) {
      res.status(400).json({ error: "candidateId and jobId are required" });
      return;
    }
    const explanation = await reasoningEngine.explainRanking(employerId, candidateId, jobId);
    res.json({ explanation });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// ─── Phase 5B: Approval Workflows ────────────────────────────────

router.post("/agents/approvals/submit", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const employerId = req.user!.id;
    const { actionType, targetId, targetType, aiSuggestion, confidence, reasoning } = req.body ?? {};
    if (!actionType || confidence === undefined) {
      res.status(400).json({ error: "actionType and confidence are required" });
      return;
    }
    const result = await approvalManager.submit({ employerId, actionType, targetId, targetType, aiSuggestion, confidence, reasoning });
    res.json(result);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.post("/agents/approvals/:id/approve", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const approvalId = Number(req.params.id);
    const approvedBy = req.user!.id;
    const success = await approvalManager.approve(approvalId, approvedBy);
    res.json({ status: success ? "approved" : "not_found" });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.post("/agents/approvals/:id/reject", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const approvalId = Number(req.params.id);
    const approvedBy = req.user!.id;
    const { reason } = req.body ?? {};
    const success = await approvalManager.reject(approvalId, approvedBy, reason || "No reason provided");
    res.json({ status: success ? "rejected" : "not_found" });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/agents/approvals/pending", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const employerId = req.user!.id;
    const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
    const approvals = await approvalManager.getPendingApprovals(employerId, limit);
    const stats = await approvalManager.getApprovalStats(employerId);
    res.json({ approvals, stats });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/agents/approvals/history", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const employerId = req.user!.id;
    const limit = Math.min(200, parseInt(req.query.limit as string) || 50);
    const history = await approvalManager.getApprovalHistory(employerId, limit);
    res.json({ history });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/agents/approvals/stats", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const employerId = req.user!.id;
    const stats = await approvalManager.getApprovalStats(employerId);
    res.json(stats);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/agents/approvals/threshold", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const employerId = req.user!.id;
    const threshold = await approvalManager.getConfidenceThreshold(employerId);
    res.json({ threshold });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.post("/agents/approvals/threshold", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const employerId = req.user!.id;
    const { threshold } = req.body ?? {};
    if (threshold === undefined || threshold < 0 || threshold > 1) {
      res.status(400).json({ error: "threshold must be between 0 and 1" });
      return;
    }
    await approvalManager.setConfidenceThreshold(employerId, threshold);
    res.json({ status: "updated", threshold });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// ─── Phase 5B: Override Events ───────────────────────────────────

router.get("/agents/overrides", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const employerId = req.user!.id;
    const limit = Math.min(200, parseInt(req.query.limit as string) || 50);
    const overrides = await overrideLearner.getOverrideHistory(employerId, limit);
    const patterns = await overrideLearner.getOverridePatterns(employerId);
    res.json({ overrides, patterns });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/agents/overrides/blind-spots", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const employerId = req.user!.id;
    const blindSpots = await overrideLearner.analyzeBlindSpots(employerId);
    res.json({ blindSpots });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// ─── Phase 5B: Safety Flags ─────────────────────────────────────

router.get("/agents/safety/flags", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const employerId = req.user!.id;
    const severity = req.query.severity as string | undefined;
    const activeOnly = req.query.active_only !== "false";
    const flags = activeOnly
      ? await safetyEngine.getActiveFlags(employerId, severity)
      : await safetyEngine.getAllFlags(employerId, parseInt(req.query.limit as string) || 50);
    const summary = await safetyEngine.getSafetySummary(employerId);
    res.json({ flags, summary });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.post("/agents/safety/flags/:id/resolve", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const flagId = Number(req.params.id);
    const success = await safetyEngine.resolveFlag(flagId);
    res.json({ status: success ? "resolved" : "not_found" });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// ─── Phase 5B: Observability Dashboard ──────────────────────────

router.get("/agents/observability/dashboard", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const employerId = req.user!.id;
    const dashboard = await observabilityService.getDashboard(employerId);
    res.json(dashboard);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/agents/observability/health", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const employerId = req.user!.id;
    const health = await observabilityService.getAgentHealth(employerId);
    res.json(health);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/agents/observability/decisions", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const employerId = req.user!.id;
    const analytics = await observabilityService.getDecisionAnalytics(employerId);
    res.json(analytics);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/agents/observability/metrics", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const employerId = req.user!.id;
    const agentType = req.query.agentType as string | undefined;
    const metricName = req.query.metricName as string | undefined;
    const limit = parseInt(req.query.limit as string) || 100;
    const metrics = await observabilityService.getMetrics({ employerId, agentType, metricName, limit });
    res.json({ metrics });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// ─── Phase 6A: Autonomous Sourcing Infrastructure ───────────────

// ─── Source Management ──────────────────────────────────────────

router.post("/agents/sources/initialize", authMiddleware, requireEmployer, async (_req: Request, res: Response) => {
  try {
    await sourceManager.initializeDefaultSources();
    res.json({ status: "initialized" });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/agents/sources", authMiddleware, requireEmployer, async (_req: Request, res: Response) => {
  try {
    const sources = await sourceManager.getAllSources();
    res.json({ sources });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.post("/agents/sources/register", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const { name, displayName, type, baseUrl, rateLimitPerHour, config } = req.body ?? {};
    if (!name || !displayName || !type) {
      res.status(400).json({ error: "name, displayName, and type are required" });
      return;
    }
    const id = await sourceManager.registerSource({ name, displayName, type, baseUrl, rateLimitPerHour, config });
    res.json({ id, status: "registered" });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.post("/agents/sources/:id/toggle", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const sourceId = Number(req.params.id);
    const { active } = req.body ?? {};
    await sourceManager.setActive(sourceId, active);
    res.json({ status: active ? "activated" : "deactivated" });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// ─── Discovery Agent ────────────────────────────────────────────

router.post("/agents/discovery/run", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const employerId = req.user!.id;
    const { sources, skills, roles, locations } = req.body ?? {};
    const result = await discoveryAgent.discoverCandidates({ employerId, sources, skills, roles, locations });
    res.json(result);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.post("/agents/discovery/ai-generate", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const employerId = req.user!.id;
    const { jobId, sourceFilter } = req.body ?? {};
    if (!jobId) {
      res.status(400).json({ error: "jobId is required" });
      return;
    }
    const result = await discoveryAgent.discoverFromAi({ employerId, jobId, sourceFilter });
    res.json(result);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/agents/discovery/candidates", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const employerId = req.user!.id;
    const limit = Math.min(100, parseInt(req.query.limit as string) || 50);
    const offset = parseInt(req.query.offset as string) || 0;
    const status = req.query.status as string | undefined;
    const result = await discoveryAgent.getDiscoveredCandidates({ employerId, status, limit, offset });
    res.json(result);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// ─── Enrichment Agent ───────────────────────────────────────────

router.post("/agents/enrichment/run", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const { candidateId } = req.body ?? {};
    if (!candidateId) {
      res.status(400).json({ error: "candidateId is required" });
      return;
    }
    const result = await enrichmentAgent.enrichCandidate(candidateId);
    res.json(result || { error: "Enrichment failed" });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/agents/enrichment/:candidateId", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const candidateId = Number(req.params.candidateId);
    const enrichments = await enrichmentAgent.getEnrichments(candidateId);
    res.json({ enrichments });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.post("/agents/enrichment/batch", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const { candidateIds } = req.body ?? {};
    if (!candidateIds || !Array.isArray(candidateIds)) {
      res.status(400).json({ error: "candidateIds array is required" });
      return;
    }
    const enriched = await enrichmentAgent.batchEnrich(candidateIds);
    res.json({ enriched });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// ─── Verification Agent ─────────────────────────────────────────

router.post("/agents/verification/run", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const { candidateId } = req.body ?? {};
    if (!candidateId) {
      res.status(400).json({ error: "candidateId is required" });
      return;
    }
    const result = await verificationAgent.verifyCandidate(candidateId);
    res.json(result || { error: "Verification failed" });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// ─── Relevance Matching ─────────────────────────────────────────

router.post("/agents/relevance/match", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const employerId = req.user!.id;
    const { candidateId, jobId } = req.body ?? {};
    if (!candidateId || !jobId) {
      res.status(400).json({ error: "candidateId and jobId are required" });
      return;
    }
    const result = await relevanceAgentService.matchCandidateToJob(candidateId, jobId, employerId);
    res.json(result || { error: "Matching failed" });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.post("/agents/relevance/best-for-job", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const employerId = req.user!.id;
    const { jobId, limit } = req.body ?? {};
    if (!jobId) {
      res.status(400).json({ error: "jobId is required" });
      return;
    }
    const matches = await relevanceAgentService.findBestMatchesForJob(jobId, employerId, limit || 20);
    res.json({ matches });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// ─── Intent Detection ───────────────────────────────────────────

router.post("/agents/intent/analyze", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const { candidateId } = req.body ?? {};
    if (!candidateId) {
      res.status(400).json({ error: "candidateId is required" });
      return;
    }
    const analysis = await intentDetector.analyzeCandidateIntent(candidateId);
    res.json(analysis || { error: "Analysis failed" });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/agents/intent/summary", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const employerId = req.user!.id;
    const summary = await intentDetector.getIntentSummary(employerId);
    res.json(summary);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// ─── Opportunity Graph ──────────────────────────────────────────

router.post("/agents/graph/build", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const { candidateId } = req.body ?? {};
    if (!candidateId) {
      res.status(400).json({ error: "candidateId is required" });
      return;
    }
    const edges = await opportunityGraph.buildFromCandidate(candidateId);
    res.json({ edges });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/agents/graph/query", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const relationType = req.query.relationType as string | undefined;
    const relationValue = req.query.relationValue as string | undefined;
    const candidateId = req.query.candidateId ? parseInt(req.query.candidateId as string) : undefined;
    const limit = parseInt(req.query.limit as string) || 50;
    const results = await opportunityGraph.query({ relationType, relationValue, candidateId, limit });
    res.json({ results });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/agents/graph/similar", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const candidateId = parseInt(req.query.candidateId as string);
    const limit = parseInt(req.query.limit as string) || 10;
    if (!candidateId) {
      res.status(400).json({ error: "candidateId is required" });
      return;
    }
    const similar = await opportunityGraph.findSimilarCandidates(candidateId, limit);
    res.json({ similar });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/agents/graph/summary", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const employerId = req.user!.id;
    const summary = await opportunityGraph.getGraphSummary(employerId);
    res.json(summary);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// ─── Continuous Pipeline ────────────────────────────────────────

router.post("/agents/pipeline/full-run", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const employerId = req.user!.id;
    const { jobId, sources, skills, roles, locations, autoEnrich, autoVerify, autoMatch, autoReachOut } = req.body ?? {};
    if (!jobId) {
      res.status(400).json({ error: "jobId is required" });
      return;
    }
    const result = await continuousPipeline.runFullPipeline({
      employerId, jobId, sources, skills, roles, locations,
      autoEnrich: autoEnrich !== false,
      autoVerify: autoVerify !== false,
      autoMatch: autoMatch !== false,
      autoReachOut: autoReachOut === true,
    });
    res.json(result);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/agents/pipeline/history", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const employerId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 20;
    const history = await continuousPipeline.getPipelineHistory(employerId, limit);
    res.json({ history });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

export default router;
