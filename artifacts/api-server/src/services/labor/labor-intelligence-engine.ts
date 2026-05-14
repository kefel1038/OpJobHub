import { logger } from "../../lib/logger";
import { laborAggregator } from "./labor-aggregator";
import { workforceFlowAnalyzer } from "./workforce-flow";
import { skillEconomyAnalyzer } from "./skill-economy";
import { employerIntelligenceService } from "./employer-intelligence";
import { ecosystemMetricsService } from "./ecosystem-metrics";
import type { DemandMetric, SupplyMetric } from "./labor-aggregator";
import type { FlowRecord } from "./workforce-flow";
import type { SkillEconomyRecord } from "./skill-economy";
import type { EmployerIntelligence } from "./employer-intelligence";
import type { RegionalProfile, EcosystemHealth } from "./ecosystem-metrics";

export interface LaborIntelligenceSummary {
  demandIntelligence: DemandMetric[];
  supplyIntelligence: SupplyMetric[];
  workforceFlows: Record<string, FlowRecord[]>;
  skillEconomy: SkillEconomyRecord[];
  topEmployers: EmployerIntelligence[];
  regionalProfiles: RegionalProfile[];
  ecosystemHealth: EcosystemHealth;
  snapshotTimestamp: string;
}

class LaborIntelligenceEngine {
  private lastSnapshot: Date | null = null;
  private cacheIntervalMs = 5 * 60 * 1000;

  async refreshAll(windowDays = 90): Promise<LaborIntelligenceSummary> {
    logger.info({ windowDays }, "Refreshing labor intelligence engine");

    const [demandIntelligence, supplyIntelligence, workforceFlows, skillEconomy] = await Promise.all([
      laborAggregator.aggregateDemandIntelligence(windowDays),
      laborAggregator.aggregateSupplyIntelligence(windowDays),
      workforceFlowAnalyzer.analyzeAllFlows(windowDays),
      skillEconomyAnalyzer.analyzeAllSkills(windowDays),
    ]);

    const metrics = await laborAggregator.aggregateWorkforceMetrics(windowDays);
    await laborAggregator.persistMetrics(metrics);

    const topEmployers = await employerIntelligenceService.analyzeAllEmployers(windowDays);
    const ecosystemHealth = await ecosystemMetricsService.computeEcosystemHealth();

    const regions = await this.extractRegions(demandIntelligence, supplyIntelligence);
    const regionalProfiles: RegionalProfile[] = [];
    for (const region of regions.slice(0, 10)) {
      try {
        const profile = await ecosystemMetricsService.computeRegionalProfile(region);
        regionalProfiles.push(profile);
      } catch (err) {
        logger.error({ err, region }, "Failed to compute regional profile");
      }
    }

    this.lastSnapshot = new Date();

    return {
      demandIntelligence,
      supplyIntelligence,
      workforceFlows,
      skillEconomy,
      topEmployers,
      regionalProfiles,
      ecosystemHealth,
      snapshotTimestamp: this.lastSnapshot.toISOString(),
    };
  }

  async getDemandIntelligence(windowDays = 90): Promise<DemandMetric[]> {
    return laborAggregator.aggregateDemandIntelligence(windowDays);
  }

  async getSupplyIntelligence(windowDays = 90): Promise<SupplyMetric[]> {
    return laborAggregator.aggregateSupplyIntelligence(windowDays);
  }

  async getWorkforceFlows(windowDays = 90): Promise<Record<string, FlowRecord[]>> {
    return workforceFlowAnalyzer.analyzeAllFlows(windowDays);
  }

  async getSkillEconomy(windowDays = 90): Promise<SkillEconomyRecord[]> {
    return skillEconomyAnalyzer.analyzeAllSkills(windowDays);
  }

  async getEmployerIntelligence(employerId?: number, windowDays = 90): Promise<EmployerIntelligence | EmployerIntelligence[]> {
    if (employerId) {
      return employerIntelligenceService.analyzeEmployer(employerId, windowDays);
    }
    return employerIntelligenceService.analyzeAllEmployers(windowDays);
  }

  async getRegionalProfile(region: string): Promise<RegionalProfile> {
    return ecosystemMetricsService.computeRegionalProfile(region);
  }

  async getEcosystemHealth(): Promise<EcosystemHealth> {
    return ecosystemMetricsService.computeEcosystemHealth();
  }

  async getSkillTrends(trendType?: string, limit = 20, region?: string, industry?: string): Promise<Array<Record<string, unknown>>> {
    return skillEconomyAnalyzer.getTrendingSkills(trendType, limit, region, industry);
  }

  async getSkillEconomySummary(): Promise<{
    rising: number; declining: number; emerging: number; total: number;
    topRising: string[]; topDeclining: string[];
  }> {
    return skillEconomyAnalyzer.getSkillEconomySummary();
  }

  async getFlowHistory(flowType?: string, limit = 50): Promise<Array<Record<string, unknown>>> {
    return workforceFlowAnalyzer.getFlowHistory(flowType, limit);
  }

  async getRegionalSnapshots(region?: string, limit = 10): Promise<Array<Record<string, unknown>>> {
    return ecosystemMetricsService.getRegionalSnapshots(region, limit);
  }

  async getMetricsHistory(metricType?: string, region?: string, limit = 50): Promise<Array<Record<string, unknown>>> {
    return ecosystemMetricsService.getMetricsHistory(metricType, region, limit);
  }

  async getTopEmployers(limit = 10): Promise<Array<{ employerId: number; hiringVelocity: number; retentionRate: number }>> {
    return employerIntelligenceService.getTopEmployers(limit);
  }

  async getEmployerMetrics(employerId: number, limit = 20): Promise<Array<Record<string, unknown>>> {
    return employerIntelligenceService.getEmployerMetrics(employerId, limit);
  }

  isStale(): boolean {
    if (!this.lastSnapshot) return true;
    return Date.now() - this.lastSnapshot.getTime() > this.cacheIntervalMs;
  }

  private async extractRegions(demand: DemandMetric[], supply: SupplyMetric[]): Promise<string[]> {
    const regionSet = new Set<string>();
    for (const d of demand) if (d.region) regionSet.add(d.region);
    for (const s of supply) if (s.region) regionSet.add(s.region);
    return Array.from(regionSet);
  }
}

export const laborIntelligenceEngine = new LaborIntelligenceEngine();
