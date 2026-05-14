CREATE TABLE "agent_reasoning_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"employer_id" integer NOT NULL,
	"agent_type" text NOT NULL,
	"decision_type" text NOT NULL,
	"target_id" integer,
	"target_type" text,
	"score" double precision,
	"confidence" double precision,
	"reasoning" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"input_context" jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "approval_workflows" (
	"id" serial PRIMARY KEY NOT NULL,
	"employer_id" integer NOT NULL,
	"action_type" text NOT NULL,
	"target_id" integer,
	"target_type" text,
	"status" text DEFAULT 'pending_approval' NOT NULL,
	"ai_suggestion" jsonb,
	"confidence" double precision,
	"reasoning" jsonb DEFAULT '[]'::jsonb,
	"approved_by" integer,
	"rejected_reason" text,
	"auto_executed" boolean DEFAULT false,
	"expires_at" timestamp,
	"decided_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "override_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"employer_id" integer NOT NULL,
	"action_type" text NOT NULL,
	"target_id" integer,
	"target_type" text,
	"ai_suggested_value" text,
	"human_chosen_value" text,
	"override_reason" text,
	"confidence_at_time" double precision,
	"reasoning_snapshot" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "safety_flags" (
	"id" serial PRIMARY KEY NOT NULL,
	"employer_id" integer,
	"flag_type" text NOT NULL,
	"severity" text DEFAULT 'info' NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"affected_agent" text,
	"affected_entity_id" integer,
	"affected_entity_type" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"resolved" boolean DEFAULT false,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drift_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"employer_id" integer,
	"metric_type" text NOT NULL,
	"metric_name" text NOT NULL,
	"current_value" double precision,
	"previous_value" double precision,
	"drift_amount" double precision,
	"drift_direction" text,
	"window_start" timestamp,
	"window_end" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"employer_id" integer,
	"agent_type" text NOT NULL,
	"metric_name" text NOT NULL,
	"metric_value" double precision NOT NULL,
	"unit" text,
	"tags" jsonb DEFAULT '{}'::jsonb,
	"recorded_at" timestamp DEFAULT now() NOT NULL
);
