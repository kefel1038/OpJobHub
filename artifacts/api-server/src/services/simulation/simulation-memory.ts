import { db, hiringSimulations, predictionOutcomes } from "@workspace/db";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import { logger } from "../../lib/logger";

export interface DriftReport {
  currentAccuracy: number;
  previousAccuracy: number;
  driftAmount: number;
  driftDirection: "improving" | "degrading" | "stable";
  totalPredictions: number;
  meanCalibrationError: number;
}

export interface PeriodComparison {
  period1Label: string;
  period2Label: string;
  period1Accuracy: number;
  period2Accuracy: number;
  accuracyChange: number;
  period1Count: number;
  period2Count: number;
}

class SimulationMemory {
  async getRecentSimulations(
    employerId: number,
    limit = 50,
    type?: string,
  ): Promise<Array<Record<string, unknown>>> {
    const conditions = type
      ? and(eq(hiringSimulations.employerId, employerId), eq(hiringSimulations.simulationType, type))
      : eq(hiringSimulations.employerId, employerId);

    const rows = await db
      .select()
      .from(hiringSimulations)
      .where(conditions)
      .orderBy(desc(hiringSimulations.createdAt))
      .limit(limit);

    return rows;
  }

  async getAccuracyDrift(
    employerId: number,
    simulationType: string,
    windowDays = 90,
  ): Promise<DriftReport> {
    const now = new Date();
    const midPoint = new Date(now.getTime() - (windowDays / 2) * 86400000);
    const startPoint = new Date(now.getTime() - windowDays * 86400000);

    const recentOutcomes = await db
      .select({
        predictedProbability: predictionOutcomes.predictedProbability,
        outcomeValue: predictionOutcomes.outcomeValue,
        calibrationError: predictionOutcomes.calibrationError,
      })
      .from(predictionOutcomes)
      .innerJoin(hiringSimulations, eq(predictionOutcomes.simulationId, hiringSimulations.id))
      .where(
        and(
          eq(predictionOutcomes.employerId, employerId),
          eq(hiringSimulations.simulationType, simulationType),
          gte(predictionOutcomes.createdAt, midPoint),
        ),
      );

    const olderOutcomes = await db
      .select({
        predictedProbability: predictionOutcomes.predictedProbability,
        outcomeValue: predictionOutcomes.outcomeValue,
      })
      .from(predictionOutcomes)
      .innerJoin(hiringSimulations, eq(predictionOutcomes.simulationId, hiringSimulations.id))
      .where(
        and(
          eq(predictionOutcomes.employerId, employerId),
          eq(hiringSimulations.simulationType, simulationType),
          gte(predictionOutcomes.createdAt, startPoint),
          lte(predictionOutcomes.createdAt, midPoint),
        ),
      );

    const calcAccuracy = (outcomes: Array<{ predictedProbability: number; outcomeValue: number | null }>) => {
      if (outcomes.length === 0) return 0;
      const accurate = outcomes.filter(o => {
        const p = o.predictedProbability;
        const a = o.outcomeValue ?? 0;
        return (p >= 0.5 && a >= 0.5) || (p < 0.5 && a < 0.5);
      }).length;
      return accurate / outcomes.length;
    };

    const currentAccuracy = calcAccuracy(recentOutcomes);
    const previousAccuracy = calcAccuracy(olderOutcomes);
    const driftAmount = currentAccuracy - previousAccuracy;

    let driftDirection: "improving" | "degrading" | "stable";
    if (driftAmount > 0.05) driftDirection = "improving";
    else if (driftAmount < -0.05) driftDirection = "degrading";
    else driftDirection = "stable";

    const meanCalibrationError = recentOutcomes.length > 0
      ? recentOutcomes.reduce((s, o) => s + (o.calibrationError ?? 0), 0) / recentOutcomes.length
      : 0;

    return {
      currentAccuracy: Math.round(currentAccuracy * 100) / 100,
      previousAccuracy: Math.round(previousAccuracy * 100) / 100,
      driftAmount: Math.round(driftAmount * 100) / 100,
      driftDirection,
      totalPredictions: recentOutcomes.length + olderOutcomes.length,
      meanCalibrationError: Math.round(meanCalibrationError * 100) / 100,
    };
  }

  async comparePeriods(
    employerId: number,
    simulationType: string,
    period1Days: number,
    period2Days: number,
  ): Promise<PeriodComparison> {
    const now = new Date();
    const period1Start = new Date(now.getTime() - period1Days * 86400000);
    const period2Start = new Date(now.getTime() - (period1Days + period2Days) * 86400000);

    const period1Outcomes = await this.getOutcomesInRange(employerId, simulationType, period1Start, now);
    const period2Outcomes = await this.getOutcomesInRange(employerId, simulationType, period2Start, period1Start);

    const calcAccuracy = (outcomes: typeof period1Outcomes) => {
      if (outcomes.length === 0) return 0;
      const accurate = outcomes.filter(o => {
        const p = o.predictedProbability;
        const a = o.outcomeValue ?? 0;
        return (p >= 0.5 && a >= 0.5) || (p < 0.5 && a < 0.5);
      }).length;
      return accurate / outcomes.length;
    };

    return {
      period1Label: `Last ${period1Days} days`,
      period2Label: `Previous ${period2Days} days`,
      period1Accuracy: Math.round(calcAccuracy(period1Outcomes) * 100) / 100,
      period2Accuracy: Math.round(calcAccuracy(period2Outcomes) * 100) / 100,
      accuracyChange: Math.round((calcAccuracy(period1Outcomes) - calcAccuracy(period2Outcomes)) * 100) / 100,
      period1Count: period1Outcomes.length,
      period2Count: period2Outcomes.length,
    };
  }

  async getSimulationsForCandidate(
    candidateId: number,
    employerId: number,
    limit = 20,
  ): Promise<Array<Record<string, unknown>>> {
    const rows = await db
      .select()
      .from(hiringSimulations)
      .where(
        and(
          eq(hiringSimulations.candidateId, candidateId),
          eq(hiringSimulations.employerId, employerId),
        ),
      )
      .orderBy(desc(hiringSimulations.createdAt))
      .limit(limit);

    return rows;
  }

  async getSimulationById(id: number): Promise<Record<string, unknown> | null> {
    const rows = await db
      .select()
      .from(hiringSimulations)
      .where(eq(hiringSimulations.id, id))
      .limit(1);

    return rows[0] ?? null;
  }

  async purgeOldData(olderThanDays: number): Promise<number> {
    const cutoff = new Date(Date.now() - olderThanDays * 86400000);

    const oldSims = await db
      .select({ id: hiringSimulations.id })
      .from(hiringSimulations)
      .where(lte(hiringSimulations.createdAt, cutoff));

    if (oldSims.length === 0) return 0;

    const ids = oldSims.map(s => s.id);

    for (const id of ids) {
      await db.delete(predictionOutcomes)
        .where(eq(predictionOutcomes.simulationId, id));
    }

    for (const id of ids) {
      await db.delete(hiringSimulations)
        .where(eq(hiringSimulations.id, id));
    }

    logger.info({ deletedCount: ids.length, olderThanDays }, "Purged old simulation data");
    return ids.length;
  }

  private async getOutcomesInRange(
    employerId: number,
    simulationType: string,
    start: Date,
    end: Date,
  ): Promise<Array<{ predictedProbability: number; outcomeValue: number | null }>> {
    return db
      .select({
        predictedProbability: predictionOutcomes.predictedProbability,
        outcomeValue: predictionOutcomes.outcomeValue,
      })
      .from(predictionOutcomes)
      .innerJoin(hiringSimulations, eq(predictionOutcomes.simulationId, hiringSimulations.id))
      .where(
        and(
          eq(predictionOutcomes.employerId, employerId),
          eq(hiringSimulations.simulationType, simulationType),
          gte(predictionOutcomes.createdAt, start),
          lte(predictionOutcomes.createdAt, end),
        ),
      );
  }
}

export const simulationMemory = new SimulationMemory();
