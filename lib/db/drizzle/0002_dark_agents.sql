CREATE TABLE "agent_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_type" text NOT NULL,
	"source" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recruiter_memory" (
	"id" serial PRIMARY KEY NOT NULL,
	"employer_id" integer NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"confidence" double precision DEFAULT 0.8 NOT NULL,
	"source" text DEFAULT 'manual' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "recruiter_memory_employer_id_key_unique" UNIQUE("employer_id", "key")
);
--> statement-breakpoint
CREATE TABLE "hiring_memory" (
	"id" serial PRIMARY KEY NOT NULL,
	"employer_id" integer NOT NULL,
	"candidate_id" integer NOT NULL,
	"job_id" integer NOT NULL,
	"outcome" text NOT NULL,
	"reason" text DEFAULT '' NOT NULL,
	"skills" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"interview_feedback" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
