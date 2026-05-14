CREATE TABLE "behavioral_signals" (
	"id" serial PRIMARY KEY NOT NULL,
	"employer_id" integer NOT NULL,
	"action_type" text NOT NULL,
	"candidate_id" integer,
	"job_id" integer,
	"signal_strength" double precision NOT NULL,
	"action_metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inferred_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"employer_id" integer NOT NULL,
	"preference_key" text NOT NULL,
	"preference_value" text NOT NULL,
	"confidence" double precision DEFAULT 0.5 NOT NULL,
	"source" text DEFAULT 'behavioral_inference' NOT NULL,
	"supporting_signals" integer DEFAULT 0,
	"first_detected_at" timestamp DEFAULT now() NOT NULL,
	"last_reinforced_at" timestamp DEFAULT now() NOT NULL,
	"decay_started_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"signal_details" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "inferred_preferences_employer_id_preference_key_preference_value_unique" UNIQUE("employer_id", "preference_key", "preference_value")
);
--> statement-breakpoint
CREATE TABLE "preference_embeddings" (
	"id" serial PRIMARY KEY NOT NULL,
	"employer_id" integer NOT NULL,
	"preference_key" text NOT NULL,
	"preference_value" text NOT NULL,
	"embedding" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "preference_embeddings_employer_id_preference_key_preference_value_unique" UNIQUE("employer_id", "preference_key", "preference_value")
);
