import { pgTable, serial, text, integer, doublePrecision, timestamp, jsonb, unique, boolean } from "drizzle-orm/pg-core";

export const agentEvents = pgTable("agent_events", {
  id: serial("id").primaryKey(),
  eventType: text("event_type").notNull(),
  source: text("source").notNull(),
  payload: jsonb("payload").notNull().default({}),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const recruiterMemory = pgTable("recruiter_memory", {
  id: serial("id").primaryKey(),
  employerId: integer("employer_id").notNull(),
  key: text("key").notNull(),
  value: text("value").notNull(),
  confidence: doublePrecision("confidence").notNull().default(0.8),
  source: text("source").notNull().default("manual"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  employerKeyUnique: unique().on(table.employerId, table.key),
}));

export const hiringMemory = pgTable("hiring_memory", {
  id: serial("id").primaryKey(),
  employerId: integer("employer_id").notNull(),
  candidateId: integer("candidate_id").notNull(),
  jobId: integer("job_id").notNull(),
  outcome: text("outcome").notNull(),
  reason: text("reason").notNull().default(""),
  skills: jsonb("skills").notNull().default([]),
  interviewFeedback: text("interview_feedback"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const behavioralSignals = pgTable("behavioral_signals", {
  id: serial("id").primaryKey(),
  employerId: integer("employer_id").notNull(),
  actionType: text("action_type").notNull(),
  candidateId: integer("candidate_id"),
  jobId: integer("job_id"),
  signalStrength: doublePrecision("signal_strength").notNull(),
  actionMetadata: jsonb("action_metadata").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const inferredPreferences = pgTable("inferred_preferences", {
  id: serial("id").primaryKey(),
  employerId: integer("employer_id").notNull(),
  preferenceKey: text("preference_key").notNull(),
  preferenceValue: text("preference_value").notNull(),
  confidence: doublePrecision("confidence").notNull().default(0.5),
  source: text("source").notNull().default("behavioral_inference"),
  supportingSignals: integer("supporting_signals").default(0),
  firstDetectedAt: timestamp("first_detected_at").notNull().defaultNow(),
  lastReinforcedAt: timestamp("last_reinforced_at").notNull().defaultNow(),
  decayStartedAt: timestamp("decay_started_at"),
  isActive: boolean("is_active").notNull().default(true),
  signalDetails: jsonb("signal_details").default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  employerPreferenceUnique: unique().on(table.employerId, table.preferenceKey, table.preferenceValue),
}));

export const preferenceEmbeddings = pgTable("preference_embeddings", {
  id: serial("id").primaryKey(),
  employerId: integer("employer_id").notNull(),
  preferenceKey: text("preference_key").notNull(),
  preferenceValue: text("preference_value").notNull(),
  embedding: text("embedding"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  employerPreferenceEmbeddingUnique: unique().on(table.employerId, table.preferenceKey, table.preferenceValue),
}));

// ─── Phase 5B: Observability + Governance Tables ────────────────

export const agentReasoningLogs = pgTable("agent_reasoning_logs", {
  id: serial("id").primaryKey(),
  employerId: integer("employer_id").notNull(),
  agentType: text("agent_type").notNull(),
  decisionType: text("decision_type").notNull(),
  targetId: integer("target_id"),
  targetType: text("target_type"),
  score: doublePrecision("score"),
  confidence: doublePrecision("confidence"),
  reasoning: jsonb("reasoning").notNull().default([]),
  inputContext: jsonb("input_context"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const approvalWorkflows = pgTable("approval_workflows", {
  id: serial("id").primaryKey(),
  employerId: integer("employer_id").notNull(),
  actionType: text("action_type").notNull(),
  targetId: integer("target_id"),
  targetType: text("target_type"),
  status: text("status").notNull().default("pending_approval"),
  aiSuggestion: jsonb("ai_suggestion"),
  confidence: doublePrecision("confidence"),
  reasoning: jsonb("reasoning").default([]),
  approvedBy: integer("approved_by"),
  rejectedReason: text("rejected_reason"),
  autoExecuted: boolean("auto_executed").default(false),
  expiresAt: timestamp("expires_at"),
  decidedAt: timestamp("decided_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const overrideEvents = pgTable("override_events", {
  id: serial("id").primaryKey(),
  employerId: integer("employer_id").notNull(),
  actionType: text("action_type").notNull(),
  targetId: integer("target_id"),
  targetType: text("target_type"),
  aiSuggestedValue: text("ai_suggested_value"),
  humanChosenValue: text("human_chosen_value"),
  overrideReason: text("override_reason"),
  confidenceAtTime: doublePrecision("confidence_at_time"),
  reasoningSnapshot: jsonb("reasoning_snapshot"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const safetyFlags = pgTable("safety_flags", {
  id: serial("id").primaryKey(),
  employerId: integer("employer_id"),
  flagType: text("flag_type").notNull(),
  severity: text("severity").notNull().default("info"),
  title: text("title").notNull(),
  description: text("description"),
  affectedAgent: text("affected_agent"),
  affectedEntityId: integer("affected_entity_id"),
  affectedEntityType: text("affected_entity_type"),
  metadata: jsonb("metadata").default({}),
  resolved: boolean("resolved").default(false),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const driftMetrics = pgTable("drift_metrics", {
  id: serial("id").primaryKey(),
  employerId: integer("employer_id"),
  metricType: text("metric_type").notNull(),
  metricName: text("metric_name").notNull(),
  currentValue: doublePrecision("current_value"),
  previousValue: doublePrecision("previous_value"),
  driftAmount: doublePrecision("drift_amount"),
  driftDirection: text("drift_direction"),
  windowStart: timestamp("window_start"),
  windowEnd: timestamp("window_end").notNull().defaultNow(),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const agentMetrics = pgTable("agent_metrics", {
  id: serial("id").primaryKey(),
  employerId: integer("employer_id"),
  agentType: text("agent_type").notNull(),
  metricName: text("metric_name").notNull(),
  metricValue: doublePrecision("metric_value").notNull(),
  unit: text("unit"),
  tags: jsonb("tags").default({}),
  recordedAt: timestamp("recorded_at").notNull().defaultNow(),
});

export type AgentEvent = typeof agentEvents.$inferSelect;
export type NewAgentEvent = typeof agentEvents.$inferInsert;
export type RecruiterMemoryEntry = typeof recruiterMemory.$inferSelect;
export type NewRecruiterMemoryEntry = typeof recruiterMemory.$inferInsert;
export type HiringMemoryEntry = typeof hiringMemory.$inferSelect;
export type NewHiringMemoryEntry = typeof hiringMemory.$inferInsert;
export type BehavioralSignal = typeof behavioralSignals.$inferSelect;
export type NewBehavioralSignal = typeof behavioralSignals.$inferInsert;
export type InferredPreference = typeof inferredPreferences.$inferSelect;
export type NewInferredPreference = typeof inferredPreferences.$inferInsert;
export type PreferenceEmbedding = typeof preferenceEmbeddings.$inferSelect;
export type NewPreferenceEmbedding = typeof preferenceEmbeddings.$inferInsert;
export type AgentReasoningLog = typeof agentReasoningLogs.$inferSelect;
export type NewAgentReasoningLog = typeof agentReasoningLogs.$inferInsert;
export type ApprovalWorkflow = typeof approvalWorkflows.$inferSelect;
export type NewApprovalWorkflow = typeof approvalWorkflows.$inferInsert;
export type OverrideEvent = typeof overrideEvents.$inferSelect;
export type NewOverrideEvent = typeof overrideEvents.$inferInsert;
export type SafetyFlag = typeof safetyFlags.$inferSelect;
export type NewSafetyFlag = typeof safetyFlags.$inferInsert;
export type DriftMetric = typeof driftMetrics.$inferSelect;
export type NewDriftMetric = typeof driftMetrics.$inferInsert;
export type AgentMetric = typeof agentMetrics.$inferSelect;
export type NewAgentMetric = typeof agentMetrics.$inferInsert;

// ─── Phase 6A: Autonomous Sourcing Infrastructure ──────────────

export const candidateSources = pgTable("candidate_sources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
  type: text("type").notNull().default("web"), // linkedin, github, telegram, stackoverflow, whatsapp, twitter, university, freelance, custom
  baseUrl: text("base_url"),
  isActive: boolean("is_active").default(true),
  trustScore: doublePrecision("trust_score").default(0.5),
  rateLimitPerHour: integer("rate_limit_per_hour").default(100),
  rateLimitWindow: text("rate_limit_window").default("hour"),
  config: jsonb("config").default({}),
  metadata: jsonb("metadata").default({}),
  lastQueriedAt: timestamp("last_queried_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const discoveredCandidates = pgTable("discovered_candidates", {
  id: serial("id").primaryKey(),
  sourceId: integer("source_id").references(() => candidateSources.id, { onDelete: "set null" }),
  externalId: text("external_id"), // platform-specific ID
  sourceUrl: text("source_url"),
  fullName: text("full_name"),
  email: text("email"),
  phoneNumber: text("phone_number"),
  headline: text("headline"),
  location: text("location"),
  profileSummary: text("profile_summary"),
  avatarUrl: text("avatar_url"),
  skills: jsonb("skills").$type<string[]>().default([]),
  experience: jsonb("experience").default([]),
  education: jsonb("education").default([]),
  certifications: jsonb("certifications").$type<string[]>().default([]),
  languages: jsonb("languages").$type<string[]>().default([]),
  normalizedSkills: jsonb("normalized_skills").$type<string[]>().default([]),
  experienceLevel: text("experience_level"),
  industry: text("industry"),
  nationality: text("nationality"),
  visaStatus: text("visa_status"),
  relocationIntent: text("relocation_intent"),
  currentEmployer: text("current_employer"),
  previousEmployers: jsonb("previous_employers").$type<string[]>().default([]),
  socialLinks: jsonb("social_links").default({}),

  // Verification scores
  authenticityScore: doublePrecision("authenticity_score").default(0.5),
  profileQualityScore: doublePrecision("profile_quality_score").default(0.5),
  spamProbability: doublePrecision("spam_probability").default(0.0),
  fraudProbability: doublePrecision("fraud_probability").default(0.0),
  verificationStatus: text("verification_status").default("pending"), // pending, verified, suspicious, rejected

  // Status
  status: text("status").default("discovered"), // discovered, enriched, verified, matched, contacted, converted, archived
  matchedApplicationId: integer("matched_application_id"),
  matchedJobId: integer("matched_job_id"),
  lastContactedAt: timestamp("last_contacted_at"),
  discoveryMetadata: jsonb("discovery_metadata").default({}),

  matchedByEmployerId: integer("matched_by_employer_id"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const intentSignals = pgTable("intent_signals", {
  id: serial("id").primaryKey(),
  candidateId: integer("candidate_id").references(() => discoveredCandidates.id, { onDelete: "cascade" }),
  signalType: text("signal_type").notNull(), // employment_intent, relocation_intent, sponsorship_seeking, immediate_availability, skill_acquisition, career_change
  signalText: text("signal_text"),
  source: text("source"),
  sourceUrl: text("source_url"),
  confidence: doublePrecision("confidence").default(0.5),
  detectedAt: timestamp("detected_at").notNull().defaultNow(),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const candidateEnrichments = pgTable("candidate_enrichments", {
  id: serial("id").primaryKey(),
  candidateId: integer("candidate_id").references(() => discoveredCandidates.id, { onDelete: "cascade" }).notNull(),
  enrichmentType: text("enrichment_type").notNull(), // skill_inference, experience_normalization, language_detection, migration_analysis, sponsorship_readiness, industry_classification
  enrichmentData: jsonb("enrichment_data").notNull().default({}),
  confidence: doublePrecision("confidence").default(0.5),
  enrichmentSource: text("enrichment_source").default("ai"), // ai, rule_based, external_api
  modelUsed: text("model_used"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const opportunityGraphEdges = pgTable("opportunity_graph_edges", {
  id: serial("id").primaryKey(),
  candidateId: integer("candidate_id").references(() => discoveredCandidates.id, { onDelete: "cascade" }).notNull(),
  relationType: text("relation_type").notNull(), // has_skill, located_in, interested_in, works_at, studied_at, certified_in, similar_to
  relationValue: text("relation_value").notNull(), // the skill name, location, industry, etc.
  weight: doublePrecision("weight").default(1.0),
  source: text("source").default("discovery"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const discoveryPipelines = pgTable("discovery_pipelines", {
  id: serial("id").primaryKey(),
  employerId: integer("employer_id").notNull(),
  name: text("name").notNull(),
  isActive: boolean("is_active").default(true),
  sources: jsonb("sources").$type<string[]>().default([]), // ["linkedin", "github", "telegram"]
  searchParams: jsonb("search_params").default({}), // skills, locations, roles, etc.
  schedule: text("schedule").default("manual"), // manual, hourly, daily, weekly
  lastRunAt: timestamp("last_run_at"),
  totalDiscovered: integer("total_discovered").default(0),
  totalContacted: integer("total_contacted").default(0),
  totalConverted: integer("total_converted").default(0),
  config: jsonb("config").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type CandidateSource = typeof candidateSources.$inferSelect;
export type NewCandidateSource = typeof candidateSources.$inferInsert;
export type DiscoveredCandidate = typeof discoveredCandidates.$inferSelect;
export type NewDiscoveredCandidate = typeof discoveredCandidates.$inferInsert;
export type IntentSignal = typeof intentSignals.$inferSelect;
export type NewIntentSignal = typeof intentSignals.$inferInsert;
export type CandidateEnrichment = typeof candidateEnrichments.$inferSelect;
export type NewCandidateEnrichment = typeof candidateEnrichments.$inferInsert;
export type OpportunityGraphEdge = typeof opportunityGraphEdges.$inferSelect;
export type NewOpportunityGraphEdge = typeof opportunityGraphEdges.$inferInsert;
export type DiscoveryPipeline = typeof discoveryPipelines.$inferSelect;
export type NewDiscoveryPipeline = typeof discoveryPipelines.$inferInsert;
