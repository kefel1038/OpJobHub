import { db, discoveredCandidates, intentSignals, opportunityGraphEdges } from "@workspace/db";
import { eq, and, sql, inArray, count } from "drizzle-orm";
import { logger } from "../../lib/logger";
import { openrouter } from "../../lib/openai";

const INTENT_ANALYSIS_PROMPT = `You are OpJobHub's Intent Detection AI.
Analyze text for employment-related intent signals.
Return ONLY valid JSON.`;

export interface IntentAnalysis {
  signals: Array<{
    type: string;
    confidence: number;
    text: string;
  }>;
  primaryIntent: string;
  urgency: number;
  marketValue: number;
}

class IntentDetector {
  async analyzeCandidateIntent(candidateId: number): Promise<IntentAnalysis | null> {
    try {
      const [candidate] = await db.select()
        .from(discoveredCandidates)
        .where(eq(discoveredCandidates.id, candidateId))
        .limit(1);

      if (!candidate) return null;

      const signals = await db.select()
        .from(intentSignals)
        .where(eq(intentSignals.candidateId, candidateId));

      const contextText = [
        candidate.headline,
        candidate.profileSummary,
        (candidate.discoveryMetadata as any)?.rawContent?.slice(0, 1000),
        signals.map(s => s.signalText).join(". "),
      ].filter(Boolean).join("\n");

      if (!contextText) {
        return {
          signals: signals.map(s => ({ type: s.signalType, confidence: s.confidence || 0.5, text: s.signalText || "" })),
          primaryIntent: signals[0]?.signalType || "unknown",
          urgency: 0.3,
          marketValue: 0.4,
        };
      }

      try {
        const completion = await openrouter().chat.completions.create({
          model: "openrouter/free",
          messages: [
            { role: "system", content: INTENT_ANALYSIS_PROMPT },
            {
              role: "user",
              content: `Analyze this candidate's intent signals:

Context:
${contextText.slice(0, 2000)}

Return ONLY this JSON:
{
  "signals": [{"type": "employment_intent|relocation_intent|sponsorship_seeking|immediate_availability|skill_acquisition|career_change", "confidence": 0.0-1.0, "text": "matching text"}],
  "primaryIntent": "most dominant intent type",
  "urgency": 0.0-1.0 (how urgently are they looking),
  "marketValue": 0.0-1.0 (how valuable is this candidate in the market)
}`,
            },
          ],
          temperature: 0.3,
          max_tokens: 1000,
        });

        const raw = completion.choices[0].message.content || "{}";
        const analysis: IntentAnalysis = JSON.parse(raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim());

        for (const signal of analysis.signals) {
          const existing = await db.select({ id: intentSignals.id })
            .from(intentSignals)
            .where(and(
              eq(intentSignals.candidateId, candidateId),
              eq(intentSignals.signalType, signal.type),
            ))
            .limit(1);

          if (existing.length === 0) {
            await db.insert(intentSignals).values({
              candidateId,
              signalType: signal.type,
              signalText: signal.text,
              source: "ai_analysis",
              confidence: signal.confidence,
              detectedAt: new Date(),
              metadata: { analysisSource: "intent-detector" },
            });
          }
        }

        return analysis;
      } catch {
        return {
          signals: signals.map(s => ({ type: s.signalType, confidence: s.confidence || 0.5, text: s.signalText || "" })),
          primaryIntent: signals[0]?.signalType || "unknown",
          urgency: 0.3,
          marketValue: 0.4,
        };
      }
    } catch (err) {
      logger.error({ err, candidateId }, "Intent detector failed");
      return null;
    }
  }

  async getIntentSummary(employerId?: number): Promise<{
    totalSignals: number;
    byType: Record<string, number>;
    relocationSeekers: number;
    immediateAvailable: number;
    sponsorshipSeeking: number;
    emergingTrends: Array<{ signalType: string; count: number; description: string }>;
  }> {
    const conditions = employerId
      ? [sql`c.${sql.identifier("matched_by_employer_id")} = ${employerId}`]
      : [];

    const signalCounts = await db.select({
      signalType: intentSignals.signalType,
      count: sql<number>`count(*)::int`,
    })
      .from(intentSignals)
      .innerJoin(discoveredCandidates, eq(discoveredCandidates.id, intentSignals.candidateId))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(intentSignals.signalType)
      .orderBy(sql`count(*) DESC`);

    const byType: Record<string, number> = {};
    let totalSignals = 0;
    let relocationSeekers = 0;
    let immediateAvailable = 0;
    let sponsorshipSeeking = 0;

    for (const s of signalCounts) {
      byType[s.signalType] = s.count;
      totalSignals += s.count;
      if (s.signalType === "relocation_intent") relocationSeekers = s.count;
      if (s.signalType === "immediate_availability") immediateAvailable = s.count;
      if (s.signalType === "sponsorship_seeking") sponsorshipSeeking = s.count;
    }

    const trendDescriptions: Record<string, string> = {
      employment_intent: "Candidates actively seeking employment",
      relocation_intent: "Candidates open to relocation across borders",
      sponsorship_seeking: "Candidates requiring visa sponsorship",
      immediate_availability: "Candidates available to start immediately",
      skill_acquisition: "Candidates currently upskilling",
      career_change: "Candidates transitioning careers",
    };

    const emergingTrends = signalCounts.map(s => ({
      signalType: s.signalType,
      count: s.count,
      description: trendDescriptions[s.signalType] || "Other intent signal",
    }));

    return { totalSignals, byType, relocationSeekers, immediateAvailable, sponsorshipSeeking, emergingTrends };
  }
}

export const intentDetector = new IntentDetector();
