import { Router, type Request, type Response } from "express";
import { authMiddleware, requireRole } from "../lib/auth";
import { simulationEngine } from "../services/simulation/simulation-engine";
import { outcomeLearner } from "../services/simulation/outcome-learner";
import { simulationMemory } from "../services/simulation/simulation-memory";
import { riskEngine } from "../services/simulation/risk-engine";
import { scenarioEngine } from "../services/simulation/scenario-engine";

const router = Router();
const requireEmployer = requireRole("employer", "admin");

// ─── Simulations ────────────────────────────────────────────

router.post("/simulation/hiring-success", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const { employerId, candidateId, jobId, candidateSkills, jobSkills, location, industry, experienceLevel } = req.body ?? {};
    const result = await simulationEngine.simulateHiringSuccess({
      employerId: employerId || req.user!.id,
      candidateId, jobId, candidateSkills, jobSkills, location, industry, experienceLevel,
    });
    res.json(result);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.post("/simulation/retention", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const { employerId, candidateId, location, industry, experienceLevel } = req.body ?? {};
    const result = await simulationEngine.simulateRetention({
      employerId: employerId || req.user!.id,
      candidateId, location, industry, experienceLevel,
    });
    res.json(result);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.post("/simulation/interview-success", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const { employerId, candidateId, jobId } = req.body ?? {};
    const result = await simulationEngine.simulateInterviewSuccess({
      employerId: employerId || req.user!.id,
      candidateId, jobId,
    });
    res.json(result);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.post("/simulation/offer-acceptance", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const { employerId, candidateId, salary, location } = req.body ?? {};
    const result = await simulationEngine.simulateOfferAcceptance({
      employerId: employerId || req.user!.id,
      candidateId, salary, location,
    });
    res.json(result);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.post("/simulation/sponsorship-success", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const { employerId, candidateId, nationality, currentLocation } = req.body ?? {};
    const result = await simulationEngine.simulateSponsorshipSuccess({
      employerId: employerId || req.user!.id,
      candidateId, nationality, currentLocation,
    });
    res.json(result);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.post("/simulation/skill-gap-risk", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const { jobSkills, candidateSkills, industry } = req.body ?? {};
    if (!jobSkills || !candidateSkills) {
      res.status(400).json({ error: "jobSkills and candidateSkills are required" });
      return;
    }
    const result = await simulationEngine.simulateSkillGapRisk({ jobSkills, candidateSkills, industry });
    res.json(result);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.post("/simulation/all", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const { employerId, candidateId, jobId, candidateSkills, jobSkills, location, industry, experienceLevel, salary, nationality, currentLocation } = req.body ?? {};
    const result = await simulationEngine.simulateAll({
      employerId: employerId || req.user!.id,
      candidateId, jobId, candidateSkills, jobSkills, location, industry, experienceLevel, salary, nationality, currentLocation,
    });
    res.json(result);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// ─── Outcome Learning ───────────────────────────────────────

router.post("/simulation/outcomes/record", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const { simulationId, actualOutcome, outcomeValue, metadata } = req.body ?? {};
    if (!simulationId || !actualOutcome) {
      res.status(400).json({ error: "simulationId and actualOutcome are required" });
      return;
    }
    const result = await outcomeLearner.recordOutcome({
      simulationId, employerId: req.user!.id, actualOutcome, outcomeValue, metadata,
    });
    res.json(result);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/simulation/accuracy/:simulationType?", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const simulationType = req.params.simulationType as string | undefined;
    if (simulationType) {
      const stats = await outcomeLearner.computeAccuracy({
        employerId: req.user!.id,
        simulationType,
        windowDays: parseInt(req.query.windowDays as string) || undefined,
      });
      res.json(stats);
    } else {
      const allStats = await outcomeLearner.getAccuracyByEmployer(req.user!.id);
      res.json(allStats);
    }
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/simulation/accuracy-history", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const simulationType = req.query.simulationType as string | undefined;
    const limit = parseInt(req.query.limit as string) || 20;
    const history = await outcomeLearner.getAccuracyHistory(req.user!.id, simulationType, limit);
    res.json({ history });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/simulation/calibration-bias/:simulationType", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const bias = await outcomeLearner.getCalibrationBias(req.user!.id, req.params.simulationType as string);
    res.json({ bias });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// ─── Simulation Memory ──────────────────────────────────────

router.get("/simulation/history", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const type = req.query.type as string | undefined;
    const simulations = await simulationMemory.getRecentSimulations(req.user!.id, limit, type);
    res.json({ simulations });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/simulation/drift/:simulationType", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const windowDays = parseInt(req.query.windowDays as string) || 90;
    const drift = await simulationMemory.getAccuracyDrift(req.user!.id, req.params.simulationType as string, windowDays);
    res.json(drift);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/simulation/compare", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const simulationType = req.query.simulationType as string;
    const period1Days = parseInt(req.query.period1Days as string) || 30;
    const period2Days = parseInt(req.query.period2Days as string) || 60;
    if (!simulationType) {
      res.status(400).json({ error: "simulationType is required" });
      return;
    }
    const comparison = await simulationMemory.comparePeriods(req.user!.id, simulationType, period1Days, period2Days);
    res.json(comparison);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/simulation/candidate/:candidateId", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const candidateId = parseInt(req.params.candidateId as string);
    const limit = parseInt(req.query.limit as string) || 20;
    const simulations = await simulationMemory.getSimulationsForCandidate(candidateId, req.user!.id, limit);
    res.json({ simulations });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/simulation/:id", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const sim = await simulationMemory.getSimulationById(parseInt(req.params.id as string));
    if (!sim) {
      res.status(404).json({ error: "Simulation not found" });
      return;
    }
    res.json(sim);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// ─── Risk Assessment ────────────────────────────────────────

router.post("/simulation/risk/churn", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const { candidateId, jobId } = req.body ?? {};
    if (!candidateId) {
      res.status(400).json({ error: "candidateId is required" });
      return;
    }
    const result = await riskEngine.assessChurnRisk({ employerId: req.user!.id, candidateId, jobId });
    res.json(result);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.post("/simulation/risk/mismatch", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const { candidateId, jobId, jobSkills, candidateSkills } = req.body ?? {};
    if (!candidateId) {
      res.status(400).json({ error: "candidateId is required" });
      return;
    }
    const result = await riskEngine.assessMismatchRisk({ employerId: req.user!.id, candidateId, jobId, jobSkills, candidateSkills });
    res.json(result);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.post("/simulation/risk/sponsorship", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const { candidateId, jobId } = req.body ?? {};
    if (!candidateId) {
      res.status(400).json({ error: "candidateId is required" });
      return;
    }
    const result = await riskEngine.assessSponsorshipFailureRisk({ employerId: req.user!.id, candidateId, jobId });
    res.json(result);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.post("/simulation/risk/fraud", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const { candidateId, jobId } = req.body ?? {};
    if (!candidateId) {
      res.status(400).json({ error: "candidateId is required" });
      return;
    }
    const result = await riskEngine.assessFraudRisk({ employerId: req.user!.id, candidateId, jobId });
    res.json(result);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.post("/simulation/risk/skill-obsolescence", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const { candidateId, industry, jobId } = req.body ?? {};
    if (!candidateId) {
      res.status(400).json({ error: "candidateId is required" });
      return;
    }
    const result = await riskEngine.assessSkillObsolescenceRisk({ employerId: req.user!.id, candidateId, industry, jobId });
    res.json(result);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.post("/simulation/risk/migration-instability", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const { candidateId, jobId } = req.body ?? {};
    if (!candidateId) {
      res.status(400).json({ error: "candidateId is required" });
      return;
    }
    const result = await riskEngine.assessMigrationInstability({ employerId: req.user!.id, candidateId, jobId });
    res.json(result);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.post("/simulation/risk/all", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const { candidateId, jobId, jobSkills, candidateSkills } = req.body ?? {};
    if (!candidateId) {
      res.status(400).json({ error: "candidateId is required" });
      return;
    }
    const result = await riskEngine.assessAll(req.user!.id, candidateId, jobId, jobSkills, candidateSkills);
    res.json(result);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// ─── Scenario Analysis ──────────────────────────────────────

router.post("/simulation/scenario/salary", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const { candidateId, currentSalary, proposedSalary, location, jobSkills, candidateSkills } = req.body ?? {};
    if (!candidateId || currentSalary === undefined || proposedSalary === undefined) {
      res.status(400).json({ error: "candidateId, currentSalary, and proposedSalary are required" });
      return;
    }
    const result = await scenarioEngine.runWhatIfSalary({
      employerId: req.user!.id, candidateId, currentSalary, proposedSalary, location, jobSkills, candidateSkills,
    });
    res.json(result);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.post("/simulation/scenario/location", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const { candidateId, currentLocation, proposedLocation } = req.body ?? {};
    if (!candidateId || !currentLocation || !proposedLocation) {
      res.status(400).json({ error: "candidateId, currentLocation, and proposedLocation are required" });
      return;
    }
    const result = await scenarioEngine.runWhatIfLocation({
      employerId: req.user!.id, candidateId, currentLocation, proposedLocation,
    });
    res.json(result);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.post("/simulation/scenario/skills", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const { candidateId, currentSkills, additionalSkills, jobSkills, industry } = req.body ?? {};
    if (!candidateId || !currentSkills || !additionalSkills || !jobSkills) {
      res.status(400).json({ error: "candidateId, currentSkills, additionalSkills, and jobSkills are required" });
      return;
    }
    const result = await scenarioEngine.runWhatIfSkills({
      employerId: req.user!.id, candidateId, currentSkills, additionalSkills, jobSkills, industry,
    });
    res.json(result);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.post("/simulation/scenario/custom", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const { name, description, simulationParams, modifiedParams, simulationType } = req.body ?? {};
    if (!name || !simulationParams || !modifiedParams || !simulationType) {
      res.status(400).json({ error: "name, simulationParams, modifiedParams, and simulationType are required" });
      return;
    }
    const result = await scenarioEngine.runCustomScenario({
      employerId: req.user!.id, name, description, simulationParams, modifiedParams, simulationType,
    });
    res.json(result);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/simulation/scenarios", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const history = await scenarioEngine.getScenarioHistory(req.user!.id, limit);
    res.json({ scenarios: history });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/simulation/scenario/:id", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const scenario = await scenarioEngine.getScenarioById(parseInt(req.params.id as string));
    if (!scenario) {
      res.status(404).json({ error: "Scenario not found" });
      return;
    }
    res.json(scenario);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/simulation/scenario-stats", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const stats = await scenarioEngine.getScenarioStats(req.user!.id);
    res.json(stats);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

export default router;
