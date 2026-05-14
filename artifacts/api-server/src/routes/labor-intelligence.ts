import { Router, type Request, type Response } from "express";
import { authMiddleware, requireRole } from "../lib/auth";
import { laborIntelligenceEngine } from "../services/labor/labor-intelligence-engine";
import { ecosystemMetricsService } from "../services/labor/ecosystem-metrics";
import { skillEconomyAnalyzer } from "../services/labor/skill-economy";
import { workforceFlowAnalyzer } from "../services/labor/workforce-flow";
import { employerIntelligenceService } from "../services/labor/employer-intelligence";

const router = Router();
const requireEmployer = requireRole("employer", "admin");

// ─── Core Intelligence ────────────────────────────────────────

router.post("/labor/refresh", authMiddleware, requireEmployer, async (_req: Request, res: Response) => {
  try {
    const windowDays = parseInt(_req.query.windowDays as string) || 90;
    const summary = await laborIntelligenceEngine.refreshAll(windowDays);
    res.json(summary);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/labor/summary", authMiddleware, requireEmployer, async (_req: Request, res: Response) => {
  try {
    const windowDays = parseInt(_req.query.windowDays as string) || 90;
    const summary = await laborIntelligenceEngine.refreshAll(windowDays);
    res.json(summary);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// ─── Demand & Supply ───────────────────────────────────────────

router.get("/labor/demand", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const windowDays = parseInt(req.query.windowDays as string) || 90;
    const demand = await laborIntelligenceEngine.getDemandIntelligence(windowDays);
    res.json({ demand });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/labor/supply", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const windowDays = parseInt(req.query.windowDays as string) || 90;
    const supply = await laborIntelligenceEngine.getSupplyIntelligence(windowDays);
    res.json({ supply });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// ─── Workforce Flows ───────────────────────────────────────────

router.get("/labor/flows", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const windowDays = parseInt(req.query.windowDays as string) || 90;
    const flowType = req.query.flowType as string | undefined;
    if (flowType) {
      const history = await workforceFlowAnalyzer.getFlowHistory(flowType, parseInt(req.query.limit as string) || 50);
      res.json({ flows: history });
    } else {
      const flows = await laborIntelligenceEngine.getWorkforceFlows(windowDays);
      res.json(flows);
    }
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.post("/labor/flows/refresh", authMiddleware, requireEmployer, async (_req: Request, res: Response) => {
  try {
    const windowDays = parseInt(_req.query.windowDays as string) || 90;
    const flows = await workforceFlowAnalyzer.analyzeAllFlows(windowDays);
    res.json(flows);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// ─── Skill Economy ─────────────────────────────────────────────

router.get("/labor/skills", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const trendType = req.query.trendType as string | undefined;
    const limit = parseInt(req.query.limit as string) || 20;
    const region = req.query.region as string | undefined;
    const industry = req.query.industry as string | undefined;

    if (trendType || region || industry) {
      const skills = await laborIntelligenceEngine.getSkillTrends(trendType, limit, region, industry);
      res.json({ skills });
    } else {
      const windowDays = parseInt(req.query.windowDays as string) || 90;
      const skills = await laborIntelligenceEngine.getSkillEconomy(windowDays);
      res.json({ skills });
    }
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/labor/skills/summary", authMiddleware, requireEmployer, async (_req: Request, res: Response) => {
  try {
    const summary = await laborIntelligenceEngine.getSkillEconomySummary();
    res.json(summary);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/labor/skills/:skillName", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const windowDays = parseInt(req.query.windowDays as string) || 90;
    const result = await skillEconomyAnalyzer.analyzeSkill(req.params.skillName as string, windowDays);
    if (!result) {
      res.status(404).json({ error: "Skill not found" });
      return;
    }
    res.json(result);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.post("/labor/skills/refresh", authMiddleware, requireEmployer, async (_req: Request, res: Response) => {
  try {
    const windowDays = parseInt(_req.query.windowDays as string) || 90;
    const skills = await skillEconomyAnalyzer.analyzeAllSkills(windowDays);
    res.json({ skills, count: skills.length });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// ─── Employer Intelligence ─────────────────────────────────────

router.get("/labor/employers", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const employers = await laborIntelligenceEngine.getTopEmployers(limit);
    res.json({ employers });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/labor/employers/:employerId", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const employerId = parseInt(req.params.employerId as string);
    const windowDays = parseInt(req.query.windowDays as string) || 90;
    const intelligence = await employerIntelligenceService.analyzeEmployer(employerId, windowDays);
    res.json(intelligence);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/labor/employers/:employerId/metrics", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const employerId = parseInt(req.params.employerId as string);
    const limit = parseInt(req.query.limit as string) || 20;
    const metrics = await employerIntelligenceService.getEmployerMetrics(employerId, limit);
    res.json({ metrics });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// ─── Regional Intelligence ─────────────────────────────────────

router.get("/labor/regions", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const region = req.query.region as string | undefined;
    const limit = parseInt(req.query.limit as string) || 10;
    const snapshots = await laborIntelligenceEngine.getRegionalSnapshots(region, limit);
    res.json({ regions: snapshots });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/labor/regions/:region", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const profile = await laborIntelligenceEngine.getRegionalProfile(req.params.region as string);
    res.json(profile);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// ─── Ecosystem Health ──────────────────────────────────────────

router.get("/labor/ecosystem/health", authMiddleware, requireEmployer, async (_req: Request, res: Response) => {
  try {
    const health = await laborIntelligenceEngine.getEcosystemHealth();
    res.json(health);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/labor/metrics", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const metricType = req.query.metricType as string | undefined;
    const region = req.query.region as string | undefined;
    const limit = parseInt(req.query.limit as string) || 50;
    const history = await laborIntelligenceEngine.getMetricsHistory(metricType, region, limit);
    res.json({ metrics: history });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

export default router;
