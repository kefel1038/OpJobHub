import { db, laborForecasts, laborMetrics, employerMetrics, discoveredCandidates, jobs } from "@workspace/db";
import { eq, and, gte, lte, desc, sql, count, avg } from "drizzle-orm";
import { logger } from "../../lib/logger";
import { confidenceEngine } from "./confidence-engine";

export interface DemandForecastResult {
  forecastType: string;
  targetName: string;
  targetType: "role" | "industry" | "region" | "employer";
  currentValue: number;
  predictedValue: number;
  predictedChange: number;
  confidenceLower: number;
  confidenceUpper: number;
  confidence: number;
  volatility: number;
  trendDirection: "up" | "down" | "stable" | "volatile";
  keyDrivers: string[];
  horizon: string;
}

class DemandForecastService {
  async forecastRoleDemand(role: string, horizon = "90d"): Promise<DemandForecastResult> {
    const days = this.horizonToDays(horizon);
    const windowDays = Math.max(days * 2, 90);

    const metrics = await db
      .select()
      .from(laborMetrics)
      .where(
        and(
          eq(laborMetrics.metricType, "demand_index"),
          eq(laborMetrics.role, role),
          gte(laborMetrics.createdAt, new Date(Date.now() - windowDays * 86400000)),
        ),
      )
      .orderBy(desc(laborMetrics.createdAt))
      .limit(30);

    const historicalValues = metrics.map(m => m.metricValue).filter((v): v is number => v !== null);
    const currentValue = historicalValues[0] || 0.5;

    const candidateCount = await db
      .select({ count: count() })
      .from(discoveredCandidates)
      .where(
        and(
          eq(discoveredCandidates.industry, role),
          gte(discoveredCandidates.createdAt, new Date(Date.now() - days * 86400000)),
        ),
      )
      .then(r => r[0]?.count || 0);

    const growthRate = this.computeGrowthRate(historicalValues);
    const momentum = Math.min(1, candidateCount / 50) * 0.15;
    const basePrediction = currentValue * (1 + growthRate) + momentum;
    const predictedValue = Math.max(0, Math.min(1, basePrediction));

    const interval = confidenceEngine.computeConfidenceInterval(historicalValues, predictedValue);
    const direction = this.determineDirection(predictedValue, currentValue, interval.volatility);

    const drivers: string[] = [];
    if (candidateCount > 20) drivers.push("Rising candidate pool");
    if (growthRate > 0.05) drivers.push("Accelerating demand growth");
    if (growthRate < -0.05) drivers.push("Declining demand signal");
    if (interval.volatility > 0.3) drivers.push("High market volatility");
    if (drivers.length === 0) drivers.push("Stable demand pattern");

    const result: DemandForecastResult = {
      forecastType: "hiring_demand",
      targetName: role,
      targetType: "role",
      currentValue: Math.round(currentValue * 100) / 100,
      predictedValue: Math.round(predictedValue * 100) / 100,
      predictedChange: Math.round((predictedValue - currentValue) / Math.max(currentValue, 0.01) * 10000) / 100,
      confidenceLower: Math.round(interval.lower * 100) / 100,
      confidenceUpper: Math.round(interval.upper * 100) / 100,
      confidence: interval.confidence,
      volatility: interval.volatility,
      trendDirection: direction,
      keyDrivers: drivers,
      horizon,
    };

    await this.persistForecast(result);
    return result;
  }

  async forecastIndustryDemand(industry: string, region?: string, horizon = "90d"): Promise<DemandForecastResult> {
    const days = this.horizonToDays(horizon);
    const windowDays = Math.max(days * 2, 90);

    const conditions = [
      eq(laborMetrics.metricType, "demand_index"),
      eq(laborMetrics.industry, industry),
      gte(laborMetrics.createdAt, new Date(Date.now() - windowDays * 86400000)),
    ];
    if (region) conditions.push(eq(laborMetrics.region, region));

    const metrics = await db
      .select()
      .from(laborMetrics)
      .where(and(...conditions))
      .orderBy(desc(laborMetrics.createdAt))
      .limit(30);

    const historicalValues = metrics.map(m => m.metricValue).filter((v): v is number => v !== null);
    const currentValue = historicalValues[0] || 0.5;

    const jobCount = await db
      .select({ count: count() })
      .from(jobs)
      .where(
        and(
          eq(jobs.industry, industry),
          gte(jobs.createdAt, new Date(Date.now() - days * 86400000)),
        ),
      )
      .then(r => r[0]?.count || 0);

    const growthRate = this.computeGrowthRate(historicalValues);
    const jobMomentum = Math.min(1, jobCount / 100) * 0.1;
    const basePrediction = currentValue * (1 + growthRate) + jobMomentum;
    const predictedValue = Math.max(0, Math.min(1, basePrediction));

    const interval = confidenceEngine.computeConfidenceInterval(historicalValues, predictedValue);
    const direction = this.determineDirection(predictedValue, currentValue, interval.volatility);

    const label = region ? `${industry} in ${region}` : industry;
    const drivers: string[] = [];
    if (jobCount > 30) drivers.push(`Active job postings: ${jobCount}`);
    if (growthRate > 0.05) drivers.push("Industry demand accelerating");
    if (interval.volatility > 0.3) drivers.push("Demand volatility elevated");

    const result: DemandForecastResult = {
      forecastType: "hiring_demand",
      targetName: label,
      targetType: "industry",
      currentValue: Math.round(currentValue * 100) / 100,
      predictedValue: Math.round(predictedValue * 100) / 100,
      predictedChange: Math.round((predictedValue - currentValue) / Math.max(currentValue, 0.01) * 10000) / 100,
      confidenceLower: Math.round(interval.lower * 100) / 100,
      confidenceUpper: Math.round(interval.upper * 100) / 100,
      confidence: interval.confidence,
      volatility: interval.volatility,
      trendDirection: direction,
      keyDrivers: drivers,
      horizon,
    };

    await this.persistForecast(result);
    return result;
  }

  async forecastRegionalDemand(region: string, horizon = "90d"): Promise<DemandForecastResult> {
    return this.forecastIndustryDemand("*", region, horizon);
  }

  async forecastEmployerDemand(employerId: number, horizon = "90d"): Promise<DemandForecastResult> {
    const days = this.horizonToDays(horizon);
    const windowDays = Math.max(days * 2, 90);
    const nameLabel = `employer_${employerId}`;

    const metrics = await db
      .select()
      .from(employerMetrics)
      .where(
        and(
          eq(employerMetrics.employerId, employerId),
          gte(employerMetrics.createdAt, new Date(Date.now() - windowDays * 86400000)),
        ),
      )
      .orderBy(desc(employerMetrics.createdAt))
      .limit(30);

    const hiringVelocities = metrics.map(m => m.metricValue).filter((v): v is number => v !== null);
    const currentVelocity = hiringVelocities[0] || 0.5;
    const growthRate = this.computeGrowthRate(hiringVelocities);

    const activeJobs = await db
      .select({ count: count() })
      .from(jobs)
      .where(
        and(
          eq(jobs.companyId, employerId),
          gte(jobs.createdAt, new Date(Date.now() - days * 86400000)),
        ),
      )
      .then(r => r[0]?.count || 0);

    const predictedVelocity = Math.max(0, Math.min(1, currentVelocity * (1 + growthRate) + Math.min(1, activeJobs / 20) * 0.1));
    const interval = confidenceEngine.computeConfidenceInterval(hiringVelocities, predictedVelocity);
    const direction = this.determineDirection(predictedVelocity, currentVelocity, interval.volatility);

    const result: DemandForecastResult = {
      forecastType: "hiring_demand",
      targetName: nameLabel,
      targetType: "employer",
      currentValue: Math.round(currentVelocity * 100) / 100,
      predictedValue: Math.round(predictedVelocity * 100) / 100,
      predictedChange: Math.round((predictedVelocity - currentVelocity) / Math.max(currentVelocity, 0.01) * 10000) / 100,
      confidenceLower: Math.round(interval.lower * 100) / 100,
      confidenceUpper: Math.round(interval.upper * 100) / 100,
      confidence: interval.confidence,
      volatility: interval.volatility,
      trendDirection: direction,
      keyDrivers: [`Active job postings: ${activeJobs}`, growthRate > 0 ? "Expanding hiring" : "Contracting hiring"],
      horizon,
    };

    await this.persistForecast(result);
    return result;
  }

  async forecastLaborShortage(role: string, region?: string, horizon = "90d"): Promise<DemandForecastResult> {
    const days = this.horizonToDays(horizon);
    const windowDays = Math.max(days * 2, 90);

    const demandMetrics = await db
      .select()
      .from(laborMetrics)
      .where(
        and(
          eq(laborMetrics.metricType, "demand_index"),
          eq(laborMetrics.role, role),
          gte(laborMetrics.createdAt, new Date(Date.now() - windowDays * 86400000)),
        ),
      )
      .orderBy(desc(laborMetrics.createdAt))
      .limit(20);

    const supplyMetrics = await db
      .select()
      .from(laborMetrics)
      .where(
        and(
          eq(laborMetrics.metricType, "supply_index"),
          eq(laborMetrics.role, role),
          gte(laborMetrics.createdAt, new Date(Date.now() - windowDays * 86400000)),
        ),
      )
      .orderBy(desc(laborMetrics.createdAt))
      .limit(20);

    const demandVals = demandMetrics.map(m => m.metricValue).filter((v): v is number => v !== null);
    const supplyVals = supplyMetrics.map(m => m.metricValue).filter((v): v is number => v !== null);

    const currentDemand = demandVals[0] || 0.5;
    const currentSupply = supplyVals[0] || 0.5;
    const scarcityIndex = Math.max(0, currentDemand - currentSupply);

    const demandGrowth = this.computeGrowthRate(demandVals);
    const supplyGrowth = this.computeGrowthRate(supplyVals);
    const predictedScarcity = Math.max(0, Math.min(1, scarcityIndex + (demandGrowth - supplyGrowth)));

    const combined = [...demandVals, ...supplyVals];
    const interval = confidenceEngine.computeConfidenceInterval(combined.length > 0 ? combined : [0.5], predictedScarcity);
    const direction = predictedScarcity > scarcityIndex ? "up" : predictedScarcity < scarcityIndex ? "down" : "stable";

    const label = region ? `${role} in ${region}` : role;
    const drivers: string[] = [];
    if (predictedScarcity > 0.3) drivers.push("Significant talent gap expected");
    if (demandGrowth > supplyGrowth) drivers.push("Demand outpacing supply growth");
    if (interval.volatility > 0.3) drivers.push("High market uncertainty");

    const result: DemandForecastResult = {
      forecastType: "labor_shortage",
      targetName: label,
      targetType: "role",
      currentValue: Math.round(scarcityIndex * 100) / 100,
      predictedValue: Math.round(predictedScarcity * 100) / 100,
      predictedChange: Math.round((predictedScarcity - scarcityIndex) * 100) / 100,
      confidenceLower: Math.round(interval.lower * 100) / 100,
      confidenceUpper: Math.round(interval.upper * 100) / 100,
      confidence: interval.confidence,
      volatility: interval.volatility,
      trendDirection: direction,
      keyDrivers: drivers,
      horizon,
    };

    await this.persistForecast(result);
    return result;
  }

  async forecastWagePressure(role: string, region?: string, horizon = "90d"): Promise<DemandForecastResult> {
    const days = this.horizonToDays(horizon);
    const windowDays = Math.max(days * 2, 90);

    const metrics = await db
      .select()
      .from(laborMetrics)
      .where(
        and(
          eq(laborMetrics.metricType, "wage_pressure"),
          eq(laborMetrics.role, role),
          gte(laborMetrics.createdAt, new Date(Date.now() - windowDays * 86400000)),
        ),
      )
      .orderBy(desc(laborMetrics.createdAt))
      .limit(20);

    const values = metrics.map(m => m.metricValue).filter((v): v is number => v !== null);
    const currentPressure = values[0] || 0.3;
    const growthRate = this.computeGrowthRate(values);

    const demandForecast = await this.forecastRoleDemand(role, horizon);
    const demandImpact = (demandForecast.predictedValue - 0.5) * 0.3;
    const predictedPressure = Math.max(0, Math.min(1, currentPressure * (1 + growthRate) + demandImpact));

    const interval = confidenceEngine.computeConfidenceInterval(values.length > 0 ? values : [0.3], predictedPressure);
    const direction = this.determineDirection(predictedPressure, currentPressure, interval.volatility);

    const label = region ? `${role} in ${region}` : role;
    const result: DemandForecastResult = {
      forecastType: "wage_pressure",
      targetName: label,
      targetType: "role",
      currentValue: Math.round(currentPressure * 100) / 100,
      predictedValue: Math.round(predictedPressure * 100) / 100,
      predictedChange: Math.round((predictedPressure - currentPressure) / Math.max(currentPressure, 0.01) * 10000) / 100,
      confidenceLower: Math.round(interval.lower * 100) / 100,
      confidenceUpper: Math.round(interval.upper * 100) / 100,
      confidence: interval.confidence,
      volatility: interval.volatility,
      trendDirection: direction,
      keyDrivers: [
        demandForecast.trendDirection === "up" ? "Rising demand driving wages" : "Stable demand environment",
        growthRate > 0.05 ? "Existing wage acceleration" : "Contained wage growth",
      ],
      horizon,
    };

    await this.persistForecast(result);
    return result;
  }

  async forecastAll(horizon = "90d"): Promise<DemandForecastResult[]> {
    const results: DemandForecastResult[] = [];
    const topRoles = await db
      .select({ role: laborMetrics.role })
      .from(laborMetrics)
      .where(eq(laborMetrics.metricType, "demand_index"))
      .groupBy(laborMetrics.role)
      .orderBy(desc(sql`max(${laborMetrics.metricValue})`))
      .limit(10)
      .then(rows => rows.map(r => r.role).filter(Boolean) as string[]);

    for (const role of topRoles) {
      try {
        results.push(await this.forecastRoleDemand(role, horizon));
        results.push(await this.forecastLaborShortage(role, undefined, horizon));
        results.push(await this.forecastWagePressure(role, undefined, horizon));
      } catch (err) {
        logger.error({ err, role }, "Failed to forecast role demand");
      }
    }
    return results;
  }

  async getForecastHistory(forecastType?: string, limit = 50): Promise<Array<Record<string, unknown>>> {
    const conditions = [gte(laborForecasts.createdAt, new Date(Date.now() - 365 * 86400000))];
    if (forecastType) conditions.push(eq(laborForecasts.forecastType, forecastType));
    return db
      .select()
      .from(laborForecasts)
      .where(and(...conditions))
      .orderBy(desc(laborForecasts.createdAt))
      .limit(limit);
  }

  private computeGrowthRate(values: number[]): number {
    if (values.length < 4) return 0;
    const recent = values.slice(0, Math.min(7, values.length));
    const older = values.slice(-Math.min(7, values.length));
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    return olderAvg > 0 ? (recentAvg - olderAvg) / olderAvg : 0;
  }

  private determineDirection(predicted: number, current: number, volatility: number): "up" | "down" | "stable" | "volatile" {
    if (volatility > 0.4) return "volatile";
    const change = (predicted - current) / Math.max(current, 0.01);
    if (change > 0.05) return "up";
    if (change < -0.05) return "down";
    return "stable";
  }

  private async persistForecast(result: DemandForecastResult): Promise<void> {
    try {
      await db.insert(laborForecasts).values({
        forecastType: result.forecastType,
        targetName: result.targetName,
        targetId: result.targetName,
        region: result.targetType === "region" ? result.targetName : null,
        industry: result.targetType === "industry" ? result.targetName : null,
        role: result.targetType === "role" ? result.targetName : null,
        forecastPeriod: result.horizon,
        predictedValue: result.predictedValue,
        predictedChange: result.predictedChange,
        confidenceLower: result.confidenceLower,
        confidenceUpper: result.confidenceUpper,
        confidence: result.confidence,
        volatility: result.volatility,
        trendDirection: result.trendDirection,
        keyDrivers: result.keyDrivers,
        metadata: { currentValue: result.currentValue, targetType: result.targetType },
      });
    } catch (err) {
      logger.error({ err, result }, "Failed to persist demand forecast");
    }
  }

  private horizonToDays(horizon: string): number {
    const map: Record<string, number> = { "30d": 30, "90d": 90, "180d": 180, "1y": 365 };
    return map[horizon] || 90;
  }
}

export const demandForecastService = new DemandForecastService();
