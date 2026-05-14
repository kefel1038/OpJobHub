import { Router, type Request, type Response } from "express";
import { authMiddleware, requireRole } from "../lib/auth";
import { migrationIntelligence } from "../services/labor/migration-intelligence";
import { sponsorshipEngine } from "../services/labor/sponsorship-engine";
import { migrationStabilityService } from "../services/labor/migration-stability";
import { corridorHealthService } from "../services/labor/corridor-health";
import { migrationRiskService } from "../services/labor/migration-risk";

const router = Router();
const requireEmployer = requireRole("employer", "admin");

// ─── Corridor Intelligence ───────────────────────────────────

router.post("/migration/corridor/analyze", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const { source, destination } = req.body ?? {};
    if (!source || !destination) {
      res.status(400).json({ error: "source and destination are required" });
      return;
    }
    const intelligence = await migrationIntelligence.analyzeCorridor(source, destination);
    res.json(intelligence);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.post("/migration/corridors/analyze-all", authMiddleware, requireEmployer, async (_req: Request, res: Response) => {
  try {
    const results = await migrationIntelligence.analyzeAllCorridors();
    res.json({ corridors: results, count: results.length });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/migration/corridors/top", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const corridors = await migrationIntelligence.getTopCorridors(limit);
    res.json({ corridors });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/migration/corridors/history", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const history = await migrationIntelligence.getCorridorHistory(limit);
    res.json({ history });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/migration/corridor", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const source = req.query.source as string;
    const destination = req.query.destination as string;
    if (!source || !destination) {
      res.status(400).json({ error: "source and destination query params are required" });
      return;
    }
    const corridor = await migrationIntelligence.getCorridorByRoute(source, destination);
    if (!corridor) {
      res.status(404).json({ error: "Corridor not found" });
      return;
    }
    res.json(corridor);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// ─── Migration Events ────────────────────────────────────────

router.post("/migration/events", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const { candidateId, eventType, sourceCountry, destinationCountry, employerId, jobId, outcome, metadata } = req.body ?? {};
    if (!candidateId || !eventType) {
      res.status(400).json({ error: "candidateId and eventType are required" });
      return;
    }
    const result = await migrationIntelligence.recordMigrationEvent({
      candidateId, eventType, sourceCountry, destinationCountry, employerId, jobId, outcome, metadata,
    });
    res.json(result);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/migration/events", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const candidateId = req.query.candidateId ? parseInt(req.query.candidateId as string) : undefined;
    const employerId = req.query.employerId ? parseInt(req.query.employerId as string) : undefined;
    const limit = parseInt(req.query.limit as string) || 50;
    const events = await migrationIntelligence.getMigrationEvents(candidateId, employerId, limit);
    res.json({ events });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/migration/stats", authMiddleware, requireEmployer, async (_req: Request, res: Response) => {
  try {
    const stats = await migrationIntelligence.getMigrationStats();
    res.json(stats);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// ─── Sponsorship Intelligence ────────────────────────────────

router.post("/migration/sponsorship/analyze", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const employerId = parseInt(req.body?.employerId as string) || req.user!.id;
    const intelligence = await sponsorshipEngine.analyzeEmployerSponsorship(employerId);
    res.json(intelligence);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/migration/sponsorship/summary", authMiddleware, requireEmployer, async (_req: Request, res: Response) => {
  try {
    const summary = await sponsorshipEngine.getSponsorshipSummary();
    res.json(summary);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.post("/migration/sponsorship/record", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const { candidateId, jobId, nationality, destinationCountry, visaType, status, processingDays, sponsorCost, retentionDays, salaryAtSponsorship, currentSalary, metadata } = req.body ?? {};
    if (!candidateId || !status) {
      res.status(400).json({ error: "candidateId and status are required" });
      return;
    }
    const result = await sponsorshipEngine.recordSponsorshipOutcome({
      employerId: req.user!.id, candidateId, jobId, nationality, destinationCountry, visaType,
      status, processingDays, sponsorCost, retentionDays, salaryAtSponsorship, currentSalary, metadata,
    });
    res.json(result);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/migration/sponsorship/history/:employerId", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const employerId = parseInt(req.params.employerId as string);
    const limit = parseInt(req.query.limit as string) || 20;
    const history = await sponsorshipEngine.getEmployerSponsorshipHistory(employerId, limit);
    res.json({ history });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/migration/sponsorship/role/:role", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const likelihood = await sponsorshipEngine.getRoleSponsorshipLikelihood(req.params.role as string);
    res.json({ role: req.params.role, sponsorshipLikelihood: likelihood });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/migration/sponsorship/nationality/:nationality", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const rate = await sponsorshipEngine.getNationalitySponsorshipRate(req.params.nationality as string);
    res.json({ nationality: req.params.nationality, approvalRate: rate });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// ─── Migration Stability ─────────────────────────────────────

router.post("/migration/stability/assess/:candidateId", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const candidateId = parseInt(req.params.candidateId as string);
    const destinationCountry = req.body?.destinationCountry as string | undefined;
    const assessment = await migrationStabilityService.assessCandidateStability(candidateId, destinationCountry);
    res.json(assessment);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/migration/stability/profile/:candidateId", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const candidateId = parseInt(req.params.candidateId as string);
    const profile = await migrationStabilityService.getRelocationProfile(candidateId);
    if (!profile) {
      res.status(404).json({ error: "Relocation profile not found" });
      return;
    }
    res.json(profile);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/migration/stability/assessments", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const assessments = await migrationStabilityService.getStabilityAssessments(limit);
    res.json({ assessments });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// ─── Corridor Health ─────────────────────────────────────────

router.get("/migration/health/:source/:destination", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const health = await corridorHealthService.assessCorridorHealth(
      req.params.source as string, req.params.destination as string,
    );
    res.json(health);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/migration/health/all", authMiddleware, requireEmployer, async (_req: Request, res: Response) => {
  try {
    const healths = await corridorHealthService.getAllCorridorHealths();
    res.json({ corridors: healths, count: healths.length });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// ─── Migration Risk ──────────────────────────────────────────

router.post("/migration/risk/corridor-instability", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const { source, destination } = req.body ?? {};
    if (!source || !destination) {
      res.status(400).json({ error: "source and destination are required" });
      return;
    }
    const assessment = await migrationRiskService.assessCorridorInstability(source, destination);
    res.json(assessment);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.post("/migration/risk/sponsorship-fraud", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const employerId = parseInt(req.body?.employerId as string) || req.user!.id;
    const assessment = await migrationRiskService.assessSponsorshipFraud(employerId);
    res.json(assessment);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.post("/migration/risk/high-churn", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const { source, destination } = req.body ?? {};
    if (!source || !destination) {
      res.status(400).json({ error: "source and destination are required" });
      return;
    }
    const assessment = await migrationRiskService.assessHighChurnCorridor(source, destination);
    res.json(assessment);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.post("/migration/risk/visa-rejection", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const { nationality, destinationCountry } = req.body ?? {};
    if (!nationality || !destinationCountry) {
      res.status(400).json({ error: "nationality and destinationCountry are required" });
      return;
    }
    const assessment = await migrationRiskService.assessVisaRejectionRisk(nationality, destinationCountry);
    res.json(assessment);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/migration/risk/active", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const risks = await migrationRiskService.getAllActiveRisks(limit);
    res.json({ risks });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.post("/migration/risk/resolve/:id", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    await migrationRiskService.resolveRisk(id);
    res.json({ success: true });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

export default router;
