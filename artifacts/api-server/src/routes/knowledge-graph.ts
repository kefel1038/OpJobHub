import { Router, type Request, type Response } from "express";
import { authMiddleware, requireRole } from "../lib/auth";
import { verifyNeo4jConnection, closeNeo4j } from "../lib/neo4j";
import { graphBuilder } from "../services/graph/graph-builder";
import { graphSync } from "../services/graph/graph-sync";
import { graphQueryEngine } from "../services/graph/query-engine";
import { graphRecommendation } from "../services/graph/graph-recommendation";
import { migrationIntelligence } from "../services/graph/migration-intelligence";
import { graphRag } from "../services/graph/graph-rag";
import { getQueue, QueueNames } from "../lib/queue";
import { dispatchGraphSync } from "../services/queue/pipeline-worker";
import { graphEvolutionService } from "../services/graph/graph-evolution";

const router = Router();
const requireEmployer = requireRole("employer", "admin");

// ─── Connection & Status ─────────────────────────────────────────

router.get("/graph/status", authMiddleware, requireEmployer, async (_req: Request, res: Response) => {
  try {
    const connected = await verifyNeo4jConnection();
    const status = connected ? await graphSync.getSyncStatus() : { isSyncing: false, nodeCounts: {} };
    res.json({ connected, ...status });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/graph/queues", authMiddleware, requireEmployer, async (_req: Request, res: Response) => {
  try {
    const statuses: Record<string, any> = {};
    if (process.env.REDIS_URL) {
      for (const qName of Object.values(QueueNames)) {
        const q = getQueue(qName as QueueNames);
        const jobCounts = await q.getJobCounts();
        statuses[qName] = jobCounts;
      }
    }
    res.json({ redisEnabled: !!process.env.REDIS_URL, queues: statuses });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// ─── Sync ────────────────────────────────────────────────────────

router.post("/graph/sync", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const useQueue = req.query.queue === "true" && !!process.env.REDIS_URL;
    if (useQueue) {
      await dispatchGraphSync();
      res.json({ status: "queued", message: "Graph sync dispatched to BullMQ worker" });
    } else {
      const counts = await graphSync.syncAll();
      res.json({ status: "synced", counts });
    }
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.post("/graph/sync/candidate/:id", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const candidateId = Number(req.params.id);
    const { skills } = req.body ?? {};
    const count = await graphSync.syncCandidateSkillRelations(candidateId, skills || []);
    res.json({ synced: count });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// ─── Queries ─────────────────────────────────────────────────────

router.post("/graph/query", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const { matchLabels, whereConditions, returnFields, orderBy, limit, skip, params } = req.body ?? {};
    const result = await graphQueryEngine.executeQuery({
      matchLabels, whereConditions, returnFields, orderBy, limit, skip, params,
    });
    res.json({ records: result });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.post("/graph/query/cypher", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const { query, params } = req.body ?? {};
    if (!query) {
      res.status(400).json({ error: "query is required" });
      return;
    }
    const result = await graphQueryEngine.executeRawCypher(query, params);
    res.json({ records: result.records, summary: { counters: result.summary?.counters } });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// ─── Hidden Gems & Skill Adjacency ───────────────────────────────

router.post("/graph/hidden-gems", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const { skills, location, limit } = req.body ?? {};
    if (!skills || !Array.isArray(skills)) {
      res.status(400).json({ error: "skills array is required" });
      return;
    }
    const gems = await graphQueryEngine.findHiddenGems(skills, location, limit || 20);
    res.json({ gems });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/graph/skill-adjacency", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const skill = req.query.skill as string;
    if (!skill) {
      res.status(400).json({ error: "skill is required" });
      return;
    }
    const adjacency = await graphQueryEngine.skillAdjacency(skill);
    res.json({ adjacency });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/graph/career-transitions", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const role = req.query.role as string;
    if (!role) {
      res.status(400).json({ error: "role is required" });
      return;
    }
    const transitions = await graphQueryEngine.careerTransitions(role);
    res.json({ transitions });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// ─── Recommendations ─────────────────────────────────────────────

router.post("/graph/recommend/job", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const { jobTitle, skills, location, limit } = req.body ?? {};
    if (!jobTitle || !skills) {
      res.status(400).json({ error: "jobTitle and skills are required" });
      return;
    }
    const recommendations = await graphRecommendation.recommendCandidatesForJob(jobTitle, skills, location, limit || 20);
    res.json({ recommendations });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.post("/graph/hidden-talent", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const { requiredSkills, adjacentSkills, limit } = req.body ?? {};
    if (!requiredSkills || !adjacentSkills) {
      res.status(400).json({ error: "requiredSkills and adjacentSkills are required" });
      return;
    }
    const talent = await graphRecommendation.hiddenTalentDiscovery(requiredSkills, adjacentSkills, limit || 15);
    res.json({ talent });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/graph/similar-hires/:candidateId", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const candidateId = String(req.params.candidateId);
    const limit = parseInt(req.query.limit as string) || 10;
    const similar = await graphRecommendation.similarHires(candidateId, limit);
    res.json({ similar });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.post("/graph/multi-hop-query", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const { skills, location, industry, certification, currentEmployer, intentType, minSkills, limit } = req.body ?? {};
    const result = await graphRecommendation.multiHopTalentQuery({
      skills, location, industry, certification, currentEmployer, intentType, minSkills, limit,
    });
    res.json({ result });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// ─── Migration Intelligence ──────────────────────────────────────

router.get("/graph/migration-flows", authMiddleware, requireEmployer, async (_req: Request, res: Response) => {
  try {
    const flows = await migrationIntelligence.getMigrationFlows();
    res.json({ flows });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/graph/labor-hotspots", authMiddleware, requireEmployer, async (_req: Request, res: Response) => {
  try {
    const hotspots = await migrationIntelligence.getLaborHotspots();
    res.json({ hotspots });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/graph/talent-export-clusters", authMiddleware, requireEmployer, async (_req: Request, res: Response) => {
  try {
    const clusters = await migrationIntelligence.getTalentExportClusters();
    res.json({ clusters });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/graph/gcc-migration-analysis", authMiddleware, requireEmployer, async (_req: Request, res: Response) => {
  try {
    const analysis = await migrationIntelligence.getGCCMigrationAnalysis();
    res.json(analysis);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/graph/skill-gap", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const location = req.query.location as string;
    const industry = req.query.industry as string | undefined;
    if (!location) {
      res.status(400).json({ error: "location is required" });
      return;
    }
    const gap = await migrationIntelligence.getSkillGapByLocation(location, industry);
    res.json(gap);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/graph/migration-pathways", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const fromLocation = req.query.from as string;
    const toLocation = req.query.to as string;
    if (!fromLocation || !toLocation) {
      res.status(400).json({ error: "from and to locations are required" });
      return;
    }
    const pathways = await migrationIntelligence.getMigrationPathways(fromLocation, toLocation);
    res.json(pathways);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// ─── GraphRAG ────────────────────────────────────────────────────

router.post("/graph/rag/chat", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const { message, skills, location, industry, employerId, depth } = req.body ?? {};
    if (!message) {
      res.status(400).json({ error: "message is required" });
      return;
    }
    const result = await graphRag.chat(message, { skills, location, industry, employerId, depth });
    res.json(result);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.post("/graph/rag/reason", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const { question } = req.body ?? {};
    if (!question) {
      res.status(400).json({ error: "question is required" });
      return;
    }
    const result = await graphRag.multiHopReasoning(question);
    res.json(result);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// ─── Graph Evolution ─────────────────────────────────────────────

router.post("/graph/evolution/snapshot", authMiddleware, requireEmployer, async (_req: Request, res: Response) => {
  try {
    const snapshot = await graphEvolutionService.takeSnapshot();
    res.json({ status: "snapshot_taken", snapshot });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/graph/evolution/history", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const history = await graphEvolutionService.getEvolutionHistory(days);
    res.json({ history });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/graph/evolution/trends", authMiddleware, requireEmployer, async (_req: Request, res: Response) => {
  try {
    const trends = await graphEvolutionService.getGrowthTrends();
    res.json(trends);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/graph/evolution/hotspots", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 60;
    const hotspots = await graphEvolutionService.getHotspotEvolution(days);
    res.json({ hotspots });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/graph/evolution/latest", authMiddleware, requireEmployer, async (_req: Request, res: Response) => {
  try {
    const snapshot = await graphEvolutionService.getLatestSnapshot();
    res.json({ snapshot });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// ─── Node/Edge Management ────────────────────────────────────────

router.post("/graph/node", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const { labels, properties } = req.body ?? {};
    if (!labels || !properties) {
      res.status(400).json({ error: "labels and properties are required" });
      return;
    }
    await graphBuilder.upsertNode(labels, properties);
    res.json({ status: "created" });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.post("/graph/relation", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const { type, fromLabels, fromMatch, toLabels, toMatch, properties } = req.body ?? {};
    if (!type || !fromLabels || !fromMatch || !toLabels || !toMatch) {
      res.status(400).json({ error: "type, fromLabels, fromMatch, toLabels, toMatch are required" });
      return;
    }
    await graphBuilder.createRelation({ type, fromLabels, fromMatch, toLabels, toMatch, properties });
    res.json({ status: "created" });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// ─── Discovery — Talent Cluster ──────────────────────────────────

router.post("/graph/talent-cluster", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const { skills, limit } = req.body ?? {};
    if (!skills) {
      res.status(400).json({ error: "skills array is required" });
      return;
    }
    const clusters = await graphQueryEngine.talentClusterQuery(skills, limit || 30);
    res.json({ clusters });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

export default router;
