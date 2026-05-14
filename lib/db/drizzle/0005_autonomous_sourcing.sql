CREATE TABLE "candidate_sources" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"type" text DEFAULT 'web' NOT NULL,
	"base_url" text,
	"is_active" boolean DEFAULT true,
	"trust_score" double precision DEFAULT 0.5,
	"rate_limit_per_hour" integer DEFAULT 100,
	"rate_limit_window" text DEFAULT 'hour',
	"config" jsonb DEFAULT '{}'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"last_queried_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "candidate_sources_name_idx" ON "candidate_sources" ("name");
--> statement-breakpoint
CREATE TABLE "discovered_candidates" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_id" integer,
	"external_id" text,
	"source_url" text,
	"full_name" text,
	"email" text,
	"phone_number" text,
	"headline" text,
	"location" text,
	"profile_summary" text,
	"avatar_url" text,
	"skills" jsonb DEFAULT '[]'::jsonb,
	"experience" jsonb DEFAULT '[]'::jsonb,
	"education" jsonb DEFAULT '[]'::jsonb,
	"certifications" jsonb DEFAULT '[]'::jsonb,
	"languages" jsonb DEFAULT '[]'::jsonb,
	"normalized_skills" jsonb DEFAULT '[]'::jsonb,
	"experience_level" text,
	"industry" text,
	"nationality" text,
	"visa_status" text,
	"relocation_intent" text,
	"current_employer" text,
	"previous_employers" jsonb DEFAULT '[]'::jsonb,
	"social_links" jsonb DEFAULT '{}'::jsonb,
	"authenticity_score" double precision DEFAULT 0.5,
	"profile_quality_score" double precision DEFAULT 0.5,
	"spam_probability" double precision DEFAULT 0.0,
	"fraud_probability" double precision DEFAULT 0.0,
	"verification_status" text DEFAULT 'pending',
	"status" text DEFAULT 'discovered',
	"matched_application_id" integer,
	"matched_job_id" integer,
	"last_contacted_at" timestamp,
	"discovery_metadata" jsonb DEFAULT '{}'::jsonb,
	"matched_by_employer_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "discovered_candidates_status_idx" ON "discovered_candidates" ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "discovered_candidates_employer_idx" ON "discovered_candidates" ("matched_by_employer_id");
--> statement-breakpoint
CREATE TABLE "intent_signals" (
	"id" serial PRIMARY KEY NOT NULL,
	"candidate_id" integer,
	"signal_type" text NOT NULL,
	"signal_text" text,
	"source" text,
	"source_url" text,
	"confidence" double precision DEFAULT 0.5,
	"detected_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "intent_signals_candidate_idx" ON "intent_signals" ("candidate_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "intent_signals_type_idx" ON "intent_signals" ("signal_type");
--> statement-breakpoint
CREATE TABLE "candidate_enrichments" (
	"id" serial PRIMARY KEY NOT NULL,
	"candidate_id" integer NOT NULL,
	"enrichment_type" text NOT NULL,
	"enrichment_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"confidence" double precision DEFAULT 0.5,
	"enrichment_source" text DEFAULT 'ai',
	"model_used" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "candidate_enrichments_candidate_idx" ON "candidate_enrichments" ("candidate_id");
--> statement-breakpoint
CREATE TABLE "opportunity_graph_edges" (
	"id" serial PRIMARY KEY NOT NULL,
	"candidate_id" integer NOT NULL,
	"relation_type" text NOT NULL,
	"relation_value" text NOT NULL,
	"weight" double precision DEFAULT 1.0,
	"source" text DEFAULT 'discovery',
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "opportunity_graph_candidate_idx" ON "opportunity_graph_edges" ("candidate_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "opportunity_graph_relation_idx" ON "opportunity_graph_edges" ("relation_type", "relation_value");
--> statement-breakpoint
CREATE TABLE "discovery_pipelines" (
	"id" serial PRIMARY KEY NOT NULL,
	"employer_id" integer NOT NULL,
	"name" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"sources" jsonb DEFAULT '[]'::jsonb,
	"search_params" jsonb DEFAULT '{}'::jsonb,
	"schedule" text DEFAULT 'manual',
	"last_run_at" timestamp,
	"total_discovered" integer DEFAULT 0,
	"total_contacted" integer DEFAULT 0,
	"total_converted" integer DEFAULT 0,
	"config" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "discovery_pipelines_employer_idx" ON "discovery_pipelines" ("employer_id");
