import { db, simulationScenarios, hiringSimulations } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { logger } from "../../lib/logger";
import { simulationEngine, type SimulationResult } from "./simulation-engine";

export interface ScenarioChange {
  parameter: string;
  oldValue: number;
  newValue: number;
  delta: number;
  deltaPercent: number;
}

export interface ScenarioResult {
  scenarioId: number;
  name: string;
  baseline: SimulationResult;
  scenario: SimulationResult;
  changes: ScenarioChange[];
  summary: string;
}

class ScenarioEngine {
  async runWhatIfSalary(params: {
    employerId: number;
    candidateId: number;
    currentSalary: number;
    proposedSalary: number;
    location?: string;
    jobSkills?: string[];
    candidateSkills?: string[];
  }): Promise<ScenarioResult> {
    const baseline = await simulationEngine.simulateOfferAcceptance({
      employerId: params.employerId,
      candidateId: params.candidateId,
      salary: params.currentSalary,
      location: params.location,
    });

    const scenario = await simulationEngine.simulateOfferAcceptance({
      employerId: params.employerId,
      candidateId: params.candidateId,
      salary: params.proposedSalary,
      location: params.location,
    });

    const salaryDeltaPercent = params.currentSalary > 0
      ? ((params.proposedSalary - params.currentSalary) / params.currentSalary) * 100
      : 0;

    const changes: ScenarioChange[] = [
      {
        parameter: "salary",
        oldValue: params.currentSalary,
        newValue: params.proposedSalary,
        delta: params.proposedSalary - params.currentSalary,
        deltaPercent: Math.round(salaryDeltaPercent * 100) / 100,
      },
      {
        parameter: "offer_acceptance_probability",
        oldValue: baseline.probability,
        newValue: scenario.probability,
        delta: scenario.probability - baseline.probability,
        deltaPercent: baseline.probability > 0
          ? Math.round(((scenario.probability - baseline.probability) / baseline.probability) * 10000) / 100
          : 0,
      },
    ];

    const scenarioId = await this.persistScenario({
      employerId: params.employerId,
      name: `Salary: ${params.currentSalary} → ${params.proposedSalary}`,
      description: `What-if analysis for salary change from ${params.currentSalary} to ${params.proposedSalary}`,
      scenarioType: "what_if_salary",
      parameterChanges: { currentSalary: params.currentSalary, proposedSalary: params.proposedSalary },
      baseline,
      scenario,
    });

    return {
      scenarioId,
      name: `Salary: ${params.currentSalary} → ${params.proposedSalary}`,
      baseline,
      scenario,
      changes,
      summary: this.generateSummary("Salary adjustment", baseline, scenario, changes),
    };
  }

  async runWhatIfLocation(params: {
    employerId: number;
    candidateId: number;
    currentLocation: string;
    proposedLocation: string;
  }): Promise<ScenarioResult> {
    const baseline = await simulationEngine.simulateHiringSuccess({
      employerId: params.employerId,
      candidateId: params.candidateId,
      location: params.currentLocation,
    });

    const scenario = await simulationEngine.simulateHiringSuccess({
      employerId: params.employerId,
      candidateId: params.candidateId,
      location: params.proposedLocation,
    });

    const changes: ScenarioChange[] = [
      {
        parameter: "location",
        oldValue: 0,
        newValue: 0,
        delta: 0,
        deltaPercent: 0,
      },
      {
        parameter: "hiring_success_probability",
        oldValue: baseline.probability,
        newValue: scenario.probability,
        delta: scenario.probability - baseline.probability,
        deltaPercent: baseline.probability > 0
          ? Math.round(((scenario.probability - baseline.probability) / baseline.probability) * 10000) / 100
          : 0,
      },
    ];

    const scenarioId = await this.persistScenario({
      employerId: params.employerId,
      name: `Location: ${params.currentLocation} → ${params.proposedLocation}`,
      description: `What-if analysis for location change from ${params.currentLocation} to ${params.proposedLocation}`,
      scenarioType: "what_if_location",
      parameterChanges: { currentLocation: params.currentLocation, proposedLocation: params.proposedLocation },
      baseline,
      scenario,
    });

    return {
      scenarioId,
      name: `Location: ${params.currentLocation} → ${params.proposedLocation}`,
      baseline,
      scenario,
      changes,
      summary: this.generateSummary("Location change", baseline, scenario, changes),
    };
  }

  async runWhatIfSkills(params: {
    employerId: number;
    candidateId: number;
    currentSkills: string[];
    additionalSkills: string[];
    jobSkills: string[];
    industry?: string;
  }): Promise<ScenarioResult> {
    const baseline = await simulationEngine.simulateHiringSuccess({
      employerId: params.employerId,
      candidateId: params.candidateId,
      candidateSkills: params.currentSkills,
      jobSkills: params.jobSkills,
      industry: params.industry,
    });

    const enhancedSkills = [...new Set([...params.currentSkills, ...params.additionalSkills])];
    const scenario = await simulationEngine.simulateHiringSuccess({
      employerId: params.employerId,
      candidateId: params.candidateId,
      candidateSkills: enhancedSkills,
      jobSkills: params.jobSkills,
      industry: params.industry,
    });

    const changes: ScenarioChange[] = [
      {
        parameter: "skill_count",
        oldValue: params.currentSkills.length,
        newValue: enhancedSkills.length,
        delta: params.additionalSkills.length,
        deltaPercent: params.currentSkills.length > 0
          ? Math.round((params.additionalSkills.length / params.currentSkills.length) * 10000) / 100
          : 100,
      },
      {
        parameter: "hiring_success_probability",
        oldValue: baseline.probability,
        newValue: scenario.probability,
        delta: scenario.probability - baseline.probability,
        deltaPercent: baseline.probability > 0
          ? Math.round(((scenario.probability - baseline.probability) / baseline.probability) * 10000) / 100
          : 0,
      },
    ];

    const scenarioId = await this.persistScenario({
      employerId: params.employerId,
      name: `${params.additionalSkills.length} additional skills`,
      description: `What-if analysis adding skills: ${params.additionalSkills.join(", ")}`,
      scenarioType: "what_if_skills",
      parameterChanges: { currentSkills: params.currentSkills, additionalSkills: params.additionalSkills },
      baseline,
      scenario,
    });

    return {
      scenarioId,
      name: `${params.additionalSkills.length} additional skills`,
      baseline,
      scenario,
      changes,
      summary: this.generateSummary("Skill enhancement", baseline, scenario, changes),
    };
  }

  async runCustomScenario(params: {
    employerId: number;
    name: string;
    description?: string;
    simulationParams: {
      employerId: number;
      candidateId?: number;
      jobId?: number;
      candidateSkills?: string[];
      jobSkills?: string[];
      location?: string;
      industry?: string;
      experienceLevel?: string;
      salary?: number;
      nationality?: string;
      currentLocation?: string;
    };
    modifiedParams: {
      candidateSkills?: string[];
      jobSkills?: string[];
      location?: string;
      industry?: string;
      experienceLevel?: string;
      salary?: number;
    };
    simulationType: string;
  }): Promise<ScenarioResult> {
    const baseline = await simulationEngine.simulateAll(params.simulationParams);

    const mergedParams = { ...params.simulationParams, ...params.modifiedParams };
    const scenario = await simulationEngine.simulateAll(mergedParams);

    const baselineResult = baseline[params.simulationType] ?? baseline.hiring_success;
    const scenarioResult = scenario[params.simulationType] ?? scenario.hiring_success;

    const changes: ScenarioChange[] = Object.entries(params.modifiedParams).map(([key, value]) => ({
      parameter: key,
      oldValue: (params.simulationParams as any)[key] ?? 0,
      newValue: typeof value === "number" ? value : 0,
      delta: typeof value === "number"
        ? value - ((params.simulationParams as any)[key] ?? 0)
        : 0,
      deltaPercent: 0,
    }));

    changes.push({
      parameter: `${params.simulationType}_probability`,
      oldValue: baselineResult.probability,
      newValue: scenarioResult.probability,
      delta: scenarioResult.probability - baselineResult.probability,
      deltaPercent: baselineResult.probability > 0
        ? Math.round(((scenarioResult.probability - baselineResult.probability) / baselineResult.probability) * 10000) / 100
        : 0,
    });

    const scenarioId = await this.persistScenario({
      employerId: params.employerId,
      name: params.name,
      description: params.description,
      scenarioType: "custom",
      parameterChanges: params.modifiedParams,
      baseline: baselineResult,
      scenario: scenarioResult,
    });

    return {
      scenarioId,
      name: params.name,
      baseline: baselineResult,
      scenario: scenarioResult,
      changes,
      summary: this.generateSummary(params.name, baselineResult, scenarioResult, changes),
    };
  }

  async getScenarioHistory(
    employerId: number,
    limit = 20,
  ): Promise<Array<Record<string, unknown>>> {
    const rows = await db
      .select()
      .from(simulationScenarios)
      .where(eq(simulationScenarios.employerId, employerId))
      .orderBy(desc(simulationScenarios.createdAt))
      .limit(limit);

    return rows;
  }

  async getScenarioById(id: number): Promise<Record<string, unknown> | null> {
    const rows = await db
      .select()
      .from(simulationScenarios)
      .where(eq(simulationScenarios.id, id))
      .limit(1);

    return rows[0] ?? null;
  }

  async getScenarioStats(employerId: number): Promise<{
    totalScenarios: number;
    byType: Record<string, number>;
    averageImprovement: number;
  }> {
    const rows = await db
      .select()
      .from(simulationScenarios)
      .where(eq(simulationScenarios.employerId, employerId));

    const byType: Record<string, number> = {};
    let totalImpact = 0;
    let impactCount = 0;

    for (const row of rows) {
      byType[row.scenarioType] = (byType[row.scenarioType] || 0) + 1;
      const results = row.results as Record<string, unknown> | null;
      if (results) {
        const changes = results.changes as ScenarioChange[] | undefined;
        if (changes) {
          const probChange = changes.find(c => c.parameter.includes("probability"));
          if (probChange) {
            totalImpact += probChange.delta;
            impactCount++;
          }
        }
      }
    }

    return {
      totalScenarios: rows.length,
      byType,
      averageImprovement: impactCount > 0 ? totalImpact / impactCount : 0,
    };
  }

  private async persistScenario(params: {
    employerId: number;
    name: string;
    description?: string;
    scenarioType: string;
    parameterChanges: Record<string, unknown>;
    baseline: SimulationResult;
    scenario: SimulationResult;
  }): Promise<number> {
    const [inserted] = await db.insert(simulationScenarios).values({
      employerId: params.employerId,
      name: params.name,
      description: params.description,
      scenarioType: params.scenarioType,
      parameterChanges: params.parameterChanges as any,
      results: {
        baseline: params.baseline,
        scenario: params.scenario,
        changes: this.computeChangesArray(params.baseline, params.scenario),
      } as any,
      executedAt: new Date(),
    }).returning();

    return inserted.id;
  }

  private computeChangesArray(
    baseline: SimulationResult,
    scenario: SimulationResult,
  ): Array<{ parameter: string; oldValue: number; newValue: number; delta: number; deltaPercent: number }> {
    return [
      {
        parameter: "probability",
        oldValue: baseline.probability,
        newValue: scenario.probability,
        delta: scenario.probability - baseline.probability,
        deltaPercent: baseline.probability > 0
          ? Math.round(((scenario.probability - baseline.probability) / baseline.probability) * 10000) / 100
          : 0,
      },
      {
        parameter: "confidence",
        oldValue: baseline.confidence,
        newValue: scenario.confidence,
        delta: scenario.confidence - baseline.confidence,
        deltaPercent: baseline.confidence > 0
          ? Math.round(((scenario.confidence - baseline.confidence) / baseline.confidence) * 10000) / 100
          : 0,
      },
    ];
  }

  private generateSummary(
    name: string,
    baseline: SimulationResult,
    scenario: SimulationResult,
    changes: ScenarioChange[],
  ): string {
    const probChange = changes.find(c => c.parameter.includes("probability"));
    if (!probChange) return `${name}: No significant probability change.`;

    const direction = probChange.delta > 0 ? "improves" : "reduces";
    const magnitude = Math.abs(probChange.delta);
    const impact = magnitude > 0.15 ? "significantly" : magnitude > 0.05 ? "moderately" : "slightly";

    return `${name} ${direction} hiring probability by ${Math.abs(probChange.deltaPercent).toFixed(1)}% (${Math.abs(probChange.delta).toFixed(2)} points) — ${impact} impact.`;
  }
}

export const scenarioEngine = new ScenarioEngine();
