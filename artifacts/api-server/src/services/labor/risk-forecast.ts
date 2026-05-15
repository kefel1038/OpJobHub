import { db, laborForecasts, migrationForecasts, skillForecasts, forecastScenarios, laborMetrics, migrationEvents, sponsorshipOutcomes } from "@workspace/db";
import { eq, and, gte, lte, desc, sql, count, avg } from "drizzle-orm";
import { logger } from "../../lib/logger";
import { confidenceEngine } from "./confidence-engine";

export interface RiskForecastResult {
  riskType: string;
  riskName: string;
  targetName?: string;
  region?: string;
  industry?: string;
  probability: number;
  severity: number;
  riskScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  timeframe: string;
  keyDrivers: string[];
  mitigationStrategies: string[];
  confidence: number;
}

class RiskForecastService {
  async forecastLaborShortageRisk(role: string, region?: string, horizon = "90d"): Promise<RiskForecastResult> {
    const days = this.horizonToDays(horizon);
    const windowDays = Math.max(days * 2, 180);

    const demandMetrics = await db
      .select()
      .from(laborMetrics)
      .where(
        and(
          eq(laborMetrics.metricType, "demand_index"),
          eq(laborMetrics.role || "", role),
          gte(laborMetrics.createdAt, new Date(Date.now() - windowDays * 86400000)),
        ),
      )
      .orderBy(desc(laborMetrics.createdAt))
      .limit(30);

    const supplyMetrics = await db
      .select()
      .from(laborMetrics)
      .where(
        and(
          eq(laborMetrics.metricType, "supply_index"),
          eq(laborMetrics.role || "", role),
          gte(laborMetrics.createdAt, new Date(Date.now() - windowDays * 86400000)),
        ),
      )
      .orderBy(desc(laborMetrics.createdAt))
      .limit(30);

    const demandVals = demandMetrics.map(m => m.metricValue).filter((v): v is number => v !== null);
    const supplyVals = supplyMetrics.map(m => m.metricValue).filter((v): v is number => v !== null);
    const currentDemand = demandVals[0] || 0.5;
    const currentSupply = supplyVals[0] || 0.5;
    const currentScarcity = Math.max(0, currentDemand - currentSupply);

    const demandGrowth = this.computeGrowthRate(demandVals);
    const supplyGrowth = this.computeGrowthRate(supplyVals);

    let probability = currentScarcity;
    let severity = currentScarcity;

    if (demandGrowth > supplyGrowth) {
      probability += 0.15;
      severity += 0.1;
    }
    if (currentDemand > 0.7 && currentSupply < 0.3) {
      probability += 0.2;
      severity += 0.2;
    }

    probability = Math.min(1, probability);
    severity = Math.min(1, severity);
    const riskScore = probability * 0.4 + severity * 0.6;

    const label = region ? `${role} in ${region}` : role;
    const drivers: string[] = [];
    if (currentScarcity > 0.2) drivers.push(`Existing scarcity gap: ${Math.round(currentScarcity * 100)}%`);
    if ((demandGrowth - supplyGrowth) > 0.05) drivers.push("Demand growth outpacing supply");
    if (currentDemand > 0.7) drivers.push("Critical demand levels");
    if (currentSupply < 0.3) drivers.push("Critically low supply");

    return {
      riskType: "labor_shortage",
      riskName: `${label} shortage risk`,
      targetName: label,
      region,
      probability: Math.round(probability * 100) / 100,
      severity: Math.round(severity * 100) / 100,
      riskScore: Math.round(riskScore * 100) / 100,
      riskLevel: this.calculateRiskLevel(riskScore),
      timeframe: horizon,
      keyDrivers: drivers,
      mitigationStrategies: [
        "Expand sourcing channels to underutilized corridors",
        "Invest in upskilling and reskilling programs",
        "Adjust compensation packages to attract scarce talent",
      ],
      confidence: demandVals.length > 10 ? 0.7 : 0.4,
    };
  }

  async forecastChurnRisk(industry?: string, region?: string, horizon = "90d"): Promise<RiskForecastResult> {
    const days = this.horizonToDays(horizon);
    const conditions = [
      gte(sponsorshipOutcomes.createdAt, new Date(Date.now() - days * 86400000)),
    ];
    if (industry) conditions.push(eq(sponsorshipOutcomes.visaType || "", industry));

    const outcomes = await db
      .select()
      .from(sponsorshipOutcomes)
      .where(and(...conditions));

    const earlyChurn = outcomes.filter(o => (o.retentionDays ?? 999) < 90).length;
    const total = outcomes.length;
    const churnRate = total > 0 ? earlyChurn / total : 0.2;

    const probability = Math.min(1, churnRate * 1.2);
    const severity = Math.min(1, churnRate * 1.5);

    const label = industry ? `${industry} churn risk` : region ? `${region} churn risk` : "workforce churn risk";
    const drivers: string[] = [];
    if (churnRate > 0.3) drivers.push(`High early churn rate: ${Math.round(churnRate * 100)}%`);
    if (total < 10) drivers.push("Limited data — estimate may improve with more outcomes");

    return {
      riskType: "churn_spike",
      riskName: label,
      industry,
      region,
      probability: Math.round(probability * 100) / 100,
      severity: Math.round(severity * 100) / 100,
      riskScore: Math.round((probability * 0.4 + severity * 0.6) * 100) / 100,
      riskLevel: this.calculateRiskLevel(probability * 0.4 + severity * 0.6),
      timeframe: horizon,
      keyDrivers: drivers,
      mitigationStrategies: [
        "Implement retention bonuses for first 90 days",
        "Strengthen onboarding and integration programs",
        "Conduct stay interviews at 30/60/90 day milestones",
      ],
      confidence: total > 20 ? 0.7 : 0.4,
    };
  }

  async forecastCorridorInstability(source: string, destination: string, horizon = "90d"): Promise<RiskForecastResult> {
    const days = this.horizonToDays(horizon);
    const windowDays = Math.max(days * 2, 180);

    const failedEvents = await db
      .select({ count: count() })
      .from(migrationEvents)
      .where(
        and(
          eq(migrationEvents.sourceCountry, source),
          eq(migrationEvents.destinationCountry, destination),
          eq(migrationEvents.eventType, "relocation_failed"),
          gte(migrationEvents.createdAt, new Date(Date.now() - windowDays * 86400000)),
        ),
      )
      .then(r => r[0]?.count || 0);

    const completedEvents = await db
      .select({ count: count() })
      .from(migrationEvents)
      .where(
        and(
          eq(migrationEvents.sourceCountry, source),
          eq(migrationEvents.destinationCountry, destination),
          eq(migrationEvents.eventType, "relocation_completed"),
          gte(migrationEvents.createdAt, new Date(Date.now() - windowDays * 86400000)),
        ),
      )
      .then(r => r[0]?.count || 0);

    const totalEvents = failedEvents + completedEvents;
    const failureRate = totalEvents > 0 ? failedEvents / totalEvents : 0.1;

    const rejectionRows = await db
      .select({
        rejected: sql`count(CASE WHEN ${sponsorshipOutcomes.status} = 'rejected' THEN 1 END)`,
        total: count(),
      })
      .from(sponsorshipOutcomes)
      .where(
        and(
          eq(sponsorshipOutcomes.nationality, source),
          eq(sponsorshipOutcomes.destinationCountry, destination),
          gte(sponsorshipOutcomes.createdAt, new Date(Date.now() - windowDays * 86400000)),
        ),
      );

    const rejectionRate = Number(rejectionRows[0]?.total) > 0
      ? Number(rejectionRows[0]?.rejected) / Number(rejectionRows[0]?.total)
      : 0.1;

    const probability = Math.min(1, failureRate * 0.5 + rejectionRate * 0.5);
    const severity = Math.min(1, failureRate * 0.6 + rejectionRate * 0.4);
    const riskScore = probability * 0.4 + severity * 0.6;

    const label = `${source} → ${destination}`;
    const drivers: string[] = [];
    if (failureRate > 0.2) drivers.push(`Relocation failure rate: ${Math.round(failureRate * 100)}%`);
    if (rejectionRate > 0.3) drivers.push(`Visa rejection rate: ${Math.round(rejectionRate * 100)}%`);
    if (totalEvents < 5) drivers.push("Limited historical data — monitor closely");

    return {
      riskType: "corridor_instability",
      riskName: `${label} instability risk`,
      targetName: label,
      probability: Math.round(probability * 100) / 100,
      severity: Math.round(severity * 100) / 100,
      riskScore: Math.round(riskScore * 100) / 100,
      riskLevel: this.calculateRiskLevel(riskScore),
      timeframe: horizon,
      keyDrivers: drivers,
      mitigationStrategies: [
        "Engage specialized relocation agency for this corridor",
        "Provide enhanced pre-departure orientation",
        "Establish post-arrival support network",
      ],
      confidence: totalEvents > 10 ? 0.7 : 0.4,
    };
  }

  async forecastSponsorshipBottleneck(nationality: string, destinationCountry: string, horizon = "90d"): Promise<RiskForecastResult> {
    const days = this.horizonToDays(horizon);
    const windowDays = Math.max(days * 2, 180);

    const rows = await db
      .select({
        rejected: sql`count(CASE WHEN ${sponsorshipOutcomes.status} = 'rejected' THEN 1 END)`,
        approved: sql`count(CASE WHEN ${sponsorshipOutcomes.status} = 'approved' THEN 1 END)`,
        total: count(),
        avgProcessing: avg(sponsorshipOutcomes.processingDays),
      })
      .from(sponsorshipOutcomes)
      .where(
        and(
          eq(sponsorshipOutcomes.nationality, nationality),
          eq(sponsorshipOutcomes.destinationCountry, destinationCountry),
          gte(sponsorshipOutcomes.createdAt, new Date(Date.now() - windowDays * 86400000)),
        ),
      );

    const total = Number(rows[0]?.total) || 0;
    const rejected = Number(rows[0]?.rejected) || 0;
    const approved = Number(rows[0]?.approved) || 0;
    const rejectionRate = total > 0 ? rejected / total : 0.1;
    const avgProcessing = Number(rows[0]?.avgProcessing) || 30;

    let probability = rejectionRate;
    let severity = 0.3;

    if (rejectionRate > 0.3) {
      probability += 0.2;
      severity += 0.2;
    }
    if (avgProcessing > 60) {
      probability += 0.1;
      severity += 0.2;
    }
    if (approved === 0 && total > 5) {
      probability += 0.2;
      severity += 0.3;
    }

    probability = Math.min(1, probability);
    severity = Math.min(1, severity);
    const riskScore = probability * 0.5 + severity * 0.5;

    const label = `${nationality} → ${destinationCountry}`;
    const drivers: string[] = [];
    if (rejectionRate > 0.3) drivers.push(`High rejection rate: ${Math.round(rejectionRate * 100)}%`);
    if (avgProcessing > 60) drivers.push(`Slow processing: ${Math.round(avgProcessing)} days avg`);
    if (total < 10) drivers.push("Limited sample size");

    return {
      riskType: "sponsorship_bottleneck",
      riskName: `${label} sponsorship bottleneck`,
      targetName: label,
      probability: Math.round(probability * 100) / 100,
      severity: Math.round(severity * 100) / 100,
      riskScore: Math.round(riskScore * 100) / 100,
      riskLevel: this.calculateRiskLevel(riskScore),
      timeframe: horizon,
      keyDrivers: drivers,
      mitigationStrategies: [
        "Review documentation quality for this nationality",
        "Engage immigration legal specialist",
        "Consider alternative visa pathways",
      ],
      confidence: total > 15 ? 0.7 : 0.4,
    };
  }

  async forecastWorkforceSaturation(role: string, region?: string, horizon = "90d"): Promise<RiskForecastResult> {
    const supplyForecast = await this.getSupplyForecast(role, region, horizon);
    const demandForecast = await this.getDemandForecast(role, region, horizon);

    const supplyExceedsDemand = supplyForecast > demandForecast;
    const gap = Math.max(0, supplyForecast - demandForecast);

    const probability = Math.min(1, gap * 1.5);
    const severity = supplyExceedsDemand ? Math.min(1, gap) : 0.2;

    const label = region ? `${role} in ${region}` : role;
    const drivers: string[] = [];
    if (supplyExceedsDemand) drivers.push(`Supply projected to exceed demand by ${Math.round(gap * 100)}%`);
    if (supplyForecast > 0.7) drivers.push("High supply concentration risk");

    return {
      riskType: "workforce_saturation",
      riskName: `${label} saturation risk`,
      targetName: label,
      region,
      probability: Math.round(probability * 100) / 100,
      severity: Math.round(severity * 100) / 100,
      riskScore: Math.round((probability * 0.4 + severity * 0.6) * 100) / 100,
      riskLevel: this.calculateRiskLevel(probability * 0.4 + severity * 0.6),
      timeframe: horizon,
      keyDrivers: drivers,
      mitigationStrategies: [
        "Diversify recruitment across adjacent skill areas",
        "Focus on quality over quantity in sourcing",
        "Develop specialization pathways to differentiate candidates",
      ],
      confidence: 0.5,
    };
  }

  async forecastAllRisks(horizon = "90d"): Promise<RiskForecastResult[]> {
    const results: RiskForecastResult[] = [];

    const topRoles = await db
      .select({ role: laborMetrics.role })
      .from(laborMetrics)
      .where(eq(laborMetrics.metricType, "demand_index"))
      .groupBy(laborMetrics.role)
      .orderBy(desc(sql`max(${laborMetrics.metricValue})`))
      .limit(5)
      .then(rows => rows.map(r => r.role).filter(Boolean) as string[]);

    for (const role of topRoles) {
      try {
        results.push(await this.forecastLaborShortageRisk(role, undefined, horizon));
        results.push(await this.forecastWorkforceSaturation(role, undefined, horizon));
      } catch (err) {
        logger.error({ err, role }, "Failed to forecast risk for role");
      }
    }

    try {
      results.push(await this.forecastChurnRisk(undefined, undefined, horizon));
    } catch (err) {
      logger.error({ err }, "Failed to forecast churn risk");
    }

    return results;
  }

  private async getSupplyForecast(role: string, region?: string, horizon = "90d"): Promise<number> {
    const metrics = await db
      .select()
      .from(laborMetrics)
      .where(
        and(
          eq(laborMetrics.metricType, "supply_index"),
          eq(laborMetrics.role || "", role),
          gte(laborMetrics.createdAt, new Date(Date.now() - 180 * 86400000)),
        ),
      )
      .orderBy(desc(laborMetrics.createdAt))
      .limit(10);
    const vals = metrics.map(m => m.metricValue).filter((v): v is number => v !== null);
    const growth = this.computeGrowthRate(vals);
    return vals.length > 0 ? vals[0] * (1 + growth) : 0.5;
  }

  private async getDemandForecast(role: string, region?: string, horizon = "90d"): Promise<number> {
    const metrics = await db
      .select()
      .from(laborMetrics)
      .where(
        and(
          eq(laborMetrics.metricType, "demand_index"),
          eq(laborMetrics.role || "", role),
          gte(laborMetrics.createdAt, new Date(Date.now() - 180 * 86400000)),
        ),
      )
      .orderBy(desc(laborMetrics.createdAt))
      .limit(10);
    const vals = metrics.map(m => m.metricValue).filter((v): v is number => v !== null);
    const growth = this.computeGrowthRate(vals);
    return vals.length > 0 ? vals[0] * (1 + growth) : 0.5;
  }

  private computeGrowthRate(values: number[]): number {
    if (values.length < 3) return 0;
    const recent = values.slice(0, Math.min(5, values.length));
    const older = values.slice(-Math.min(5, values.length));
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    return olderAvg > 0 ? (recentAvg - olderAvg) / olderAvg : 0;
  }

  private calculateRiskLevel(score: number): "low" | "medium" | "high" | "critical" {
    if (score >= 0.7) return "critical";
    if (score >= 0.5) return "high";
    if (score >= 0.3) return "medium";
    return "low";
  }

  private horizonToDays(horizon: string): number {
    const map: Record<string, number> = { "30d": 30, "90d": 90, "180d": 180, "1y": 365 };
    return map[horizon] || 90;
  }
}

export const riskForecastService = new RiskForecastService();
