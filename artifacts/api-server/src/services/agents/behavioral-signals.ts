import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { logger } from "../../lib/logger";

export const SIGNAL_STRENGTHS: Record<string, number> = {
  hired: 1.0,
  interview_completed: 0.8,
  outreach_replied: 0.7,
  shortlisted: 0.6,
  outreach_sent: 0.5,
  sourced: 0.3,
  viewed: 0.1,
  ignored: -0.2,
  rejected: -0.5,
  ghosted: -0.6,
  rapid_rejected: -0.8,
};

export const SIGNAL_CATEGORIES: Record<string, "strong_positive" | "positive" | "neutral" | "negative" | "strong_negative"> = {
  hired: "strong_positive",
  interview_completed: "positive",
  outreach_replied: "positive",
  shortlisted: "positive",
  outreach_sent: "positive",
  sourced: "neutral",
  viewed: "neutral",
  ignored: "negative",
  rejected: "negative",
  rapid_rejected: "strong_negative",
  ghosted: "strong_negative",
};

interface SignalPayload {
  employerId: number;
  actionType: string;
  candidateId?: number;
  jobId?: number;
  metadata?: Record<string, unknown>;
}

interface PreferenceSuggestion {
  key: string;
  value: string;
  confidence: number;
  supportingSignalIds: number[];
}

export class BehavioralSignalCollector {
  async record(signal: SignalPayload): Promise<void> {
    const strength = SIGNAL_STRENGTHS[signal.actionType] ?? 0;
    try {
      await db.execute(sql`
        INSERT INTO behavioral_signals (employer_id, action_type, candidate_id, job_id, signal_strength, action_metadata)
        VALUES (${signal.employerId}, ${signal.actionType}, ${signal.candidateId ?? null},
                ${signal.jobId ?? null}, ${strength}, ${JSON.stringify(signal.metadata || {})}::jsonb)
      `);
      const signalCount = await this.getSignalCount(signal.employerId);
      if (signalCount > 0 && signalCount % 10 === 0) {
        setImmediate(() => {
          this.inferPreferences(signal.employerId).catch((err) =>
            logger.error({ err, employerId: signal.employerId }, "Background preference inference failed")
          );
        });
      }
    } catch (err) {
      logger.error({ err, employerId: signal.employerId, actionType: signal.actionType }, "Failed to record behavioral signal");
    }
  }

  async getSignals(employerId: number, limit = 100, offset = 0): Promise<any[]> {
    try {
      const rows = await db.execute(sql`
        SELECT id, action_type, candidate_id, job_id, signal_strength, action_metadata, created_at
        FROM behavioral_signals
        WHERE employer_id = ${employerId}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `);
      return rows.rows || [];
    } catch {
      return [];
    }
  }

  async getSignalCount(employerId: number): Promise<number> {
    try {
      const rows = await db.execute(sql`
        SELECT COUNT(*) as count FROM behavioral_signals WHERE employer_id = ${employerId}
      `);
      return Number((rows.rows?.[0] as any)?.count || 0);
    } catch {
      return 0;
    }
  }

  async getSignalsSince(employerId: number, since: Date): Promise<any[]> {
    try {
      const rows = await db.execute(sql`
        SELECT id, action_type, candidate_id, job_id, signal_strength, action_metadata, created_at
        FROM behavioral_signals
        WHERE employer_id = ${employerId} AND created_at >= ${since.toISOString()}
        ORDER BY created_at DESC
      `);
      return rows.rows || [];
    } catch {
      return [];
    }
  }

  async inferPreferences(employerId: number): Promise<PreferenceSuggestion[]> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const signals = await this.getSignalsSince(employerId, thirtyDaysAgo);
      if (signals.length < 5) return [];

      const suggestions: PreferenceSuggestion[] = [];

      const positiveSignals = signals.filter((s: any) => Number(s.signal_strength) > 0);
      const negativeSignals = signals.filter((s: any) => Number(s.signal_strength) < 0);

      const positiveCandidateIds = new Set(positiveSignals.map((s: any) => s.candidate_id).filter(Boolean));
      const negativeCandidateIds = new Set(negativeSignals.map((s: any) => s.candidate_id).filter(Boolean));

      const positiveMetadata = positiveSignals
        .map((s: any) => s.action_metadata)
        .filter(Boolean)
        .flatMap((m: any) => {
          if (typeof m === "string") try { return [JSON.parse(m)]; } catch { return []; }
          return Array.isArray(m) ? m : [m];
        });

      const negativeMetadata = negativeSignals
        .map((s: any) => s.action_metadata)
        .filter(Boolean)
        .flatMap((m: any) => {
          if (typeof m === "string") try { return [JSON.parse(m)]; } catch { return []; }
          return Array.isArray(m) ? m : [m];
        });

      this.inferSkillPreferences(positiveMetadata, negativeMetadata, signals, suggestions);
      this.inferLocationPreferences(positiveMetadata, negativeMetadata, signals, suggestions);
      this.inferExperiencePreferences(positiveMetadata, negativeMetadata, signals, suggestions);
      this.inferCertificationPreferences(positiveMetadata, signals, suggestions);

      for (const s of suggestions) {
        await this.storeInferredPreference(employerId, s);
      }

      return suggestions;
    } catch (err) {
      logger.error({ err, employerId }, "Preference inference failed");
      return [];
    }
  }

  private inferSkillPreferences(
    positiveMeta: any[], negativeMeta: any[], signals: any[],
    suggestions: PreferenceSuggestion[],
  ): void {
    const skillFrequency: Map<string, { positive: number; total: number; signalIds: number[] }> = new Map();

    for (const meta of positiveMeta) {
      const skills: string[] = meta.skills || meta.candidateSkills || [];
      for (const skill of skills) {
        const entry = skillFrequency.get(skill) || { positive: 0, total: 0, signalIds: [] };
        entry.positive += 1;
        entry.total += 1;
        const signalId = signals.find((s: any) => {
          const m = typeof s.action_metadata === "string" ? JSON.parse(s.action_metadata) : s.action_metadata;
          return m?.candidateSkills?.includes(skill) || m?.skills?.includes(skill);
        })?.id;
        if (signalId) entry.signalIds.push(signalId);
        skillFrequency.set(skill, entry);
      }
    }

    for (const meta of negativeMeta) {
      const skills: string[] = meta.skills || meta.candidateSkills || [];
      for (const skill of skills) {
        const entry = skillFrequency.get(skill) || { positive: 0, total: 0, signalIds: [] };
        entry.total += 1;
        skillFrequency.set(skill, entry);
      }
    }

    for (const [skill, freq] of skillFrequency.entries()) {
      if (freq.total >= 3) {
        const ratio = freq.positive / freq.total;
        if (ratio >= 0.7) {
          suggestions.push({
            key: "preferred_skill",
            value: skill,
            confidence: Math.min(0.95, 0.5 + (ratio - 0.5) * (freq.total / 10)),
            supportingSignalIds: [...new Set(freq.signalIds)],
          });
        } else if (ratio <= 0.3 && freq.total >= 4) {
          suggestions.push({
            key: "avoided_skill",
            value: skill,
            confidence: Math.min(0.85, 0.5 + (0.3 - ratio) * (freq.total / 10)),
            supportingSignalIds: [],
          });
        }
      }
    }
  }

  private inferLocationPreferences(
    positiveMeta: any[], negativeMeta: any[], signals: any[],
    suggestions: PreferenceSuggestion[],
  ): void {
    const locationCount: Map<string, number> = new Map();
    for (const meta of positiveMeta) {
      const loc = meta.location || meta.candidateLocation;
      if (loc) locationCount.set(loc, (locationCount.get(loc) || 0) + 1);
    }
    for (const [loc, count] of locationCount.entries()) {
      if (count >= 2) {
        suggestions.push({
          key: "preferred_location",
          value: loc,
          confidence: Math.min(0.9, 0.4 + count * 0.1),
          supportingSignalIds: [],
        });
      }
    }
  }

  private inferExperiencePreferences(
    positiveMeta: any[], negativeMeta: any[], signals: any[],
    suggestions: PreferenceSuggestion[],
  ): void {
    const levels: Map<string, { positive: number; total: number }> = new Map();
    const allMeta = [...positiveMeta, ...negativeMeta];
    const isPositive = (i: number) => i < positiveMeta.length;

    for (let i = 0; i < allMeta.length; i++) {
      const meta = allMeta[i];
      const exp = meta.experienceLevel || meta.candidateExperienceLevel;
      if (exp) {
        const entry = levels.get(exp) || { positive: 0, total: 0 };
        entry.total += 1;
        if (isPositive(i)) entry.positive += 1;
        levels.set(exp, entry);
      }
    }

    for (const [level, stats] of levels.entries()) {
      if (stats.total >= 3) {
        const ratio = stats.positive / stats.total;
        if (ratio >= 0.65) {
          suggestions.push({
            key: "preferred_experience_level",
            value: level,
            confidence: Math.min(0.9, 0.4 + (ratio - 0.5) * (stats.total / 8)),
            supportingSignalIds: [],
          });
        }
      }
    }
  }

  private inferCertificationPreferences(
    positiveMeta: any[], signals: any[],
    suggestions: PreferenceSuggestion[],
  ): void {
    const certCount: Map<string, { count: number; signalIds: number[] }> = new Map();
    for (const meta of positiveMeta) {
      const certs: string[] = meta.certifications || meta.candidateCertifications || [];
      for (const cert of certs) {
        const entry = certCount.get(cert) || { count: 0, signalIds: [] };
        entry.count += 1;
        certCount.set(cert, entry);
      }
    }
    for (const [cert, data] of certCount.entries()) {
      if (data.count >= 2) {
        suggestions.push({
          key: "preferred_certification",
          value: cert,
          confidence: Math.min(0.9, 0.4 + data.count * 0.12),
          supportingSignalIds: [],
        });
      }
    }
  }

  private async storeInferredPreference(employerId: number, suggestion: PreferenceSuggestion): Promise<void> {
    try {
      const existing = await db.execute(sql`
        SELECT id, confidence, supporting_signals, signal_details FROM inferred_preferences
        WHERE employer_id = ${employerId}
          AND preference_key = ${suggestion.key}
          AND preference_value = ${suggestion.value}
      `);

      const now = new Date();
      if ((existing.rows?.length || 0) > 0) {
        const row = existing.rows![0] as any;
        const oldConfidence = Number(row.confidence);
        const newConfidence = Math.min(0.98, oldConfidence + (suggestion.confidence - oldConfidence) * 0.3);
        const existingSignalIds: number[] = typeof row.signal_details === "string"
          ? JSON.parse(row.signal_details)
          : (row.signal_details || []);
        const mergedSignalIds = [...new Set([...existingSignalIds, ...suggestion.supportingSignalIds])];

        await db.execute(sql`
          UPDATE inferred_preferences
          SET confidence = ${newConfidence}, supporting_signals = ${mergedSignalIds.length},
              last_reinforced_at = ${now.toISOString()}, decay_started_at = NULL,
              is_active = true, signal_details = ${JSON.stringify(mergedSignalIds)}::jsonb,
              updated_at = ${now.toISOString()}
          WHERE id = ${row.id}
        `);
      } else {
        await db.execute(sql`
          INSERT INTO inferred_preferences (employer_id, preference_key, preference_value, confidence, source, supporting_signals, signal_details)
          VALUES (${employerId}, ${suggestion.key}, ${suggestion.value}, ${suggestion.confidence},
                  'behavioral_inference', ${suggestion.supportingSignalIds.length},
                  ${JSON.stringify(suggestion.supportingSignalIds)}::jsonb)
        `);
      }
    } catch (err) {
      logger.error({ err, employerId, key: suggestion.key }, "Failed to store inferred preference");
    }
  }

  async decayStalePreferences(employerId?: number): Promise<number> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      let query = sql`
        UPDATE inferred_preferences
        SET confidence = GREATEST(0.05, confidence - 0.1),
            decay_started_at = CASE WHEN decay_started_at IS NULL THEN ${new Date().toISOString()} ELSE decay_started_at END,
            updated_at = ${new Date().toISOString()}
        WHERE is_active = true
          AND last_reinforced_at < ${thirtyDaysAgo.toISOString()}
      `;
      if (employerId) {
        query = sql`
          UPDATE inferred_preferences
          SET confidence = GREATEST(0.05, confidence - 0.1),
              decay_started_at = CASE WHEN decay_started_at IS NULL THEN ${new Date().toISOString()} ELSE decay_started_at END,
              updated_at = ${new Date().toISOString()}
          WHERE is_active = true
            AND employer_id = ${employerId}
            AND last_reinforced_at < ${thirtyDaysAgo.toISOString()}
        `;
      }

      const result = await db.execute(query);
      const count = Number((result as any)?.rowCount || 0);

      const deactivateQuery = sql`
        UPDATE inferred_preferences
        SET is_active = false, updated_at = ${new Date().toISOString()}
        WHERE confidence < 0.1 AND decay_started_at IS NOT NULL
          AND decay_started_at < ${sevenDaysAgo.toISOString()}
      `;
      await db.execute(deactivateQuery);

      return count;
    } catch (err) {
      logger.error({ err, employerId }, "Failed to decay preferences");
      return 0;
    }
  }

  async getInferredPreferences(employerId: number, activeOnly = true): Promise<any[]> {
    try {
      let query: any;
      if (activeOnly) {
        query = sql`
          SELECT id, preference_key, preference_value, confidence, source, supporting_signals,
                 first_detected_at, last_reinforced_at, decay_started_at, is_active
          FROM inferred_preferences
          WHERE employer_id = ${employerId} AND is_active = true
          ORDER BY confidence DESC, supporting_signals DESC
        `;
      } else {
        query = sql`
          SELECT id, preference_key, preference_value, confidence, source, supporting_signals,
                 first_detected_at, last_reinforced_at, decay_started_at, is_active
          FROM inferred_preferences
          WHERE employer_id = ${employerId}
          ORDER BY confidence DESC, supporting_signals DESC
        `;
      }
      const rows = await db.execute(query);
      return rows.rows || [];
    } catch {
      return [];
    }
  }

  async getPreferenceSummary(employerId: number): Promise<{
    preferredSkills: string[];
    avoidedSkills: string[];
    preferredLocations: string[];
    preferredExperienceLevels: string[];
    preferredCertifications: string[];
    learningProgress: number;
    totalSignals: number;
    totalPreferences: number;
  }> {
    try {
      const [prefs, signalCount] = await Promise.all([
        this.getInferredPreferences(employerId),
        this.getSignalCount(employerId),
      ]);

      const result = {
        preferredSkills: [] as string[],
        avoidedSkills: [] as string[],
        preferredLocations: [] as string[],
        preferredExperienceLevels: [] as string[],
        preferredCertifications: [] as string[],
        learningProgress: Math.min(100, Math.round((signalCount / 100) * 100)),
        totalSignals: signalCount,
        totalPreferences: prefs.length,
      };

      for (const p of prefs) {
        if (p.preference_key === "preferred_skill") result.preferredSkills.push(p.preference_value);
        else if (p.preference_key === "avoided_skill") result.avoidedSkills.push(p.preference_value);
        else if (p.preference_key === "preferred_location") result.preferredLocations.push(p.preference_value);
        else if (p.preference_key === "preferred_experience_level") result.preferredExperienceLevels.push(p.preference_value);
        else if (p.preference_key === "preferred_certification") result.preferredCertifications.push(p.preference_value);
      }

      return result;
    } catch {
      return {
        preferredSkills: [], avoidedSkills: [], preferredLocations: [],
        preferredExperienceLevels: [], preferredCertifications: [],
        learningProgress: 0, totalSignals: 0, totalPreferences: 0,
      };
    }
  }

  async getSignalsForCandidate(employerId: number, candidateId: number): Promise<any[]> {
    try {
      const rows = await db.execute(sql`
        SELECT id, action_type, signal_strength, action_metadata, created_at
        FROM behavioral_signals
        WHERE employer_id = ${employerId} AND candidate_id = ${candidateId}
        ORDER BY created_at DESC
      `);
      return rows.rows || [];
    } catch {
      return [];
    }
  }
}

export const signalCollector = new BehavioralSignalCollector();
