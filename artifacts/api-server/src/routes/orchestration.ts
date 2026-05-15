import { Router, type Request, type Response } from "express";
import { authMiddleware, requireRole } from "../lib/auth";
import { workforceOrchestrator } from "../services/labor/workforce-orchestrator";
import { marketBalancer } from "../services/labor/market-balancer";
import { interventionEngine } from "../services/labor/intervention-engine";
import { digitalTwinService } from "../services/labor/digital-twin";
import { upskillingEngine } from "../services/labor/upskilling-engine";
import { economicSignalEngine } from "../services/labor/economic-signal-engine";

const router = Router();
const requireEmployer = requireRole("employer", "admin");

// ─── Orchestration Core ────────────────────────────────────

router.post("/orchestrate/run", authMiddleware, requireEmployer, async (_req: Request, res: Response) => {
  try {
    const summary = await workforceOrchestrator.assessAndOrchestrate();
    res.json(summary);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/orchestrate/summary", authMiddleware, requireEmployer, async (_req: Request, res: Response) => {
  try {
    const summary = await workforceOrchestrator.assessAndOrchestrate();
    res.json(summary);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// ─── Ecosystem Alerts ──────────────────────────────────────

router.get("/orchestrate/alerts", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const activeOnly = req.query.activeOnly !== "false";
    const limit = parseInt(req.query.limit as string) || 30;
    const alerts = await workforceOrchestrator.getAlerts(activeOnly, limit);
    res.json({ alerts });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.post("/orchestrate/alerts/:id/resolve", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    await workforceOrchestrator.resolveAlert(parseInt(req.params.id as string));
    res.json({ success: true });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// ─── Orchestrator Actions ───────────────────────────────────

router.get("/orchestrate/actions", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 30;
    const actions = await workforceOrchestrator.getActions(limit);
    res.json({ actions });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// ─── Market Balance ─────────────────────────────────────────

router.get("/orchestrate/balance", authMiddleware, requireEmployer, async (_req: Request, res: Response) => {
  try {
    const balances = await marketBalancer.assessAllBalances();
    res.json({ balances });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/orchestrate/balance/role/:role", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const region = req.query.region as string | undefined;
    const balance = await marketBalancer.assessRoleBalance(req.params.role as string, region);
    res.json(balance);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/orchestrate/balance/corridor", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const source = req.query.source as string;
    const destination = req.query.destination as string;
    if (!source || !destination) {
      res.status(400).json({ error: "source and destination query params are required" });
      return;
    }
    const balance = await marketBalancer.assessCorridorBalance(source, destination);
    res.json(balance);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/orchestrate/balance/history", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const history = await marketBalancer.getBalanceHistory(limit);
    res.json({ history });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// ─── Interventions ─────────────────────────────────────────

router.get("/orchestrate/interventions", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string | undefined;
    const interventions = await interventionEngine.getInterventions(limit, status);
    res.json({ interventions });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/orchestrate/interventions/:id", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const intervention = await interventionEngine.getInterventionById(parseInt(req.params.id as string));
    if (!intervention) {
      res.status(404).json({ error: "Intervention not found" });
      return;
    }
    res.json(intervention);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.post("/orchestrate/interventions/:id/status", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const { status } = req.body ?? {};
    if (!status) {
      res.status(400).json({ error: "status is required" });
      return;
    }
    await interventionEngine.updateInterventionStatus(parseInt(req.params.id as string), status);
    res.json({ success: true });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// ─── Digital Twin ──────────────────────────────────────────

router.post("/orchestrate/twin/create", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const { name, description, modelType, targetType, targetId, configuration } = req.body ?? {};
    if (!name || !modelType) {
      res.status(400).json({ error: "name and modelType are required" });
      return;
    }
    const result = await digitalTwinService.createModel({ name, description, modelType, targetType, targetId, configuration });
    res.json(result);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.post("/orchestrate/twin/:id/simulate", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const scenarioParams = req.body?.scenarioParams;
    const result = await digitalTwinService.simulateModel(id, scenarioParams);
    if (!result) {
      res.status(404).json({ error: "Digital twin model not found" });
      return;
    }
    res.json(result);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.post("/orchestrate/twin/simulate-ecosystem", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const { demandShift, supplyShift, migrationImpact, sponsorshipChange, wageGrowth, automationImpact, horizon } = req.body ?? {};
    const result = await digitalTwinService.simulateEcosystem({
      demandShift, supplyShift, migrationImpact, sponsorshipChange, wageGrowth, automationImpact, horizon,
    });
    res.json(result);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/orchestrate/twin/models", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const modelType = req.query.modelType as string | undefined;
    const models = await digitalTwinService.getModels(modelType);
    res.json({ models });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/orchestrate/twin/models/:id", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const model = await digitalTwinService.getModelById(parseInt(req.params.id as string));
    if (!model) {
      res.status(404).json({ error: "Digital twin model not found" });
      return;
    }
    res.json(model);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// ─── Upskilling ────────────────────────────────────────────

router.get("/orchestrate/upskilling/pathways/:skill", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const pathways = await upskillingEngine.findAdjacentUpskillingPathways(req.params.skill as string);
    res.json({ pathways });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/orchestrate/upskilling/recommendations/:candidateId", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const candidateId = parseInt(req.params.candidateId as string);
    const recommendations = await upskillingEngine.generateRecommendations(candidateId);
    res.json({ recommendations });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/orchestrate/upskilling/recommendations", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const candidateId = req.query.candidateId ? parseInt(req.query.candidateId as string) : undefined;
    const limit = parseInt(req.query.limit as string) || 20;
    const recommendations = await upskillingEngine.getRecommendations(candidateId, limit);
    res.json({ recommendations });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/orchestrate/upskilling/certifications/:skill", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const certifications = await upskillingEngine.recommendCertifications(req.params.skill as string);
    res.json({ certifications });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// ─── Economic Signals ──────────────────────────────────────

router.post("/orchestrate/signals/record", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const { signalType, signalName, signalValue, previousValue, region, industry, source, confidence, impact } = req.body ?? {};
    if (!signalType || !signalName || signalValue === undefined) {
      res.status(400).json({ error: "signalType, signalName, and signalValue are required" });
      return;
    }
    const result = await economicSignalEngine.recordSignal({
      signalType, signalName, signalValue, previousValue, region, industry, source, confidence, impact,
    });
    res.json(result);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/orchestrate/signals", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const signalType = req.query.signalType as string | undefined;
    const limit = parseInt(req.query.limit as string) || 30;
    const signals = await economicSignalEngine.getSignals(signalType, limit);
    res.json({ signals });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/orchestrate/signals/impact/:id", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const impact = await economicSignalEngine.assessImpact(parseInt(req.params.id as string));
    if (!impact) {
      res.status(404).json({ error: "Signal not found" });
      return;
    }
    res.json(impact);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/orchestrate/signals/impacts", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const impacts = await economicSignalEngine.getActiveImpacts(limit);
    res.json({ impacts });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/orchestrate/signals/outlook", authMiddleware, requireEmployer, async (_req: Request, res: Response) => {
  try {
    const outlook = await economicSignalEngine.generateMacroOutlook();
    res.json(outlook);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

export default router;
