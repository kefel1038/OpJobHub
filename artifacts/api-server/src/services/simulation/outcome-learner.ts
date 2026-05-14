import { db, predictionOutcomes, predictionAccuracy, hiringSimulations } from "@workspace/db";
import { eq, and, desc, sql, gte, lte, avg, count } from "drizzle-orm";
import { logger } from "../../lib/logger";

export interface AccuracyStats {
  totalPredictions: number;
  accuratePredictions: number;
  accuracyRate: number;
  averageConfidence: number;
  averageCalibrationError: number;
  mae: number;
  rmse: number;
  bias: number;
}

class OutcomeLearner {
  async recordOutcome(params: {
    simulationId: number;
    employerId: number;
    actualOutcome: "success" | "failure" | "pending" | "unknown";
    outcomeValue?: number;
    metadata?: Record<string, unknown>;
  }): Promise<{ id: number }> {
    const sim = await db
      .select()
      .from(hiringSimulations)
      .where(eq(hiringSimulations.id, params.simulationId))
      .limit(1)
      .then(rows => rows[0]);

    if (!sim) throw new Error(`Simulation ${params.simulationId} not found`);

    const predictedProb = sim.probability;
    const actualVal = params.outcomeValue ?? (params.actualOutcome === "success" ? 1 : 0);
    const drift = Math.abs(predictedProb - actualVal);
    const calibrationError = predictedProb > 0
      ? (actualVal - predictedProb) / predictedProb
      : 0;

    const [inserted] = await db.insert(predictionOutcomes).values({
      simulationId: params.simulationId,
      employerId: params.employerId,
      predictedProbability: Number(predictedProb),
      actualOutcome: params.actualOutcome,
      outcomeValue: actualVal,
      outcomeRecordedAt: new Date(),
      predictionDrift: drift,
      calibrationError: calibrationError,
      metadata: (params.metadata ?? {}) as any,
    }).returning();

    await this.computeAccuracy({
      employerId: params.employerId,
      simulationType: sim.simulationType,
    });

    return { id: inserted.id };
  }

  async computeAccuracy(params: {
    employerId: number;
    simulationType: string;
    windowDays?: number;
  }): Promise<AccuracyStats> {
    const conditions = and(
      eq(predictionOutcomes.employerId, params.employerId),
      eq(predictionOutcomes.actualOutcome, "success"),
      eq(hiringSimulations.simulationType, params.simulationType),
    );

    const outcomes = await db
      .select({
        id: predictionOutcomes.id,
        predictedProbability: predictionOutcomes.predictedProbability,
        outcomeValue: predictionOutcomes.outcomeValue,
        predictionDrift: predictionOutcomes.predictionDrift,
        calibrationError: predictionOutcomes.calibrationError,
      })
      .from(predictionOutcomes)
      .innerJoin(
        hiringSimulations,
        eq(predictionOutcomes.simulationId, hiringSimulations.id),
      )
      .where(conditions);

    const totalPredictions = outcomes.length;
    if (totalPredictions === 0) {
      const empty: AccuracyStats = {
        totalPredictions: 0, accuratePredictions: 0, accuracyRate: 0,
        averageConfidence: 0, averageCalibrationError: 0, mae: 0, rmse: 0, bias: 0,
      };
      return empty;
    }

    const accuratePredictions = outcomes.filter(o => {
      const predicted = o.predictedProbability;
      const actual = o.outcomeValue ?? 0;
      return (predicted >= 0.5 && actual >= 0.5) || (predicted < 0.5 && actual < 0.5);
    }).length;

    const mae = outcomes.reduce((s, o) => s + Math.abs(o.predictionDrift ?? 0), 0) / totalPredictions;
    const rmse = Math.sqrt(
      outcomes.reduce((s, o) => s + ((o.predictionDrift ?? 0) ** 2), 0) / totalPredictions
    );
    const avgCalibrationError = outcomes.reduce((s, o) => s + (o.calibrationError ?? 0), 0) / totalPredictions;
    const avgConfidence = outcomes.reduce((s, o) => s + o.predictedProbability, 0) / totalPredictions;
    const bias = outcomes.reduce((s, o) => s + ((o.outcomeValue ?? 0) - o.predictedProbability), 0) / totalPredictions;

    const stats: AccuracyStats = {
      totalPredictions,
      accuratePredictions,
      accuracyRate: totalPredictions > 0 ? accuratePredictions / totalPredictions : 0,
      averageConfidence: avgConfidence,
      averageCalibrationError: avgCalibrationError,
      mae,
      rmse,
      bias,
    };

    await db.insert(predictionAccuracy).values({
      employerId: params.employerId,
      simulationType: params.simulationType,
      totalPredictions,
      accuratePredictions,
      accuracyRate: stats.accuracyRate,
      averageConfidence: avgConfidence,
      averageCalibrationError: avgCalibrationError,
      mae,
      rmse,
      windowStart: params.windowDays
        ? new Date(Date.now() - params.windowDays * 86400000)
        : null,
      windowEnd: new Date(),
    }).onConflictDoNothing();

    return stats;
  }

  async getCalibrationBias(employerId: number, simulationType: string): Promise<number> {
    const recent = await db
      .select({ calibrationError: predictionOutcomes.calibrationError })
      .from(predictionOutcomes)
      .innerJoin(
        hiringSimulations,
        eq(predictionOutcomes.simulationId, hiringSimulations.id),
      )
      .where(
        and(
          eq(predictionOutcomes.employerId, employerId),
          eq(hiringSimulations.simulationType, simulationType),
        ),
      )
      .orderBy(desc(predictionOutcomes.createdAt))
      .limit(50);

    if (recent.length === 0) return 0;
    return recent.reduce((s, r) => s + (r.calibrationError ?? 0), 0) / recent.length;
  }

  async getAccuracyHistory(
    employerId: number,
    simulationType?: string,
    limit = 20,
  ): Promise<Array<AccuracyStats & { createdAt: Date }>> {
    const conditions = simulationType
      ? and(eq(predictionAccuracy.employerId, employerId), eq(predictionAccuracy.simulationType, simulationType))
      : eq(predictionAccuracy.employerId, employerId);

    const rows = await db
      .select()
      .from(predictionAccuracy)
      .where(conditions)
      .orderBy(desc(predictionAccuracy.createdAt))
      .limit(limit);

    return rows.map(r => ({
      totalPredictions: r.totalPredictions ?? 0,
      accuratePredictions: r.accuratePredictions ?? 0,
      accuracyRate: r.accuracyRate ?? 0,
      averageConfidence: r.averageConfidence ?? 0,
      averageCalibrationError: r.averageCalibrationError ?? 0,
      mae: r.mae ?? 0,
      rmse: r.rmse ?? 0,
      bias: 0,
      createdAt: r.createdAt,
    }));
  }

  async getAccuracyByEmployer(employerId: number): Promise<Record<string, AccuracyStats>> {
    const types = await db
      .select({ simulationType: predictionAccuracy.simulationType })
      .from(predictionAccuracy)
      .where(eq(predictionAccuracy.employerId, employerId))
      .groupBy(predictionAccuracy.simulationType)
      .orderBy(desc(predictionAccuracy.createdAt));

    const result: Record<string, AccuracyStats> = {};
    for (const row of types) {
      result[row.simulationType] = await this.computeAccuracy({
        employerId,
        simulationType: row.simulationType,
      });
    }
    return result;
  }
}

export const outcomeLearner = new OutcomeLearner();
