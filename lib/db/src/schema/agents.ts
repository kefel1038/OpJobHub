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

// ─── Phase 7A: Graph Evolution Tracking ──────────────────────────

export const graphEvolution = pgTable("graph_evolution", {
  id: serial("id").primaryKey(),
  snapshotDate: timestamp("snapshot_date").notNull().defaultNow(),
  nodeCounts: jsonb("node_counts").notNull().default({}),
  relationshipCount: integer("relationship_count").default(0),
  skillClusterCount: integer("skill_cluster_count").default(0),
  topSkills: jsonb("top_skills").default([]),
  topLocations: jsonb("top_locations").default([]),
  topIndustries: jsonb("top_industries").default([]),
  migrationFlowCount: integer("migration_flow_count").default(0),
  hiringPathwayCount: integer("hiring_pathway_count").default(0),
  newNodeLabels: jsonb("new_node_labels").default([]),
  newRelationTypes: jsonb("new_relation_types").default([]),
  candidateGrowth: doublePrecision("candidate_growth").default(0),
  skillDiversity: doublePrecision("skill_diversity").default(0),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type GraphEvolution = typeof graphEvolution.$inferSelect;
export type NewGraphEvolution = typeof graphEvolution.$inferInsert;

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

// ─── Phase 8: Hiring Simulation Engine ───────────────────────────

export const hiringSimulations = pgTable("hiring_simulations", {
  id: serial("id").primaryKey(),
  employerId: integer("employer_id").notNull(),
  candidateId: integer("candidate_id"),
  jobId: integer("job_id"),
  simulationType: text("simulation_type").notNull(), // hiring_success, retention, interview, offer_acceptance, sponsorship, skill_gap, career_trajectory, migration_stability
  probability: doublePrecision("probability").notNull().default(0),
  confidence: doublePrecision("confidence").default(0),
  confidenceIntervalLower: doublePrecision("confidence_interval_lower").default(0),
  confidenceIntervalUpper: doublePrecision("confidence_interval_upper").default(0),
  riskFactors: jsonb("risk_factors").default([]),
  positiveFactors: jsonb("positive_factors").default([]),
  simulationInputs: jsonb("simulation_inputs").default({}),
  scenarioId: integer("scenario_id"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const predictionOutcomes = pgTable("prediction_outcomes", {
  id: serial("id").primaryKey(),
  simulationId: integer("simulation_id").references(() => hiringSimulations.id, { onDelete: "cascade" }),
  employerId: integer("employer_id").notNull(),
  predictedProbability: doublePrecision("predicted_probability").notNull(),
  actualOutcome: text("actual_outcome"), // success, failure, pending, unknown
  outcomeValue: doublePrecision("outcome_value"), // 0 or 1 for binary, days for retention
  outcomeRecordedAt: timestamp("outcome_recorded_at"),
  predictionDrift: doublePrecision("prediction_drift"),
  calibrationError: doublePrecision("calibration_error"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const riskProfiles = pgTable("risk_profiles", {
  id: serial("id").primaryKey(),
  employerId: integer("employer_id").notNull(),
  candidateId: integer("candidate_id"),
  jobId: integer("job_id"),
  riskType: text("risk_type").notNull(), // churn, mismatch, sponsorship_failure, fraud, migration_instability, skill_obsolescence
  riskScore: doublePrecision("risk_score").notNull().default(0),
  riskLevel: text("risk_level").notNull().default("medium"), // low, medium, high, critical
  contributingFactors: jsonb("contributing_factors").default([]),
  mitigationSuggestions: jsonb("mitigation_suggestions").default([]),
  active: boolean("active").default(true),
  resolvedAt: timestamp("resolved_at"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const simulationScenarios = pgTable("simulation_scenarios", {
  id: serial("id").primaryKey(),
  employerId: integer("employer_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  scenarioType: text("scenario_type").notNull(), // what_if_salary, what_if_location, what_if_skills, what_if_recruiter_preference, custom
  parameterChanges: jsonb("parameter_changes").notNull().default({}),
  baselineSimulationId: integer("baseline_simulation_id"),
  results: jsonb("results").default({}),
  executedAt: timestamp("executed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const retentionMetrics = pgTable("retention_metrics", {
  id: serial("id").primaryKey(),
  employerId: integer("employer_id").notNull(),
  candidateId: integer("candidate_id"),
  jobId: integer("job_id"),
  hireDate: timestamp("hire_date"),
  retentionDays: integer("retention_days").default(0),
  isCurrent: boolean("is_current").default(true),
  performanceScore: doublePrecision("performance_score"),
  engagementScore: doublePrecision("engagement_score"),
  promotionCount: integer("promotion_count").default(0),
  lastPromotionDate: timestamp("last_promotion_date"),
  exitDate: timestamp("exit_date"),
  exitReason: text("exit_reason"),
  riskFlags: jsonb("risk_flags").default([]),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const predictionAccuracy = pgTable("prediction_accuracy", {
  id: serial("id").primaryKey(),
  employerId: integer("employer_id"),
  simulationType: text("simulation_type").notNull(),
  totalPredictions: integer("total_predictions").default(0),
  accuratePredictions: integer("accurate_predictions").default(0),
  accuracyRate: doublePrecision("accuracy_rate").default(0),
  averageConfidence: doublePrecision("average_confidence").default(0),
  averageCalibrationError: doublePrecision("average_calibration_error").default(0),
  mae: doublePrecision("mae").default(0), // mean absolute error
  rmse: doublePrecision("rmse").default(0), // root mean squared error
  windowStart: timestamp("window_start"),
  windowEnd: timestamp("window_end"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type HiringSimulation = typeof hiringSimulations.$inferSelect;
export type NewHiringSimulation = typeof hiringSimulations.$inferInsert;
export type PredictionOutcome = typeof predictionOutcomes.$inferSelect;
export type NewPredictionOutcome = typeof predictionOutcomes.$inferInsert;
export type RiskProfile = typeof riskProfiles.$inferSelect;
export type NewRiskProfile = typeof riskProfiles.$inferInsert;
export type SimulationScenario = typeof simulationScenarios.$inferSelect;
export type NewSimulationScenario = typeof simulationScenarios.$inferInsert;
export type RetentionMetric = typeof retentionMetrics.$inferSelect;
export type NewRetentionMetric = typeof retentionMetrics.$inferInsert;
export type PredictionAccuracy = typeof predictionAccuracy.$inferSelect;
export type NewPredictionAccuracy = typeof predictionAccuracy.$inferInsert;

// ─── Phase 9A: Labor Market Intelligence ──────────────────────────

export const laborMetrics = pgTable("labor_metrics", {
  id: serial("id").primaryKey(),
  metricType: text("metric_type").notNull(), // demand_index, supply_index, hiring_velocity, sponsorship_demand, talent_scarcity, wage_pressure
  metricName: text("metric_name").notNull(),
  metricValue: doublePrecision("metric_value").notNull().default(0),
  previousValue: doublePrecision("previous_value").default(0),
  changeRate: doublePrecision("change_rate").default(0), // % change over window
  region: text("region"),
  industry: text("industry"),
  role: text("role"),
  skill: text("skill"),
  confidence: doublePrecision("confidence").default(0.5),
  sampleSize: integer("sample_size").default(0),
  windowStart: timestamp("window_start"),
  windowEnd: timestamp("window_end").notNull().defaultNow(),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const workforceFlows = pgTable("workforce_flows", {
  id: serial("id").primaryKey(),
  flowType: text("flow_type").notNull(), // migration, industry_transition, skill_transition, career_progression
  sourceRegion: text("source_region"),
  destinationRegion: text("destination_region"),
  sourceIndustry: text("source_industry"),
  destinationIndustry: text("destination_industry"),
  sourceSkill: text("source_skill"),
  destinationSkill: text("destination_skill"),
  flowVolume: integer("flow_volume").default(0),
  flowVelocity: doublePrecision("flow_velocity").default(0), // change rate
  confidence: doublePrecision("confidence").default(0.5),
  periodStart: timestamp("period_start"),
  periodEnd: timestamp("period_end").notNull().defaultNow(),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const skillTrends = pgTable("skill_trends", {
  id: serial("id").primaryKey(),
  skillName: text("skill_name").notNull(),
  trendType: text("trend_type").notNull(), // rising, declining, emerging, resurging, stable
  demandScore: doublePrecision("demand_score").default(0.5),
  supplyScore: doublePrecision("supply_score").default(0.5),
  growthRate: doublePrecision("growth_rate").default(0),
  adjacencyScore: doublePrecision("adjacency_score").default(0),
  industry: text("industry"),
  region: text("region"),
  certificationMomentum: doublePrecision("certification_momentum").default(0),
  salaryPremium: doublePrecision("salary_premium").default(0),
  windowStart: timestamp("window_start"),
  windowEnd: timestamp("window_end").notNull().defaultNow(),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const employerMetrics = pgTable("employer_metrics", {
  id: serial("id").primaryKey(),
  employerId: integer("employer_id").notNull(),
  metricType: text("metric_type").notNull(), // hiring_velocity, response_rate, retention_rate, sponsorship_rate, competition_intensity
  metricValue: doublePrecision("metric_value").notNull().default(0),
  previousValue: doublePrecision("previous_value").default(0),
  changeRate: doublePrecision("change_rate").default(0),
  industry: text("industry"),
  region: text("region"),
  windowStart: timestamp("window_start"),
  windowEnd: timestamp("window_end").notNull().defaultNow(),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const migrationCorridors = pgTable("migration_corridors", {
  id: serial("id").primaryKey(),
  sourceCountry: text("source_country").notNull(),
  destinationCountry: text("destination_country").notNull(),
  corridorVolume: integer("corridor_volume").default(0),
  growthRate: doublePrecision("growth_rate").default(0),
  topSkills: jsonb("top_skills").default([]),
  topIndustries: jsonb("top_industries").default([]),
  sponsorshipRate: doublePrecision("sponsorship_rate").default(0),
  averageVisaProcessingDays: integer("average_visa_processing_days").default(0),
  retentionRate: doublePrecision("retention_rate").default(0),
  wagePremium: doublePrecision("wage_premium").default(0),
  confidence: doublePrecision("confidence").default(0.5),
  periodStart: timestamp("period_start"),
  periodEnd: timestamp("period_end").notNull().defaultNow(),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const regionalSnapshots = pgTable("regional_snapshots", {
  id: serial("id").primaryKey(),
  region: text("region").notNull(),
  snapshotType: text("snapshot_type").notNull(), // full, demand, supply, migration, skills
  totalCandidates: integer("total_candidates").default(0),
  totalEmployers: integer("total_employers").default(0),
  totalJobs: integer("total_jobs").default(0),
  demandIndex: doublePrecision("demand_index").default(0),
  supplyIndex: doublePrecision("supply_index").default(0),
  talentScarcityScore: doublePrecision("talent_scarcity_score").default(0),
  averageSalary: doublePrecision("average_salary").default(0),
  hiringVelocity: doublePrecision("hiring_velocity").default(0),
  sponsorshipDemand: doublePrecision("sponsorship_demand").default(0),
  migrationInflow: integer("migration_inflow").default(0),
  migrationOutflow: integer("migration_outflow").default(0),
  topSkillsDemanded: jsonb("top_skills_demanded").default([]),
  topSkillsSupplied: jsonb("top_skills_supplied").default([]),
  topIndustries: jsonb("top_industries").default([]),
  emergingSectors: jsonb("emerging_sectors").default([]),
  metadata: jsonb("metadata").default({}),
  snapshotDate: timestamp("snapshot_date").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type LaborMetric = typeof laborMetrics.$inferSelect;
export type NewLaborMetric = typeof laborMetrics.$inferInsert;
export type WorkforceFlow = typeof workforceFlows.$inferSelect;
export type NewWorkforceFlow = typeof workforceFlows.$inferInsert;
export type SkillTrend = typeof skillTrends.$inferSelect;
export type NewSkillTrend = typeof skillTrends.$inferInsert;
export type EmployerMetric = typeof employerMetrics.$inferSelect;
export type NewEmployerMetric = typeof employerMetrics.$inferInsert;
export type MigrationCorridor = typeof migrationCorridors.$inferSelect;
export type NewMigrationCorridor = typeof migrationCorridors.$inferInsert;
export type RegionalSnapshot = typeof regionalSnapshots.$inferSelect;
export type NewRegionalSnapshot = typeof regionalSnapshots.$inferInsert;

// ─── Phase 9B: Migration Intelligence ─────────────────────────────

export const migrationEvents = pgTable("migration_events", {
  id: serial("id").primaryKey(),
  candidateId: integer("candidate_id").notNull(),
  eventType: text("event_type").notNull(), // relocation, sponsorship_application, visa_filed, visa_approved, visa_rejected, relocation_completed, relocation_failed
  sourceCountry: text("source_country"),
  destinationCountry: text("destination_country"),
  employerId: integer("employer_id"),
  jobId: integer("job_id"),
  eventDate: timestamp("event_date").notNull().defaultNow(),
  outcome: text("outcome"), // success, failure, pending
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const sponsorshipOutcomes = pgTable("sponsorship_outcomes", {
  id: serial("id").primaryKey(),
  employerId: integer("employer_id").notNull(),
  candidateId: integer("candidate_id").notNull(),
  jobId: integer("job_id"),
  nationality: text("nationality"),
  destinationCountry: text("destination_country"),
  visaType: text("visa_type"), // work_visa, sponsored_residency, freelance_visa, golden_visa
  applicationDate: timestamp("application_date"),
  approvalDate: timestamp("approval_date"),
  status: text("status").notNull().default("pending"), // pending, approved, rejected, withdrawn
  processingDays: integer("processing_days"),
  sponsorCost: doublePrecision("sponsor_cost"),
  retentionDays: integer("retention_days").default(0),
  salaryAtSponsorship: doublePrecision("salary_at_sponsorship"),
  currentSalary: doublePrecision("current_salary"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const corridorMetrics = pgTable("corridor_metrics", {
  id: serial("id").primaryKey(),
  sourceCountry: text("source_country").notNull(),
  destinationCountry: text("destination_country").notNull(),
  demandScore: doublePrecision("demand_score").default(0.5),
  supplyScore: doublePrecision("supply_score").default(0.5),
  sponsorshipEase: doublePrecision("sponsorship_ease").default(0.5),
  migrationStability: doublePrecision("migration_stability").default(0.5),
  retentionQuality: doublePrecision("retention_quality").default(0.5),
  salaryUplift: doublePrecision("salary_uplift").default(0),
  employerConfidence: doublePrecision("employer_confidence").default(0.5),
  healthScore: doublePrecision("health_score").default(0.5),
  totalMigrated: integer("total_migrated").default(0),
  activeInPipeline: integer("active_in_pipeline").default(0),
  topSkillsExported: jsonb("top_skills_exported").default([]),
  topRolesDemanded: jsonb("top_roles_demanded").default([]),
  periodStart: timestamp("period_start"),
  periodEnd: timestamp("period_end").notNull().defaultNow(),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const migrationRisks = pgTable("migration_risks", {
  id: serial("id").primaryKey(),
  riskType: text("risk_type").notNull(), // corridor_instability, sponsorship_fraud, high_churn, visa_rejection, exploitation, mismatch
  corridorSource: text("corridor_source"),
  corridorDestination: text("corridor_destination"),
  employerId: integer("employer_id"),
  riskScore: doublePrecision("risk_score").notNull().default(0),
  riskLevel: text("risk_level").notNull().default("medium"), // low, medium, high, critical
  contributingFactors: jsonb("contributing_factors").default([]),
  affectedCandidateCount: integer("affected_candidate_count").default(0),
  mitigationSuggestions: jsonb("mitigation_suggestions").default([]),
  active: boolean("active").default(true),
  detectedAt: timestamp("detected_at").notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const relocationProfiles = pgTable("relocation_profiles", {
  id: serial("id").primaryKey(),
  candidateId: integer("candidate_id").notNull(),
  readinessScore: doublePrecision("readiness_score").default(0.5),
  mobilityScore: doublePrecision("mobility_score").default(0.5),
  preferredDestinations: jsonb("preferred_destinations").default([]),
  familyStatus: text("family_status"),
  visaStatus: text("visa_status"),
  sponsorshipRequired: boolean("sponsorship_required").default(true),
  languageProficiency: jsonb("language_proficiency").default({}),
  previousRelocations: integer("previous_relocations").default(0),
  relocationTimeline: text("relocation_timeline"), // immediate, 1_3_months, 3_6_months, 6_12_months, flexible
  financialReadiness: doublePrecision("financial_readiness").default(0.5),
  socialConnections: jsonb("social_connections").default([]),
  assessedAt: timestamp("assessed_at").notNull().defaultNow(),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const migrationForecasts = pgTable("migration_forecasts", {
  id: serial("id").primaryKey(),
  corridorSource: text("corridor_source").notNull(),
  corridorDestination: text("corridor_destination").notNull(),
  forecastType: text("forecast_type").notNull(), // volume, skill_demand, sponsorship_demand, wage_impact, corridor_growth
  forecastPeriod: text("forecast_period").notNull(), // 30d, 90d, 180d, 1y, 2y, 5y
  predictedValue: doublePrecision("predicted_value").default(0),
  confidenceLower: doublePrecision("confidence_lower").default(0),
  confidenceUpper: doublePrecision("confidence_upper").default(0),
  confidence: doublePrecision("confidence").default(0.5),
  keyDrivers: jsonb("key_drivers").default([]),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type MigrationEvent = typeof migrationEvents.$inferSelect;
export type NewMigrationEvent = typeof migrationEvents.$inferInsert;
export type SponsorshipOutcome = typeof sponsorshipOutcomes.$inferSelect;
export type NewSponsorshipOutcome = typeof sponsorshipOutcomes.$inferInsert;
export type CorridorMetric = typeof corridorMetrics.$inferSelect;
export type NewCorridorMetric = typeof corridorMetrics.$inferInsert;
export type MigrationRisk = typeof migrationRisks.$inferSelect;
export type NewMigrationRisk = typeof migrationRisks.$inferInsert;
export type RelocationProfile = typeof relocationProfiles.$inferSelect;
export type NewRelocationProfile = typeof relocationProfiles.$inferInsert;
export type MigrationForecast = typeof migrationForecasts.$inferSelect;
export type NewMigrationForecast = typeof migrationForecasts.$inferInsert;
