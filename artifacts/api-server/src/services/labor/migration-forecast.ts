import { db, migrationForecasts, migrationEvents, corridorMetrics, sponsorshipOutcomes } from "@workspace/db";
import { eq, and, gte, lte, desc, sql, count, avg } from "drizzle-orm";
import { logger } from "../../lib/logger";
import { runCypher } from "../../lib/neo4j";
import { confidenceEngine } from "./confidence-engine";

export interface MigrationForecastResult {
  corridorSource: string;
  corridorDestination: string;
  forecastType: string;
  predictedValue: number;
  predictedChange: number;
  confidenceLower: number;
  confidenceUpper: number;
  confidence: number;
  keyDrivers: string[];
  horizon: string;
}

class MigrationForecastService {
  async forecastCorridorVolume(source: string, destination: string, horizon = "90d"): Promise<MigrationForecastResult> {
    const days = this.horizonToDays(horizon);
    const windowDays = Math.max(days * 2, 180);

    const events = await db
      .select()
      .from(migrationEvents)
      .where(
        and(
          eq(migrationEvents.sourceCountry, source),
          eq(migrationEvents.destinationCountry, destination),
          gte(migrationEvents.createdAt, new Date(Date.now() - windowDays * 86400000)),
        ),
      )
      .orderBy(desc(migrationEvents.createdAt));

    const monthlyVolumes = this.aggregateMonthlyVolumes(events);
    const currentVolume = monthlyVolumes.length > 0 ? monthlyVolumes[monthlyVolumes.length - 1] : 0;
    const growthRate = this.computeGrowthRate(monthlyVolumes);

    const pipelineCount = await this.getPipelineCount(source, destination);
    const pipelineImpact = Math.min(1, pipelineCount / 20) * 0.15;

    const predictedValue = Math.max(0, currentVolume * (1 + growthRate) + pipelineImpact);
    const interval = confidenceEngine.computeConfidenceInterval(
      monthlyVolumes.length > 0 ? monthlyVolumes : [1],
      predictedValue,
    );

    const direction = growthRate > 0.05 ? "growing" : growthRate < -0.05 ? "declining" : "stable";
    const drivers: string[] = [];
    if (pipelineCount > 10) drivers.push(`Active pipeline: ${pipelineCount} candidates`);
    if (growthRate > 0.1) drivers.push(`Accelerating growth (${Math.round(growthRate * 100)}% monthly)`);
    if (pipelineCount > 20) drivers.push("Strong relocation intent signals");

    const result: MigrationForecastResult = {
      corridorSource: source,
      corridorDestination: destination,
      forecastType: "migration_volume",
      predictedValue: Math.round(predictedValue * 100) / 100,
      predictedChange: Math.round(growthRate * 10000) / 100,
      confidenceLower: Math.round(interval.lower * 100) / 100,
      confidenceUpper: Math.round(interval.upper * 100) / 100,
      confidence: interval.confidence,
      keyDrivers: drivers,
      horizon,
    };

    await this.persistForecast(result);
    return result;
  }

  async forecastSponsorshipDemand(source: string, destination: string, horizon = "90d"): Promise<MigrationForecastResult> {
    const days = this.horizonToDays(horizon);
    const windowDays = Math.max(days * 2, 180);

    const outcomes = await db
      .select()
      .from(sponsorshipOutcomes)
      .where(
        and(
          eq(sponsorshipOutcomes.nationality, source),
          eq(sponsorshipOutcomes.destinationCountry, destination),
          gte(sponsorshipOutcomes.createdAt, new Date(Date.now() - windowDays * 86400000)),
        ),
      )
      .orderBy(desc(sponsorshipOutcomes.createdAt));

    const monthlyApps = this.aggregateMonthlyApplications(outcomes);
    const currentRate = monthlyApps.length > 0 ? monthlyApps[monthlyApps.length - 1] : 1;
    const growthRate = this.computeGrowthRate(monthlyApps);

    const seekingCount = await this.getSponsorshipSeekingCount(source, destination);
    const seekingImpact = Math.min(1, seekingCount / 30) * 0.2;

    const predictedValue = Math.max(0, currentRate * (1 + growthRate) + seekingImpact);
    const interval = confidenceEngine.computeConfidenceInterval(
      monthlyApps.length > 0 ? monthlyApps : [1],
      predictedValue,
    );

    const totalApproved = outcomes.filter(o => o.status === "approved").length;
    const totalApps = outcomes.length;
    const approvalRate = totalApps > 0 ? totalApproved / totalApps : 0.5;

    const drivers: string[] = [];
    if (seekingCount > 15) drivers.push(`High sponsorship seeking: ${seekingCount} candidates`);
    if (growthRate > 0.1) drivers.push(`Accelerating application rate (${Math.round(growthRate * 100)}%)`);
    if (approvalRate < 0.4) drivers.push(`Low approval rate (${Math.round(approvalRate * 100)}%) — potential bottleneck`);

    const result: MigrationForecastResult = {
      corridorSource: source,
      corridorDestination: destination,
      forecastType: "sponsorship_demand",
      predictedValue: Math.round(predictedValue * 100) / 100,
      predictedChange: Math.round(growthRate * 10000) / 100,
      confidenceLower: Math.round(interval.lower * 100) / 100,
      confidenceUpper: Math.round(interval.upper * 100) / 100,
      confidence: interval.confidence,
      keyDrivers: drivers,
      horizon,
    };

    await this.persistForecast(result);
    return result;
  }

  async forecastCorridorGrowth(source: string, destination: string, horizon = "180d"): Promise<MigrationForecastResult> {
    const volumeForecast = await this.forecastCorridorVolume(source, destination, horizon);
    const sponsorshipForecast = await this.forecastSponsorshipDemand(source, destination, horizon);

    const combinedValue = (volumeForecast.predictedValue + sponsorshipForecast.predictedValue) / 2;
    const combinedConfidence = Math.min(volumeForecast.confidence, sponsorshipForecast.confidence);

    const drivers = [
      ...volumeForecast.keyDrivers,
      ...sponsorshipForecast.keyDrivers,
    ];

    if (volumeForecast.predictedChange > 0 && sponsorshipForecast.predictedChange > 0) {
      drivers.push("Both volume and sponsorship demand growing — strong corridor momentum");
    }

    const result: MigrationForecastResult = {
      corridorSource: source,
      corridorDestination: destination,
      forecastType: "corridor_growth",
      predictedValue: Math.round(combinedValue * 100) / 100,
      predictedChange: Math.round((volumeForecast.predictedChange + sponsorshipForecast.predictedChange) / 2 * 100) / 100,
      confidenceLower: Math.round((volumeForecast.confidenceLower + sponsorshipForecast.confidenceLower) / 2 * 100) / 100,
      confidenceUpper: Math.round((volumeForecast.confidenceUpper + sponsorshipForecast.confidenceUpper) / 2 * 100) / 100,
      confidence: combinedConfidence,
      keyDrivers: drivers.slice(0, 5),
      horizon,
    };

    await this.persistForecast(result);
    return result;
  }

  async forecastAllCorridors(horizon = "90d"): Promise<MigrationForecastResult[]> {
    const corridors = await db
      .select({
        source: corridorMetrics.sourceCountry,
        destination: corridorMetrics.destinationCountry,
      })
      .from(corridorMetrics)
      .groupBy(corridorMetrics.sourceCountry, corridorMetrics.destinationCountry)
      .orderBy(desc(corridorMetrics.healthScore))
      .limit(20);

    const results: MigrationForecastResult[] = [];
    for (const c of corridors) {
      try {
        results.push(await this.forecastCorridorVolume(c.source, c.destination, horizon));
      } catch (err) {
        logger.error({ err, corridor: c }, "Failed to forecast corridor");
      }
    }
    return results;
  }

  async getForecastHistory(forecastType?: string, limit = 50): Promise<Array<Record<string, unknown>>> {
    const conditions = [gte(migrationForecasts.createdAt, new Date(Date.now() - 365 * 86400000))];
    if (forecastType) conditions.push(eq(migrationForecasts.forecastType, forecastType));
    return db
      .select()
      .from(migrationForecasts)
      .where(and(...conditions))
      .orderBy(desc(migrationForecasts.createdAt))
      .limit(limit);
  }

  private async getPipelineCount(source: string, destination: string): Promise<number> {
    try {
      const result = await runCypher(
        `MATCH (c:Candidate)-[:LOCATED_IN]->(src:Location {name: $source})
         MATCH (c)-[:INTERESTED_IN]->(int:IntentSignal {type: "relocation_intent"})
         RETURN count(DISTINCT c) AS count`,
        { source: source.toLowerCase() },
      );
      return (result[0]?.count as number) || 0;
    } catch { return 0; }
  }

  private async getSponsorshipSeekingCount(source: string, destination: string): Promise<number> {
    try {
      const result = await runCypher(
        `MATCH (c:Candidate)-[:LOCATED_IN]->(src:Location {name: $source})
         MATCH (c)-[:INTERESTED_IN]->(int:IntentSignal {type: "sponsorship_seeking"})
         RETURN count(DISTINCT c) AS count`,
        { source: source.toLowerCase() },
      );
      return (result[0]?.count as number) || 0;
    } catch { return 0; }
  }

  private aggregateMonthlyVolumes(events: Array<{ createdAt: Date | null }>): number[] {
    const monthly = new Map<string, number>();
    for (const e of events) {
      if (!e.createdAt) continue;
      const key = `${e.createdAt.getFullYear()}-${e.createdAt.getMonth()}`;
      monthly.set(key, (monthly.get(key) || 0) + 1);
    }
    return Array.from(monthly.values()).sort((a, b) => a - b);
  }

  private aggregateMonthlyApplications(outcomes: Array<{ createdAt: Date | null }>): number[] {
    const monthly = new Map<string, number>();
    for (const o of outcomes) {
      if (!o.createdAt) continue;
      const key = `${o.createdAt.getFullYear()}-${o.createdAt.getMonth()}`;
      monthly.set(key, (monthly.get(key) || 0) + 1);
    }
    return Array.from(monthly.values()).sort((a, b) => a - b);
  }

  private computeGrowthRate(values: number[]): number {
    if (values.length < 3) return 0;
    const recent = values.slice(-3);
    const prior = values.slice(0, 3);
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const priorAvg = prior.reduce((a, b) => a + b, 0) / prior.length;
    return priorAvg > 0 ? (recentAvg - priorAvg) / priorAvg : 0;
  }

  private async persistForecast(result: MigrationForecastResult): Promise<void> {
    try {
      await db.insert(migrationForecasts).values({
        corridorSource: result.corridorSource,
        corridorDestination: result.corridorDestination,
        forecastType: result.forecastType,
        forecastPeriod: result.horizon,
        predictedValue: result.predictedValue,
        confidenceLower: result.confidenceLower,
        confidenceUpper: result.confidenceUpper,
        confidence: result.confidence,
        keyDrivers: result.keyDrivers,
        metadata: { predictedChange: result.predictedChange },
      });
    } catch (err) {
      logger.error({ err, result }, "Failed to persist migration forecast");
    }
  }

  private horizonToDays(horizon: string): number {
    const map: Record<string, number> = { "30d": 30, "90d": 90, "180d": 180, "1y": 365 };
    return map[horizon] || 90;
  }
}

export const migrationForecastService = new MigrationForecastService();
