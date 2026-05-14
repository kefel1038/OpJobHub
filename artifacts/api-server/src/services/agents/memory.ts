import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { logger } from "../../lib/logger";
import { openrouter } from "../../lib/openai";
import { signalCollector } from "./behavioral-signals";

interface RecruiterPreference {
  employerId: number;
  key: string;
  value: string;
  confidence: number;
  source: string;
}

interface HiringMemory {
  employerId: number;
  candidateId: number;
  jobId: number;
  outcome: "hired" | "rejected" | "shortlisted" | "ghosted";
  reason: string;
  skills: string[];
  interviewFeedback?: string;
  createdAt: Date;
}

export class RecruitmentMemory {
  async storePreference(
    employerId: number, key: string, value: string,
    confidence: number, source: string,
  ): Promise<void> {
    try {
      await db.execute(sql`
        INSERT INTO recruiter_memory (employer_id, key, value, confidence, source)
        VALUES (${employerId}, ${key}, ${value}, ${confidence}, ${source})
        ON CONFLICT (employer_id, key)
        DO UPDATE SET value = EXCLUDED.value, confidence = EXCLUDED.confidence,
                      source = EXCLUDED.source, updated_at = NOW()
      `);
    } catch (err) {
      logger.error({ err, employerId, key }, "Failed to store preference");
    }
  }

  async getPreferences(employerId: number, confidenceThreshold = 0.0): Promise<RecruiterPreference[]> {
    try {
      const [manualRows, inferredRows] = await Promise.all([
        db.execute(sql`
          SELECT key, value, confidence, source FROM recruiter_memory
          WHERE employer_id = ${employerId} AND confidence >= ${confidenceThreshold}
          ORDER BY confidence DESC
        `),
        db.execute(sql`
          SELECT preference_key as key, preference_value as value, confidence, source
          FROM inferred_preferences
          WHERE employer_id = ${employerId} AND is_active = true AND confidence >= ${confidenceThreshold}
          ORDER BY confidence DESC
        `),
      ]);

      const manual: RecruiterPreference[] = (manualRows.rows || []).map((r: any) => ({
        employerId, key: r.key, value: r.value,
        confidence: Number(r.confidence), source: r.source,
      }));

      const inferred: RecruiterPreference[] = (inferredRows.rows || []).map((r: any) => ({
        employerId, key: r.key, value: r.value,
        confidence: Number(r.confidence), source: r.source,
      }));

      const merged = new Map<string, RecruiterPreference>();
      for (const p of manual) merged.set(p.key, p);
      for (const p of inferred) {
        const existing = merged.get(p.key);
        if (!existing || p.confidence > existing.confidence) {
          merged.set(p.key, p);
        }
      }

      return [...merged.values()].sort((a, b) => b.confidence - a.confidence);
    } catch {
      return [];
    }
  }

  async reinforcePreference(employerId: number, key: string, value: string, signalConfidence: number): Promise<void> {
    try {
      const existing = await db.execute(sql`
        SELECT id, confidence, supporting_signals FROM inferred_preferences
        WHERE employer_id = ${employerId} AND preference_key = ${key} AND preference_value = ${value}
      `);

      if ((existing.rows?.length || 0) > 0) {
        const row = existing.rows![0] as any;
        const oldConfidence = Number(row.confidence);
        const newConfidence = Math.min(0.98, oldConfidence + (signalConfidence - oldConfidence) * 0.25);
        const newSignalCount = Number(row.supporting_signals || 0) + 1;

        await db.execute(sql`
          UPDATE inferred_preferences
          SET confidence = ${newConfidence}, supporting_signals = ${newSignalCount},
              last_reinforced_at = NOW(), decay_started_at = NULL,
              updated_at = NOW()
          WHERE id = ${row.id}
        `);
      }
    } catch (err) {
      logger.error({ err, employerId, key }, "Failed to reinforce preference");
    }
  }

  async detectContradictions(employerId: number, key: string, value: string, signalStrength: number): Promise<string | null> {
    try {
      const isPositiveAction = signalStrength > 0;
      const contradictionKey = isPositiveAction ? `avoided_${key.replace("preferred_", "")}` : `preferred_${key.replace("avoided_", "")}`;

      const rows = await db.execute(sql`
        SELECT preference_value, confidence FROM inferred_preferences
        WHERE employer_id = ${employerId} AND preference_key = ${contradictionKey}
          AND is_active = true AND confidence > 0.3
        ORDER BY confidence DESC
        LIMIT 1
      `);

      if (rows.rows?.length) {
        const contradiction = rows.rows[0] as any;
        const reducedConfidence = Number(contradiction.confidence) * 0.85;
        await db.execute(sql`
          UPDATE inferred_preferences
          SET confidence = ${reducedConfidence}, updated_at = NOW()
          WHERE employer_id = ${employerId} AND preference_key = ${contradictionKey}
            AND preference_value = ${contradiction.preference_value}
        `);
        return contradiction.preference_value;
      }
      return null;
    } catch {
      return null;
    }
  }

  async recordHiringOutcome(memory: HiringMemory): Promise<void> {
    try {
      await db.execute(sql`
        INSERT INTO hiring_memory (employer_id, candidate_id, job_id, outcome, reason, skills, interview_feedback)
        VALUES (${memory.employerId}, ${memory.candidateId}, ${memory.jobId},
                ${memory.outcome}, ${memory.reason},
                ${JSON.stringify(memory.skills)}::jsonb, ${memory.interviewFeedback || null})
      `);

      if (memory.outcome === "hired" || memory.outcome === "shortlisted") {
        for (const skill of memory.skills) {
          await this.reinforcePreference(memory.employerId, "preferred_skill", skill, 0.7);
        }
      }

      if (memory.outcome === "rejected" || memory.outcome === "ghosted") {
        for (const skill of memory.skills) {
          await signalCollector.record({
            employerId: memory.employerId,
            actionType: memory.outcome === "ghosted" ? "ghosted" : "rejected",
            candidateId: memory.candidateId,
            jobId: memory.jobId,
            metadata: { skills: memory.skills, reason: memory.reason },
          });
        }
      }
    } catch (err) {
      logger.error({ err, employerId: memory.employerId }, "Failed to record hiring outcome");
    }
  }

  async getHiringPatterns(employerId: number): Promise<{
    preferredSkills: string[];
    preferredExperienceLevels: string[];
    commonRejectionReasons: string[];
    avgTimeToHire: number;
  }> {
    try {
      const [hiringRows, inferred] = await Promise.all([
        db.execute(sql`
          SELECT outcome, reason, skills FROM hiring_memory
          WHERE employer_id = ${employerId}
          ORDER BY created_at DESC LIMIT 100
        `),
        signalCollector.getPreferenceSummary(employerId),
      ]);

      const records = hiringRows.rows || [];
      const hired = records.filter((r: any) => r.outcome === "hired");
      const rejected = records.filter((r: any) => r.outcome === "rejected");

      const skillCount = new Map<string, number>();
      hired.forEach((r: any) => {
        const skills: string[] = typeof r.skills === "string" ? JSON.parse(r.skills) : (r.skills || []);
        skills.forEach((s: string) => skillCount.set(s, (skillCount.get(s) || 0) + 1));
      });

      for (const skill of inferred.preferredSkills) {
        skillCount.set(skill, (skillCount.get(skill) || 0) + (inferred.totalSignals > 0 ? 2 : 0));
      }

      const preferredSkills = [...skillCount.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([skill]) => skill);

      const rejectionReasons = rejected
        .map((r: any) => r.reason)
        .filter(Boolean)
        .slice(0, 10);

      return {
        preferredSkills,
        preferredExperienceLevels: inferred.preferredExperienceLevels,
        commonRejectionReasons: rejectionReasons,
        avgTimeToHire: 14,
      };
    } catch {
      return { preferredSkills: [], preferredExperienceLevels: [], commonRejectionReasons: [], avgTimeToHire: 14 };
    }
  }

  async generateEmployerBrief(employerId: number): Promise<string> {
    const [prefs, patterns, summary] = await Promise.all([
      this.getPreferences(employerId),
      this.getHiringPatterns(employerId),
      signalCollector.getPreferenceSummary(employerId),
    ]);

    const preferenceLines = prefs.map((p) =>
      `- ${p.key}: ${p.value} (confidence: ${Math.round(p.confidence * 100)}%, source: ${p.source})`
    ).join("\n");

    const skillLines = patterns.preferredSkills.map((s) => `- ${s}`).join("\n");
    const avoidedLines = summary.avoidedSkills.map((s) => `- ${s}`).join("\n");

    return [
      "Employer Hiring Profile:",
      "",
      "Known Preferences:",
      preferenceLines || "  None recorded yet",
      "",
      "Preferred Skills (from past hires + inference):",
      skillLines || "  None recorded yet",
      "",
      "Avoided Skills (from rejection patterns):",
      avoidedLines || "  None recorded yet",
      "",
      `Preferred locations: ${summary.preferredLocations.join(", ") || "None inferred"}`,
      `Preferred experience levels: ${summary.preferredExperienceLevels.join(", ") || "None inferred"}`,
      `Preferred certifications: ${summary.preferredCertifications.join(", ") || "None inferred"}`,
      `Common rejection reasons: ${patterns.commonRejectionReasons.join(", ") || "None recorded"}`,
      `Total behavioral signals analyzed: ${summary.totalSignals}`,
      `Learning progress: ${summary.learningProgress}%`,
    ].join("\n");
  }

  async getConsolidatedProfile(employerId: number): Promise<{
    manualPreferences: RecruiterPreference[];
    inferredPreferences: any[];
    hiringPatterns: any;
    behavioralSummary: any;
  }> {
    const [manualRows, inferred, patterns, summary] = await Promise.all([
      db.execute(sql`
        SELECT key, value, confidence, source, created_at, updated_at FROM recruiter_memory
        WHERE employer_id = ${employerId} ORDER BY confidence DESC
      `),
      signalCollector.getInferredPreferences(employerId),
      this.getHiringPatterns(employerId),
      signalCollector.getPreferenceSummary(employerId),
    ]);

    return {
      manualPreferences: (manualRows.rows || []).map((r: any) => ({
        employerId, key: r.key, value: r.value,
        confidence: Number(r.confidence), source: r.source,
        createdAt: r.created_at, updatedAt: r.updated_at,
      })),
      inferredPreferences: inferred,
      hiringPatterns: patterns,
      behavioralSummary: summary,
    };
  }
}

export const recruitmentMemory = new RecruitmentMemory();
