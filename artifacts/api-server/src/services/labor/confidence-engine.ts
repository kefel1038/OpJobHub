import { db, forecastAccuracy, laborForecasts, migrationForecasts, skillForecasts } from "@workspace/db";
import { eq, and, gte, lte, desc, sql, count, avg } from "drizzle-orm";
import { logger } from "../../lib/logger";

export interface ForecastCalibration {
  forecastType: string;
  meanAbsoluteError: number;
  meanPercentageError: number;
  bias: number;
  confidenceCalibration: number;
  drift: number;
  sampleSize: number;
  horizonBreakdown: Array<{ horizon: string; mae: number; mpe: number }>;
  isReliable: boolean;
}

export interface ConfidenceInterval {
  lower: number;
  upper: number;
  confidence: number;
  volatility: number;
}

class ConfidenceEngine {
  async calibrateForecastType(forecastType: string, windowDays = 90): Promise<ForecastCalibration> {
    const records = await db
      .select()
      .from(forecastAccuracy)
      .where(
        and(
          eq(forecastAccuracy.forecastType, forecastType),
          gte(forecastAccuracy.createdAt, new Date(Date.now() - windowDays * 86400000)),
        ),
      );

    if (records.length === 0) {
      return {
        forecastType,
        meanAbsoluteError: 0,
        meanPercentageError: 0,
        bias: 0,
        confidenceCalibration: 0.5,
        drift: 0,
        sampleSize: 0,
        horizonBreakdown: [],
        isReliable: false,
      };
    }

    const mae = records.reduce((s, r) => s + (r.absoluteError ?? 0), 0) / records.length;
    const mpe = records.reduce((s, r) => s + (r.percentageError ?? 0), 0) / records.length;
    const bias = records.reduce((s, r) => s + (r.bias ?? 0), 0) / records.length;
    const calibration = records.reduce((s, r) => s + (r.confidenceCalibration ?? 0.5), 0) / records.length;

    const half = Math.floor(records.length / 2);
    const firstHalf = records.slice(0, half);
    const secondHalf = records.slice(half);
    const drift = firstHalf.length > 0 && secondHalf.length > 0
      ? (secondHalf.reduce((s, r) => s + (r.absoluteError ?? 0), 0) / secondHalf.length) -
        (firstHalf.reduce((s, r) => s + (r.absoluteError ?? 0), 0) / firstHalf.length)
      : 0;

    const horizonGroups = new Map<string, { errors: number[]; pErrors: number[] }>();
    for (const r of records) {
      const h = r.forecastHorizon || "unknown";
      if (!horizonGroups.has(h)) horizonGroups.set(h, { errors: [], pErrors: [] });
      const g = horizonGroups.get(h)!;
      if (r.absoluteError !== null) g.errors.push(r.absoluteError);
      if (r.percentageError !== null) g.pErrors.push(r.percentageError);
    }

    const horizonBreakdown = Array.from(horizonGroups.entries()).map(([horizon, data]) => ({
      horizon,
      mae: data.errors.length > 0 ? data.errors.reduce((a, b) => a + b, 0) / data.errors.length : 0,
      mpe: data.pErrors.length > 0 ? data.pErrors.reduce((a, b) => a + b, 0) / data.pErrors.length : 0,
    }));

    return {
      forecastType,
      meanAbsoluteError: Math.round(mae * 10000) / 10000,
      meanPercentageError: Math.round(mpe * 10000) / 10000,
      bias: Math.round(bias * 10000) / 10000,
      confidenceCalibration: Math.round(calibration * 100) / 100,
      drift: Math.round(drift * 10000) / 10000,
      sampleSize: records.length,
      horizonBreakdown,
      isReliable: mae < 0.2 && calibration > 0.6,
    };
  }

  async getAllCalibrations(): Promise<ForecastCalibration[]> {
    const types = await db
      .select({ forecastType: forecastAccuracy.forecastType })
      .from(forecastAccuracy)
      .groupBy(forecastAccuracy.forecastType)
      .then(rows => rows.map(r => r.forecastType));

    const results: ForecastCalibration[] = [];
    for (const t of types) {
      results.push(await this.calibrateForecastType(t));
    }
    return results;
  }

  computeConfidenceInterval(
    historicalValues: number[],
    forecastValue: number,
    confidenceLevel = 0.8,
  ): ConfidenceInterval {
    if (historicalValues.length < 3) {
      return { lower: forecastValue * 0.7, upper: forecastValue * 1.3, confidence: 0.5, volatility: 0.3 };
    }

    const mean = historicalValues.reduce((a, b) => a + b, 0) / historicalValues.length;
    const variance = historicalValues.reduce((s, v) => s + (v - mean) ** 2, 0) / historicalValues.length;
    const std = Math.sqrt(variance);
    const volatility = std / Math.max(Math.abs(mean), 0.01);

    const zScore = confidenceLevel >= 0.95 ? 1.96 : confidenceLevel >= 0.9 ? 1.645 : confidenceLevel >= 0.8 ? 1.28 : 1.04;
    const margin = std * zScore;

    const confidence = Math.max(0.1, Math.min(0.99, 1 - volatility));

    return {
      lower: Math.round((forecastValue - margin) * 10000) / 10000,
      upper: Math.round((forecastValue + margin) * 10000) / 10000,
      confidence: Math.round(confidence * 100) / 100,
      volatility: Math.round(volatility * 100) / 100,
    };
  }

  async recordAccuracy(params: {
    forecastType: string; forecastId?: number; predictedValue: number;
    actualValue: number; forecastHorizon?: string; region?: string; industry?: string;
  }): Promise<void> {
    const absoluteError = Math.abs(params.predictedValue - params.actualValue);
    const percentageError = params.predictedValue !== 0
      ? absoluteError / Math.abs(params.predictedValue)
      : absoluteError;
    const bias = params.actualValue - params.predictedValue;

    const existingForecast = params.forecastId
      ? await this.findForecastConfidence(params.forecastType, params.forecastId)
      : null;

    await db.insert(forecastAccuracy).values({
      forecastType: params.forecastType,
      forecastId: params.forecastId || null,
      predictedValue: params.predictedValue,
      actualValue: params.actualValue,
      absoluteError,
      percentageError,
      bias,
      confidenceCalibration: existingForecast?.confidence ?? 0.5,
      drift: 0,
      forecastHorizon: params.forecastHorizon || null,
      region: params.region || null,
      industry: params.industry || null,
      metadata: {},
    });
  }

  async getAccuracyHistory(forecastType?: string, limit = 50): Promise<Array<Record<string, unknown>>> {
    const conditions = forecastType ? [eq(forecastAccuracy.forecastType, forecastType)] : [];
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const query = where
      ? db.select().from(forecastAccuracy).where(where).orderBy(desc(forecastAccuracy.createdAt)).limit(limit)
      : db.select().from(forecastAccuracy).orderBy(desc(forecastAccuracy.createdAt)).limit(limit);
    return query;
  }

  private async findForecastConfidence(forecastType: string, forecastId: number): Promise<{ confidence: number } | null> {
    if (forecastType === "hiring_demand" || forecastType === "labor_shortage" || forecastType === "wage_pressure") {
      const rows = await db
        .select({ confidence: laborForecasts.confidence })
        .from(laborForecasts)
        .where(eq(laborForecasts.id, forecastId))
        .limit(1);
      if (rows[0]) return { confidence: rows[0].confidence ?? 0 };
    }
    if (forecastType === "migration_volume" || forecastType === "corridor_growth") {
      const rows = await db
        .select({ confidence: migrationForecasts.confidence })
        .from(migrationForecasts)
        .where(eq(migrationForecasts.id, forecastId))
        .limit(1);
      if (rows[0]) return { confidence: rows[0].confidence ?? 0 };
    }
    if (forecastType === "skill_demand" || forecastType === "skill_scarcity") {
      const rows = await db
        .select({ confidence: skillForecasts.confidence })
        .from(skillForecasts)
        .where(eq(skillForecasts.id, forecastId))
        .limit(1);
      if (rows[0]) return { confidence: rows[0].confidence ?? 0 };
    }
    return null;
  }
}

export const confidenceEngine = new ConfidenceEngine();
