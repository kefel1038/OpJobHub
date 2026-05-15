import { logger } from "../../lib/logger";
import { demandForecastService, type DemandForecastResult } from "./demand-forecast";
import { skillForecastService, type SkillForecastResult } from "./skill-forecast";
import { migrationForecastService, type MigrationForecastResult } from "./migration-forecast";
import { riskForecastService, type RiskForecastResult } from "./risk-forecast";
import { confidenceEngine, type ForecastCalibration } from "./confidence-engine";

export interface ForecastingSummary {
  demandForecasts: DemandForecastResult[];
  skillForecasts: SkillForecastResult[];
  migrationForecasts: MigrationForecastResult[];
  riskForecasts: RiskForecastResult[];
  calibrations: ForecastCalibration[];
  snapshotTimestamp: string;
}

class ForecastEngine {
  private lastSnapshot: Date | null = null;
  private cacheIntervalMs = 10 * 60 * 1000;

  async refreshAll(horizon = "90d"): Promise<ForecastingSummary> {
    logger.info({ horizon }, "Refreshing forecasting engine");

    const [demandForecasts, skillForecasts, migrationForecasts, riskForecasts, calibrations] = await Promise.all([
      this.safeDemandForecast(horizon),
      this.safeSkillForecast(horizon),
      this.safeMigrationForecast(horizon),
      this.safeRiskForecast(horizon),
      this.safeCalibrations(),
    ]);

    this.lastSnapshot = new Date();

    return {
      demandForecasts,
      skillForecasts,
      migrationForecasts,
      riskForecasts,
      calibrations,
      snapshotTimestamp: new Date().toISOString(),
    };
  }

  async getDemandForecasts(horizon = "90d"): Promise<DemandForecastResult[]> {
    return this.safeDemandForecast(horizon);
  }

  async getSkillForecasts(horizon = "90d"): Promise<SkillForecastResult[]> {
    return this.safeSkillForecast(horizon);
  }

  async getMigrationForecasts(horizon = "90d"): Promise<MigrationForecastResult[]> {
    return this.safeMigrationForecast(horizon);
  }

  async getRiskForecasts(horizon = "90d"): Promise<RiskForecastResult[]> {
    return this.safeRiskForecast(horizon);
  }

  async getCalibrations(): Promise<ForecastCalibration[]> {
    return this.safeCalibrations();
  }

  async getEmergingSkills(horizon = "90d"): Promise<Array<{ skill: string; probability: number; adjacencies: string[] }>> {
    return skillForecastService.predictEmergingSkills(horizon);
  }

  async getDecliningSkills(horizon = "90d"): Promise<Array<{ skill: string; probability: number }>> {
    return skillForecastService.predictDecliningSkills(horizon);
  }

  async forecastRole(role: string, horizon = "90d"): Promise<{
    demand: DemandForecastResult;
    shortage: DemandForecastResult;
    wage: DemandForecastResult;
    shortageRisk: RiskForecastResult;
    saturationRisk: RiskForecastResult;
  }> {
    const [demand, shortage, wage, shortageRisk, saturationRisk] = await Promise.all([
      demandForecastService.forecastRoleDemand(role, horizon),
      demandForecastService.forecastLaborShortage(role, undefined, horizon),
      demandForecastService.forecastWagePressure(role, undefined, horizon),
      riskForecastService.forecastLaborShortageRisk(role, undefined, horizon),
      riskForecastService.forecastWorkforceSaturation(role, undefined, horizon),
    ]);
    return { demand, shortage, wage, shortageRisk, saturationRisk };
  }

  async forecastCorridor(source: string, destination: string, horizon = "90d"): Promise<{
    volume: MigrationForecastResult;
    sponsorship: MigrationForecastResult;
    growth: MigrationForecastResult;
    instability: RiskForecastResult;
  }> {
    const [volume, sponsorship, growth, instability] = await Promise.all([
      migrationForecastService.forecastCorridorVolume(source, destination, horizon),
      migrationForecastService.forecastSponsorshipDemand(source, destination, horizon),
      migrationForecastService.forecastCorridorGrowth(source, destination, horizon),
      riskForecastService.forecastCorridorInstability(source, destination, horizon),
    ]);
    return { volume, sponsorship, growth, instability };
  }

  async getForecastHistory(forecastType?: string, limit = 50): Promise<Array<Record<string, unknown>>> {
    return demandForecastService.getForecastHistory(forecastType, limit);
  }

  async getSkillForecastHistory(skillName?: string, limit = 50): Promise<Array<Record<string, unknown>>> {
    return skillForecastService.getSkillForecastHistory(skillName, limit);
  }

  async getMigrationForecastHistory(forecastType?: string, limit = 50): Promise<Array<Record<string, unknown>>> {
    return migrationForecastService.getForecastHistory(forecastType, limit);
  }

  isStale(): boolean {
    if (!this.lastSnapshot) return true;
    return Date.now() - this.lastSnapshot.getTime() > this.cacheIntervalMs;
  }

  private async safeDemandForecast(horizon: string): Promise<DemandForecastResult[]> {
    try { return await demandForecastService.forecastAll(horizon); }
    catch (err) { logger.error({ err }, "Demand forecast failed"); return []; }
  }

  private async safeSkillForecast(horizon: string): Promise<SkillForecastResult[]> {
    try { return await skillForecastService.forecastAllSkills(horizon); }
    catch (err) { logger.error({ err }, "Skill forecast failed"); return []; }
  }

  private async safeMigrationForecast(horizon: string): Promise<MigrationForecastResult[]> {
    try { return await migrationForecastService.forecastAllCorridors(horizon); }
    catch (err) { logger.error({ err }, "Migration forecast failed"); return []; }
  }

  private async safeRiskForecast(horizon: string): Promise<RiskForecastResult[]> {
    try { return await riskForecastService.forecastAllRisks(horizon); }
    catch (err) { logger.error({ err }, "Risk forecast failed"); return []; }
  }

  private async safeCalibrations(): Promise<ForecastCalibration[]> {
    try { return await confidenceEngine.getAllCalibrations(); }
    catch (err) { logger.error({ err }, "Calibration failed"); return []; }
  }
}

export const forecastEngine = new ForecastEngine();
