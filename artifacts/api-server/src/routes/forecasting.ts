import { Router, type Request, type Response } from "express";
import { authMiddleware, requireRole } from "../lib/auth";
import { forecastEngine } from "../services/labor/forecast-engine";
import { demandForecastService } from "../services/labor/demand-forecast";
import { skillForecastService } from "../services/labor/skill-forecast";
import { migrationForecastService } from "../services/labor/migration-forecast";
import { riskForecastService } from "../services/labor/risk-forecast";
import { confidenceEngine } from "../services/labor/confidence-engine";

const router = Router();
const requireEmployer = requireRole("employer", "admin");

// ─── Core Forecasting ───────────────────────────────────────

router.post("/forecast/refresh", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const horizon = (req.query.horizon as string) || "90d";
    const summary = await forecastEngine.refreshAll(horizon);
    res.json(summary);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/forecast/summary", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const horizon = (req.query.horizon as string) || "90d";
    const summary = await forecastEngine.refreshAll(horizon);
    res.json(summary);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// ─── Demand Forecasts ───────────────────────────────────────

router.get("/forecast/demand", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const horizon = (req.query.horizon as string) || "90d";
    const forecasts = await forecastEngine.getDemandForecasts(horizon);
    res.json({ forecasts });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/forecast/demand/role/:role", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const horizon = (req.query.horizon as string) || "90d";
    const result = await forecastEngine.forecastRole(req.params.role as string, horizon);
    res.json(result);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/forecast/demand/industry/:industry", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const horizon = (req.query.horizon as string) || "90d";
    const region = req.query.region as string | undefined;
    const forecast = await demandForecastService.forecastIndustryDemand(req.params.industry as string, region, horizon);
    res.json(forecast);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/forecast/demand/region/:region", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const horizon = (req.query.horizon as string) || "90d";
    const forecast = await demandForecastService.forecastRegionalDemand(req.params.region as string, horizon);
    res.json(forecast);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/forecast/shortage/:role", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const horizon = (req.query.horizon as string) || "90d";
    const region = req.query.region as string | undefined;
    const forecast = await demandForecastService.forecastLaborShortage(req.params.role as string, region, horizon);
    res.json(forecast);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/forecast/wage/:role", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const horizon = (req.query.horizon as string) || "90d";
    const region = req.query.region as string | undefined;
    const forecast = await demandForecastService.forecastWagePressure(req.params.role as string, region, horizon);
    res.json(forecast);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/forecast/demand/employer/:employerId", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const horizon = (req.query.horizon as string) || "90d";
    const employerId = parseInt(req.params.employerId as string);
    const forecast = await demandForecastService.forecastEmployerDemand(employerId, horizon);
    res.json(forecast);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// ─── Skill Forecasts ────────────────────────────────────────

router.get("/forecast/skills", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const horizon = (req.query.horizon as string) || "90d";
    const forecasts = await forecastEngine.getSkillForecasts(horizon);
    res.json({ forecasts });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/forecast/skills/emerging", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const horizon = (req.query.horizon as string) || "90d";
    const skills = await forecastEngine.getEmergingSkills(horizon);
    res.json({ skills });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/forecast/skills/declining", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const horizon = (req.query.horizon as string) || "90d";
    const skills = await forecastEngine.getDecliningSkills(horizon);
    res.json({ skills });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/forecast/skills/:skillName", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const horizon = (req.query.horizon as string) || "90d";
    const demand = await skillForecastService.forecastSkillDemand(req.params.skillName as string, horizon);
    const scarcity = await skillForecastService.forecastSkillScarcity(req.params.skillName as string, horizon);
    res.json({ demand, scarcity });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// ─── Migration Forecasts ────────────────────────────────────

router.get("/forecast/migration", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const horizon = (req.query.horizon as string) || "90d";
    const forecasts = await forecastEngine.getMigrationForecasts(horizon);
    res.json({ forecasts });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/forecast/migration/corridor", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const source = req.query.source as string;
    const destination = req.query.destination as string;
    const horizon = (req.query.horizon as string) || "90d";
    if (!source || !destination) {
      res.status(400).json({ error: "source and destination query params are required" });
      return;
    }
    const result = await forecastEngine.forecastCorridor(source, destination, horizon);
    res.json(result);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/forecast/migration/volume", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const source = req.query.source as string;
    const destination = req.query.destination as string;
    const horizon = (req.query.horizon as string) || "90d";
    if (!source || !destination) {
      res.status(400).json({ error: "source and destination query params are required" });
      return;
    }
    const forecast = await migrationForecastService.forecastCorridorVolume(source, destination, horizon);
    res.json(forecast);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/forecast/migration/sponsorship", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const source = req.query.source as string;
    const destination = req.query.destination as string;
    const horizon = (req.query.horizon as string) || "90d";
    if (!source || !destination) {
      res.status(400).json({ error: "source and destination query params are required" });
      return;
    }
    const forecast = await migrationForecastService.forecastSponsorshipDemand(source, destination, horizon);
    res.json(forecast);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// ─── Risk Forecasts ─────────────────────────────────────────

router.get("/forecast/risks", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const horizon = (req.query.horizon as string) || "90d";
    const forecasts = await forecastEngine.getRiskForecasts(horizon);
    res.json({ forecasts });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/forecast/risks/shortage/:role", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const horizon = (req.query.horizon as string) || "90d";
    const region = req.query.region as string | undefined;
    const risk = await riskForecastService.forecastLaborShortageRisk(req.params.role as string, region, horizon);
    res.json(risk);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/forecast/risks/churn", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const horizon = (req.query.horizon as string) || "90d";
    const industry = req.query.industry as string | undefined;
    const region = req.query.region as string | undefined;
    const risk = await riskForecastService.forecastChurnRisk(industry, region, horizon);
    res.json(risk);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/forecast/risks/instability", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const source = req.query.source as string;
    const destination = req.query.destination as string;
    const horizon = (req.query.horizon as string) || "90d";
    if (!source || !destination) {
      res.status(400).json({ error: "source and destination query params are required" });
      return;
    }
    const risk = await riskForecastService.forecastCorridorInstability(source, destination, horizon);
    res.json(risk);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/forecast/risks/bottleneck", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const nationality = req.query.nationality as string;
    const destination = req.query.destination as string;
    const horizon = (req.query.horizon as string) || "90d";
    if (!nationality || !destination) {
      res.status(400).json({ error: "nationality and destination query params are required" });
      return;
    }
    const risk = await riskForecastService.forecastSponsorshipBottleneck(nationality, destination, horizon);
    res.json(risk);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/forecast/risks/saturation/:role", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const horizon = (req.query.horizon as string) || "90d";
    const region = req.query.region as string | undefined;
    const risk = await riskForecastService.forecastWorkforceSaturation(req.params.role as string, region, horizon);
    res.json(risk);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// ─── Forecast Confidence & Calibration ─────────────────────

router.get("/forecast/calibrations", authMiddleware, requireEmployer, async (_req: Request, res: Response) => {
  try {
    const calibrations = await forecastEngine.getCalibrations();
    res.json({ calibrations });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/forecast/calibrations/:type", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const calibration = await confidenceEngine.calibrateForecastType(req.params.type as string);
    res.json(calibration);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.post("/forecast/accuracy/record", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const { forecastType, forecastId, predictedValue, actualValue, forecastHorizon, region, industry } = req.body ?? {};
    if (!forecastType || predictedValue === undefined || actualValue === undefined) {
      res.status(400).json({ error: "forecastType, predictedValue, and actualValue are required" });
      return;
    }
    await confidenceEngine.recordAccuracy({ forecastType, forecastId, predictedValue, actualValue, forecastHorizon, region, industry });
    res.json({ success: true });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/forecast/accuracy/history", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const forecastType = req.query.forecastType as string | undefined;
    const limit = parseInt(req.query.limit as string) || 50;
    const history = await confidenceEngine.getAccuracyHistory(forecastType, limit);
    res.json({ history });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/forecast/history", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const forecastType = req.query.forecastType as string | undefined;
    const limit = parseInt(req.query.limit as string) || 50;
    const history = await forecastEngine.getForecastHistory(forecastType, limit);
    res.json({ history });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/forecast/history/skills", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const skillName = req.query.skill as string | undefined;
    const limit = parseInt(req.query.limit as string) || 50;
    const history = await forecastEngine.getSkillForecastHistory(skillName, limit);
    res.json({ history });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/forecast/history/migration", authMiddleware, requireEmployer, async (req: Request, res: Response) => {
  try {
    const forecastType = req.query.forecastType as string | undefined;
    const limit = parseInt(req.query.limit as string) || 50;
    const history = await forecastEngine.getMigrationForecastHistory(forecastType, limit);
    res.json({ history });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

export default router;
