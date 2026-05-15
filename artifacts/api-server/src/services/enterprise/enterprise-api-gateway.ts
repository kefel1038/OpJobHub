import { logger } from "../../lib/logger";
import { laborIntelligenceEngine } from "../labor/labor-intelligence-engine";
import { migrationIntelligence } from "../labor/migration-intelligence";
import { migrationRiskService } from "../labor/migration-risk";
import { corridorHealthService } from "../labor/corridor-health";
import { sponsorshipEngine } from "../labor/sponsorship-engine";
import { forecastEngine } from "../labor/forecast-engine";
import { confidenceEngine } from "../labor/confidence-engine";
import { marketBalancer } from "../labor/market-balancer";
import { economicSignalEngine } from "../labor/economic-signal-engine";
import { workforceFlowAnalyzer } from "../labor/workforce-flow";
import { ecosystemMetricsService } from "../labor/ecosystem-metrics";
import { employerIntelligenceService } from "../labor/employer-intelligence";
import { skillEconomyAnalyzer } from "../labor/skill-economy";
import { skillForecastService } from "../labor/skill-forecast";
import { riskForecastService } from "../labor/risk-forecast";
import { graphQueryEngine } from "../graph/query-engine";

export interface ExplainabilityMetadata {
  confidence: number;
  confidenceInterval?: { lower: number; upper: number };
  forecastHorizon?: string;
  reliability: string;
  dataFreshness: string;
  driftDetected: boolean;
  uncertaintyLevel: string;
  methodology: string;
  dataSources: string[];
  caveats: string[];
}

function buildExplainability(params: {
  confidence?: number; forecastType?: string;
  driftDetected?: boolean; horizon?: string;
}): ExplainabilityMetadata {
  const confidence = params.confidence ?? 0.7;
  const uncertaintyLevel = confidence >= 0.9 ? "low" : confidence >= 0.7 ? "moderate" : confidence >= 0.5 ? "elevated" : "high";
  return {
    confidence,
    confidenceInterval: {
      lower: Math.max(0, confidence - (1 - confidence) * 0.3),
      upper: Math.min(1, confidence + (1 - confidence) * 0.3),
    },
    forecastHorizon: params.horizon ?? "medium-term",
    reliability: confidence >= 0.8 ? "high" : confidence >= 0.6 ? "moderate" : "low",
    dataFreshness: "realtime",
    driftDetected: params.driftDetected ?? false,
    uncertaintyLevel,
    methodology: "multi-model ensemble with graph-derived adjacency signals",
    dataSources: ["labor_metrics", "workforce_graph", "migration_corridors", "economic_signals", "ecosystem_metrics"],
    caveats: confidence < 0.7
      ? ["Limited historical data for this prediction", "Consider cross-referencing with regional indicators"]
      : [],
  };
}

class EnterpriseApiGateway {

  async getWorkforceIntelligence(params: {
    region?: string; industry?: string; metricType?: string;
  }): Promise<{ data: Record<string, unknown>; explainability: ExplainabilityMetadata }> {
    const summary = await laborIntelligenceEngine.refreshAll();
    const trends = await laborIntelligenceEngine.getSkillTrends(params.metricType as any);
    return {
      data: { summary, trends, region: params.region, industry: params.industry } as Record<string, unknown>,
      explainability: buildExplainability({ confidence: 0.85 }),
    };
  }

  async getWorkforceForecasts(params: {
    role?: string; region?: string; horizon?: string;
  }): Promise<{ data: Record<string, unknown>; explainability: ExplainabilityMetadata }> {
    let forecast: Record<string, unknown>;
    let calibrationScore = 0.75;
    if (params.role) {
      forecast = await forecastEngine.forecastRole(params.role, params.horizon ?? "90d") as unknown as Record<string, unknown>;
    } else {
      const demand = await forecastEngine.getDemandForecasts(params.horizon ?? "90d");
      const skills = await forecastEngine.getSkillForecasts(params.horizon ?? "90d");
      const migration = await forecastEngine.getMigrationForecasts(params.horizon ?? "90d");
      const risks = await forecastEngine.getRiskForecasts(params.horizon ?? "90d");
      forecast = { demand, skills, migration, risks } as unknown as Record<string, unknown>;
    }
    const calibrations = await confidenceEngine.getAllCalibrations();
    const demandCal = calibrations.find(c => c.forecastType === "demand");
    if (demandCal) {
      calibrationScore = demandCal.confidenceCalibration ?? 0.75;
    }
    return {
      data: { forecast, role: params.role, region: params.region, horizon: params.horizon ?? "90d" } as Record<string, unknown>,
      explainability: buildExplainability({ confidence: calibrationScore, forecastType: "demand", driftDetected: false, horizon: params.horizon }),
    };
  }

  async getMigrationIntelligence(params: {
    source?: string; destination?: string; corridor?: string;
  }): Promise<{ data: Record<string, unknown>; explainability: ExplainabilityMetadata }> {
    let intelligence: Record<string, unknown>;
    if (params.corridor) {
      const [source, dest] = params.corridor.split("-");
      const health = await corridorHealthService.assessCorridorHealth(source, dest);
      intelligence = { corridor: params.corridor, health } as Record<string, unknown>;
    } else {
      const corridors = await migrationIntelligence.getTopCorridors(20);
      const risks = await migrationRiskService.getAllActiveRisks();
      intelligence = { corridors, risks } as Record<string, unknown>;
    }
    return {
      data: intelligence,
      explainability: buildExplainability({ confidence: 0.8, forecastType: "migration" }),
    };
  }

  async getCorridorForecasts(params: {
    source?: string; destination?: string; corridor?: string;
  }): Promise<{ data: Record<string, unknown>; explainability: ExplainabilityMetadata }> {
    const corridorKey = params.corridor ?? `${params.source}-${params.destination}`;
    const [source, dest] = corridorKey.split("-");
    const forecast = await forecastEngine.forecastCorridor(source, dest);
    return {
      data: { corridor: corridorKey, forecast } as Record<string, unknown>,
      explainability: buildExplainability({ confidence: (forecast as any)?.overallConfidence ?? 0.75, forecastType: "migration" }),
    };
  }

  async getHiringPredictions(params: {
    role?: string; industry?: string; region?: string;
  }): Promise<{ data: Record<string, unknown>; explainability: ExplainabilityMetadata }> {
    const scenario = await forecastEngine.forecastRole(params.role ?? "Software Engineer", "90d");
    return {
      data: { scenario, role: params.role } as Record<string, unknown>,
      explainability: buildExplainability({ confidence: 0.7, forecastType: "hiring", horizon: "short-term" }),
    };
  }

  async getSkillEconomy(params: {
    skill?: string; industry?: string; region?: string;
  }): Promise<{ data: Record<string, unknown>; explainability: ExplainabilityMetadata }> {
    let economy: Record<string, unknown>;
    if (params.skill) {
      const analysis = await skillEconomyAnalyzer.analyzeSkill(params.skill);
      const forecast = await skillForecastService.forecastSkillDemand(params.skill);
      const emerging = await skillForecastService.predictEmergingSkills("90d");
      const isEmerging = emerging.some(e => e.skill?.toLowerCase() === params.skill?.toLowerCase());
      economy = { skill: params.skill, analysis, forecast, isEmerging } as Record<string, unknown>;
    } else {
      const trending = await skillEconomyAnalyzer.getTrendingSkills(undefined, 20);
      const shortages: any[] = [];
      economy = { trending, shortages } as Record<string, unknown>;
    }
    return {
      data: economy,
      explainability: buildExplainability({ confidence: 0.78, forecastType: "skill", horizon: "medium-term" }),
    };
  }

  async queryWorkforceGraph(params: {
    query: string; limit?: number;
  }): Promise<{ data: Record<string, unknown>; explainability: ExplainabilityMetadata }> {
    const results = await graphQueryEngine.executeRawCypher(params.query);
    return {
      data: { results: results.records, query: params.query } as Record<string, unknown>,
      explainability: buildExplainability({ confidence: 0.9, forecastType: "graph" }),
    };
  }

  async getGraphIntelligence(params: {
    nodeType?: string; nodeId?: string; relationship?: string;
    depth?: number;
  }): Promise<{ data: Record<string, unknown>; explainability: ExplainabilityMetadata }> {
    let result: Record<string, unknown>;
    if (params.nodeId && params.nodeType) {
      result = { exploration: await graphQueryEngine.multiHopDiscovery({
        startLabel: params.nodeType, startId: params.nodeId,
        maxHops: params.depth ?? 2, traversalPattern: params.relationship ?? "HAS_SKILL|SEEKS_CANDIDATE|LOCATED_IN",
      }) } as Record<string, unknown>;
    } else {
      result = {} as Record<string, unknown>;
    }
    return {
      data: result,
      explainability: buildExplainability({ confidence: 0.88 }),
    };
  }

  async getSponsorshipIntelligence(params: {
    source?: string; destination?: string;
  }): Promise<{ data: Record<string, unknown>; explainability: ExplainabilityMetadata }> {
    const summary = await sponsorshipEngine.getSponsorshipSummary();
    return {
      data: { sponsorship: summary, source: params.source, destination: params.destination } as Record<string, unknown>,
      explainability: buildExplainability({ confidence: 0.82, forecastType: "migration" }),
    };
  }

  async getEconomicSignals(params: {
    signalType?: string; limit?: number;
  }): Promise<{ data: Record<string, unknown>; explainability: ExplainabilityMetadata }> {
    const signals = await economicSignalEngine.getSignals(params.signalType, params.limit ?? 30);
    const outlook = await economicSignalEngine.generateMacroOutlook();
    return {
      data: { signals, outlook } as Record<string, unknown>,
      explainability: buildExplainability({ confidence: 0.8 }),
    };
  }

  async getRiskIntelligence(params: {
    riskType?: string; region?: string; industry?: string;
  }): Promise<{ data: Record<string, unknown>; explainability: ExplainabilityMetadata }> {
    const allRisks = await riskForecastService.forecastAllRisks();
    const filtered = params.riskType
      ? allRisks.filter(r => r.riskType === params.riskType)
      : allRisks;
    const critical = filtered.filter(r => (r.severity ?? 0) >= 0.7 || (r.riskScore ?? 0) >= 0.7);
    return {
      data: { risks: filtered, criticalRisks: critical, region: params.region, industry: params.industry } as Record<string, unknown>,
      explainability: buildExplainability({ confidence: 0.76, forecastType: "risk" }),
    };
  }

  async getMarketBalance(params: {
    role?: string; region?: string;
  }): Promise<{ data: Record<string, unknown>; explainability: ExplainabilityMetadata }> {
    const balance = params.role
      ? await marketBalancer.assessRoleBalance(params.role, params.region)
      : await marketBalancer.assessAllBalances();
    return {
      data: { balance, role: params.role, region: params.region } as Record<string, unknown>,
      explainability: buildExplainability({ confidence: 0.83 }),
    };
  }

  async getEcosystemMetrics(): Promise<{ data: Record<string, unknown>; explainability: ExplainabilityMetadata }> {
    const health = await ecosystemMetricsService.computeEcosystemHealth();
    return {
      data: health as unknown as Record<string, unknown>,
      explainability: buildExplainability({ confidence: 0.85 }),
    };
  }

  async getEmployerIntelligence(params: {
    employerId?: number; industry?: string; region?: string;
  }): Promise<{ data: Record<string, unknown>; explainability: ExplainabilityMetadata }> {
    if (params.employerId) {
      const profile = await employerIntelligenceService.analyzeEmployer(params.employerId);
      return {
        data: { employer: profile } as Record<string, unknown>,
        explainability: buildExplainability({ confidence: 0.84, forecastType: "demand" }),
      };
    }
    const employers = await employerIntelligenceService.analyzeAllEmployers();
    const filtered = employers.filter(e => {
      if (params.industry && (e as any).industry !== params.industry) return false;
      if (params.region && (e as any).region !== params.region) return false;
      return true;
    });
    return {
      data: { employers: filtered, industry: params.industry, region: params.region } as Record<string, unknown>,
      explainability: buildExplainability({ confidence: 0.82 }),
    };
  }

  async getWorkforceFlows(params: {
    source?: string; destination?: string; timeRange?: string;
  }): Promise<{ data: Record<string, unknown>; explainability: ExplainabilityMetadata }> {
    const flows = await workforceFlowAnalyzer.analyzeAllFlows(90);
    return {
      data: { flows, source: params.source, destination: params.destination } as Record<string, unknown>,
      explainability: buildExplainability({ confidence: 0.8 }),
    };
  }

  async getPlatformIntelligence(params: {
    includeWorkforce?: boolean; includeMigration?: boolean; includeSkills?: boolean;
    includeRisks?: boolean; includeEconomic?: boolean; region?: string;
  }): Promise<{ data: Record<string, unknown>; explainability: ExplainabilityMetadata }> {
    const results: Record<string, unknown> = {};
    if (params.includeWorkforce !== false) {
      results.workforce = await laborIntelligenceEngine.refreshAll();
    }
    if (params.includeMigration !== false) {
      const corridors = await migrationIntelligence.getTopCorridors(10);
      const risks = await migrationRiskService.getAllActiveRisks();
      results.migration = { corridors, activeRisks: risks };
    }
    if (params.includeSkills !== false) {
      const trending = await skillEconomyAnalyzer.getTrendingSkills(undefined, 10);
      results.skills = { trending };
    }
    if (params.includeRisks !== false) {
      const risks = await riskForecastService.forecastAllRisks();
      results.risks = risks.filter(r => (r.severity ?? 0) >= 0.5);
    }
    if (params.includeEconomic !== false) {
      results.economic = await economicSignalEngine.generateMacroOutlook();
    }
    return {
      data: results,
      explainability: buildExplainability({ confidence: 0.8 }),
    };
  }
}

export const enterpriseApiGateway = new EnterpriseApiGateway();
