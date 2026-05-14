import { db, discoveredCandidates, candidateSources, intentSignals, opportunityGraphEdges, jobs } from "@workspace/db";
import { eq, and, inArray, sql, not, isNull } from "drizzle-orm";
import { logger } from "../../lib/logger";
import { openrouter } from "../../lib/openai";
import { eventBus, RecruitmentEventTypes } from "./event-bus";
import { sourceManager } from "./source-manager";
import { safetyEngine } from "./safety-engine";
import { reasoningEngine } from "./reasoning-engine";
import { approvalManager } from "./approval-manager";

const DISCOVERY_PROMPT = `You are OpJobHub's Discovery Agent — an autonomous talent intelligence system.
Your role is to analyze candidate information and extract structured data for recruitment.
Focus on: skills, experience, location, education, certifications, and employment intent signals.
Return ONLY valid JSON.`;

const INTENT_PATTERNS = [
  { type: "employment_intent", patterns: ["looking for", "seeking", "open to", "available for", "seeking new", "in search of", "looking to join", "seeking opportunities"] },
  { type: "relocation_intent", patterns: ["looking to relocate", "willing to relocate", "ready to move", "looking to move", "relocating to", "open to relocation", "planning to move"] },
  { type: "sponsorship_seeking", patterns: ["visa sponsorship", "need visa", "seeking sponsorship", "require sponsorship", "sponsorship needed", "work visa needed"] },
  { type: "immediate_availability", patterns: ["immediately available", "available now", "ready to start", "immediate start", "available immediately", "can start immediately"] },
  { type: "skill_acquisition", patterns: ["currently learning", "studying", "pursuing", "certification in progress", "working towards", "upskilling in"] },
  { type: "career_change", patterns: ["career transition", "career change", "changing careers", "switching to", "transitioning into"] },
];

export interface ScrapeResult {
  externalId?: string;
  sourceUrl?: string;
  fullName?: string;
  email?: string;
  headline?: string;
  location?: string;
  profileSummary?: string;
  skills?: string[];
  experience?: Array<Record<string, unknown>>;
  education?: Array<Record<string, unknown>>;
  certifications?: string[];
  languages?: string[];
  currentEmployer?: string;
  previousEmployers?: string[];
  socialLinks?: Record<string, string>;
  rawContent?: string;
}

interface SourceAdapter {
  name: string;
  discover(params: { skills?: string[]; roles?: string[]; locations?: string[]; limit?: number }): Promise<ScrapeResult[]>;
}

class DiscoveryAgent {
  private adapters: Map<string, SourceAdapter> = new Map();

  constructor() {
    this.registerDefaultAdapters();
  }

  private registerDefaultAdapters(): void {
    this.registerAdapter("linkedin", {
      name: "linkedin",
      discover: async (params) => {
        logger.info({ params: params }, "LinkedIn discovery adapter invoked");
        return [];
      },
    });
    this.registerAdapter("github", {
      name: "github",
      discover: async (params) => {
        logger.info({ params: params }, "GitHub discovery adapter invoked");
        return [];
      },
    });
    this.registerAdapter("telegram", {
      name: "telegram",
      discover: async (params) => {
        logger.info({ params: params }, "Telegram discovery adapter invoked");
        return [];
      },
    });
    this.registerAdapter("stackoverflow", {
      name: "stackoverflow",
      discover: async (params) => {
        logger.info({ params: params }, "Stack Overflow discovery adapter invoked");
        return [];
      },
    });
    this.registerAdapter("whatsapp", {
      name: "whatsapp",
      discover: async (params) => {
        logger.info({ params: params }, "WhatsApp discovery adapter invoked");
        return [];
      },
    });
    this.registerAdapter("twitter", {
      name: "twitter",
      discover: async (params) => {
        logger.info({ params: params }, "Twitter/X discovery adapter invoked");
        return [];
      },
    });
  }

  registerAdapter(name: string, adapter: SourceAdapter): void {
    this.adapters.set(name, adapter);
  }

  async discoverCandidates(params: {
    employerId: number;
    sources?: string[];
    skills?: string[];
    roles?: string[];
    locations?: string[];
    limitPerSource?: number;
  }): Promise<{
    discovered: number;
    candidates: Array<{ id: number; name: string | null; source: string; score: number }>;
  }> {
    const activeSources = await sourceManager.getActiveSources();
    const sourceNames = params.sources || activeSources.map(s => s.name);
    const skills = params.skills || [];
    const roles = params.roles || [];
    const locations = params.locations || [];

    let allResults: Array<{ result: ScrapeResult; sourceName: string; sourceId: number }> = [];
    let totalDiscovered = 0;

    for (const sourceName of sourceNames) {
      const adapter = this.adapters.get(sourceName);
      if (!adapter) {
        logger.warn({ source: sourceName }, "No adapter registered for source");
        continue;
      }

      const sourceInfo = activeSources.find(s => s.name === sourceName);
      if (!sourceInfo) continue;

      const rateLimitOk = await sourceManager.checkRateLimit(sourceInfo.id);
      if (!rateLimitOk) {
        logger.warn({ source: sourceName }, "Rate limit reached for source");
        continue;
      }

      try {
        await sourceManager.recordQuery(sourceInfo.id);
        const results = await adapter.discover({ skills, roles, locations, limit: params.limitPerSource || 20 });

        for (const result of results) {
          allResults.push({ result, sourceName, sourceId: sourceInfo.id });
        }

        const trustIncrement = results.length > 0 ? 0.01 : -0.01;
        await sourceManager.updateTrustScore(sourceInfo.id, (sourceInfo.trustScore || 0.5) + trustIncrement);

        logger.info({ source: sourceName, count: results.length }, "Discovery completed for source");
      } catch (err) {
        logger.error({ err, source: sourceName }, "Discovery failed for source");
      }
    }

    const candidates: Array<{ id: number; name: string | null; source: string; score: number }> = [];

    for (const { result, sourceName, sourceId } of allResults) {
      const enrichmentSource = result.rawContent || "";
      const structuredData = result.rawContent
        ? await this.extractStructuredData(result.rawContent)
        : {};

      const existing = result.email
        ? await db.select({ id: discoveredCandidates.id })
            .from(discoveredCandidates)
            .where(eq(discoveredCandidates.email, result.email))
            .limit(1)
        : [];

      if (existing.length > 0) {
        await db.update(discoveredCandidates)
          .set({
            ...structuredData,
            ...result,
            updatedAt: new Date(),
          })
          .where(eq(discoveredCandidates.id, existing[0].id));
        candidates.push({ id: existing[0].id, name: result.fullName || null, source: sourceName, score: 0.5 });
        totalDiscovered++;
        continue;
      }

      const insertData: Record<string, unknown> = {
        sourceId,
        externalId: result.externalId,
        sourceUrl: result.sourceUrl,
        fullName: result.fullName,
        email: result.email,
        headline: result.headline,
        location: result.location,
        profileSummary: (structuredData.profileSummary as string) || result.profileSummary,
        skills: (structuredData.skills as string[]) || result.skills || [],
        experience: (structuredData.experience as Array<Record<string, unknown>>) || result.experience || [],
        education: (structuredData.education as Array<Record<string, unknown>>) || result.education || [],
        certifications: (structuredData.certifications as string[]) || result.certifications || [],
        languages: (structuredData.languages as string[]) || result.languages || [],
        currentEmployer: (structuredData.currentEmployer as string) || result.currentEmployer,
        previousEmployers: (structuredData.previousEmployers as string[]) || result.previousEmployers || [],
        socialLinks: result.socialLinks || {},
        matchedByEmployerId: params.employerId,
        authenticityScore: 0.5,
        profileQualityScore: 0.5,
        spamProbability: 0.0,
        fraudProbability: 0.0,
        verificationStatus: "pending",
        status: "discovered",
        discoveryMetadata: { source: sourceName, discoveredAt: new Date().toISOString(), rawLength: result.rawContent?.length || 0 },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const [inserted] = await (db.insert(discoveredCandidates).values(insertData as any).returning({ id: discoveredCandidates.id, fullName: discoveredCandidates.fullName }));

      if (result.rawContent) {
        await this.detectIntentSignals(inserted.id, result.rawContent, sourceName);
      }

      if ((structuredData.skills as string[])?.length || structuredData.experience || result.location) {
        await this.buildOpportunityGraphEdges(inserted.id, {
          skills: (structuredData.skills as string[]) || result.skills || [],
          location: result.location,
          currentEmployer: (structuredData.currentEmployer as string) || result.currentEmployer,
          certifications: (structuredData.certifications as string[]) || result.certifications || [],
        });
      }

      candidates.push({ id: inserted.id, name: inserted.fullName, source: sourceName, score: 0.5 });
      totalDiscovered++;
    }

    await eventBus.emitEvent({
      type: RecruitmentEventTypes.AGENT_ACTION,
      source: "discovery-agent",
      payload: { employerId: params.employerId, discovered: totalDiscovered, sources: sourceNames },
      timestamp: new Date(),
    });

    logger.info({ employerId: params.employerId, discovered: totalDiscovered }, "Discovery agent completed");

    return { discovered: totalDiscovered, candidates };
  }

  async discoverFromAi(params: {
    employerId: number;
    jobId: number;
    sourceFilter?: string[];
  }): Promise<{
    discovered: number;
    candidates: Array<{ id: number; name: string | null; source: string; score: number }>;
  }> {
    const [job] = await db.select({
      id: jobs.id,
      title: jobs.title,
      description: jobs.description,
      skills: jobs.skills,
      location: jobs.location,
      experienceLevel: jobs.experienceLevel,
    }).from(jobs).where(eq(jobs.id, params.jobId)).limit(1) as any;

    if (!job) return { discovered: 0, candidates: [] };

    try {
      const completion = await openrouter().chat.completions.create({
        model: "openrouter/free",
        messages: [
          { role: "system", content: "You generate simulated candidate profile data for recruitment testing. Return ONLY valid JSON arrays." },
          {
            role: "user",
            content: `Generate 10 fictional but realistic candidate profiles for this job.
These represent what real candidates found on the internet might look like.

Job Title: ${job.title}
Skills: ${JSON.stringify(job.skills || [])}
Location: ${job.location || "Not specified"}
Experience: ${job.experienceLevel || "Not specified"}

Each candidate should have diverse backgrounds, locations (focus on Africa/Middle East), and skill levels.

Return ONLY a JSON array of objects with these fields:
{
  "fullName": string,
  "headline": string,
  "location": string,
  "profileSummary": string,
  "skills": string[],
  "experience": [{ "role": string, "company": string, "duration": string, "description": string }],
  "education": [{ "degree": string, "institution": string, "year": string }],
  "certifications": string[],
  "languages": string[],
  "currentEmployer": string,
  "previousEmployers": string[],
  "email": string (make it unique),
  "intentSignals": string (text like "looking for opportunities in Qatar" or "open to relocation")
}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 4096,
      });

      const raw = completion.choices[0].message.content || "[]";
      const profiles = JSON.parse(raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim());

      if (!Array.isArray(profiles)) return { discovered: 0, candidates: [] };

      for (const profile of profiles) {
        const existing = profile.email
          ? await db.select({ id: discoveredCandidates.id })
              .from(discoveredCandidates)
              .where(eq(discoveredCandidates.email, profile.email))
              .limit(1)
          : [];

        if (existing.length > 0) continue;

        const [inserted] = await db.insert(discoveredCandidates).values({
          fullName: profile.fullName,
          email: profile.email,
          headline: profile.headline,
          location: profile.location,
          profileSummary: profile.profileSummary,
          skills: profile.skills || [],
          experience: profile.experience || [],
          education: profile.education || [],
          certifications: profile.certifications || [],
          languages: profile.languages || [],
          currentEmployer: profile.currentEmployer,
          previousEmployers: profile.previousEmployers || [],
          matchedByEmployerId: params.employerId,
          authenticityScore: 0.7,
          profileQualityScore: 0.6,
          verificationStatus: "pending",
          status: "discovered",
          discoveryMetadata: { source: "ai_generation", jobId: params.jobId, generatedAt: new Date().toISOString() },
          createdAt: new Date(),
          updatedAt: new Date(),
        }).returning({ id: discoveredCandidates.id, fullName: discoveredCandidates.fullName });

        if (profile.intentSignals) {
          await this.detectIntentSignals(inserted.id, profile.intentSignals, "ai_generated_profile");
        }

        await this.buildOpportunityGraphEdges(inserted.id, {
          skills: profile.skills || [],
          location: profile.location,
          currentEmployer: profile.currentEmployer,
          certifications: profile.certifications || [],
        });
      }

      logger.info({ jobId: params.jobId, discovered: profiles.length }, "AI-powered discovery completed");
      return { discovered: profiles.length, candidates: [] };
    } catch (err) {
      logger.error({ err, jobId: params.jobId }, "AI discovery failed");
      return { discovered: 0, candidates: [] };
    }
  }

  private async extractStructuredData(rawContent: string): Promise<Record<string, unknown>> {
    try {
      const completion = await openrouter().chat.completions.create({
        model: "openrouter/free",
        messages: [
          { role: "system", content: "Extract structured recruitment data from unstructured text. Return ONLY valid JSON." },
          { role: "user", content: `Extract from this content:\n\n${rawContent.slice(0, 3000)}\n\nReturn JSON: { "profileSummary": string, "skills": string[], "experience": array, "education": array, "certifications": string[], "languages": string[], "currentEmployer": string, "previousEmployers": string[] }` },
        ],
        temperature: 0.1,
        max_tokens: 2000,
      });
      const raw = completion.choices[0].message.content || "{}";
      return JSON.parse(raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim());
    } catch {
      return {};
    }
  }

  async detectIntentSignals(candidateId: number, content: string, source: string): Promise<number> {
    const lower = content.toLowerCase();
    let detected = 0;

    for (const intent of INTENT_PATTERNS) {
      const matchedPattern = intent.patterns.find(p => lower.includes(p));
      if (matchedPattern) {
        const existing = await db.select({ id: intentSignals.id })
          .from(intentSignals)
          .where(and(
            eq(intentSignals.candidateId, candidateId),
            eq(intentSignals.signalType, intent.type),
          ))
          .limit(1);

        if (existing.length === 0) {
          await db.insert(intentSignals).values({
            candidateId,
            signalType: intent.type,
            signalText: matchedPattern,
            source,
            confidence: 0.7,
            detectedAt: new Date(),
            metadata: { fullContext: content.slice(0, 500) },
          });
          detected++;
        }
      }
    }

    return detected;
  }

  private async buildOpportunityGraphEdges(candidateId: number, data: {
    skills: string[];
    location?: string;
    currentEmployer?: string;
    certifications: string[];
  }): Promise<void> {
    const edges: Array<{ candidateId: number; relationType: string; relationValue: string; weight: number; source: string }> = [];

    for (const skill of data.skills || []) {
      edges.push({ candidateId, relationType: "has_skill", relationValue: skill, weight: 1.0, source: "discovery" });
    }
    if (data.location) {
      edges.push({ candidateId, relationType: "located_in", relationValue: data.location, weight: 0.8, source: "discovery" });
    }
    if (data.currentEmployer) {
      edges.push({ candidateId, relationType: "works_at", relationValue: data.currentEmployer, weight: 0.9, source: "discovery" });
    }
    for (const cert of data.certifications || []) {
      edges.push({ candidateId, relationType: "certified_in", relationValue: cert, weight: 0.7, source: "discovery" });
    }

    for (const edge of edges) {
      await db.insert(opportunityGraphEdges).values(edge).onConflictDoNothing();
    }
  }

  async getDiscoveredCandidates(params: {
    employerId?: number;
    status?: string;
    sourceId?: number;
    limit?: number;
    offset?: number;
  }): Promise<{ candidates: any[]; total: number }> {
    const conditions = [];
    if (params.employerId) conditions.push(eq(discoveredCandidates.matchedByEmployerId, params.employerId));
    if (params.status) conditions.push(eq(discoveredCandidates.status, params.status));
    if (params.sourceId) conditions.push(eq(discoveredCandidates.sourceId, params.sourceId));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const limit = params.limit || 50;
    const offset = params.offset || 0;

    const candidates = await db.select()
      .from(discoveredCandidates)
      .where(whereClause)
      .orderBy(sql`created_at DESC`)
      .limit(limit)
      .offset(offset);

    const totalResult = await db.select({ count: sql<number>`count(*)::int` })
      .from(discoveredCandidates)
      .where(whereClause);

    return { candidates, total: totalResult[0]?.count || 0 };
  }
}

export const discoveryAgent = new DiscoveryAgent();
