CREATE TABLE "ats_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"resume_id" integer NOT NULL,
	"scores" jsonb NOT NULL,
	"suggestions" jsonb NOT NULL,
	"market_position" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "career_insights" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"insights" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_embeddings" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" integer NOT NULL,
	"embedding" vector(1536),
	CONSTRAINT "job_embeddings_job_id_unique" UNIQUE("job_id")
);
--> statement-breakpoint
CREATE TABLE "resume_embeddings" (
	"id" serial PRIMARY KEY NOT NULL,
	"resume_id" integer NOT NULL,
	"embedding" vector(1536)
);
--> statement-breakpoint
CREATE TABLE "resumes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"file_name" text NOT NULL,
	"file_url" text NOT NULL,
	"raw_text" text,
	"parsed_data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"job_id" integer NOT NULL,
	"status" text DEFAULT 'applied' NOT NULL,
	"notes" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text,
	"logo" text,
	"website" text,
	"industry" text,
	"size" text,
	"description" text,
	"location" text,
	"founded_year" text,
	"is_verified" boolean DEFAULT false,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "companies_name_unique" UNIQUE("name"),
	CONSTRAINT "companies_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"role" text DEFAULT 'jobseeker' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"company" text NOT NULL,
	"company_id" integer,
	"company_logo" text,
	"location" text NOT NULL,
	"salary" text,
	"salary_min" double precision,
	"salary_max" double precision,
	"salary_currency" text DEFAULT 'QAR',
	"description" text NOT NULL,
	"description_cleaned" text,
	"employment_type" text DEFAULT 'Full-Time',
	"experience_level" text,
	"industry" text,
	"category" text,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"skills" jsonb DEFAULT '[]'::jsonb,
	"visa_sponsored" boolean DEFAULT false,
	"is_remote" boolean DEFAULT false,
	"is_urgent" boolean DEFAULT false,
	"is_featured" boolean DEFAULT false,
	"is_verified" boolean DEFAULT false,
	"nationality_friendly" jsonb DEFAULT '[]'::jsonb,
	"source" text DEFAULT 'manual' NOT NULL,
	"source_id" integer,
	"source_url" text,
	"apply_url" text,
	"apply_email" text,
	"apply_whatsapp" text,
	"posted_at" timestamp,
	"expires_at" timestamp,
	"scraped_at" timestamp DEFAULT now(),
	"ai_summary" text,
	"ai_category" text,
	"ai_match_score" double precision,
	"status" text DEFAULT 'active' NOT NULL,
	"view_count" integer DEFAULT 0,
	"apply_count" integer DEFAULT 0,
	"save_count" integer DEFAULT 0,
	"report_count" integer DEFAULT 0,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"full_name" text,
	"headline" text,
	"bio" text,
	"location" text,
	"phone_number" text,
	"avatar_url" text,
	"skills" jsonb DEFAULT '[]'::jsonb,
	"experience" jsonb DEFAULT '[]'::jsonb,
	"education" jsonb DEFAULT '[]'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_sources" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"type" text DEFAULT 'website' NOT NULL,
	"base_url" text,
	"scraper_type" text DEFAULT 'cheerio',
	"is_active" boolean DEFAULT true,
	"scrape_interval" text DEFAULT 'daily',
	"last_scraped_at" timestamp,
	"config" jsonb DEFAULT '{}'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "job_sources_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "saved_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"job_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text,
	"keywords" jsonb DEFAULT '[]'::jsonb,
	"locations" jsonb DEFAULT '[]'::jsonb,
	"categories" jsonb DEFAULT '[]'::jsonb,
	"salary_min" integer,
	"salary_max" integer,
	"employment_type" jsonb DEFAULT '[]'::jsonb,
	"visa_sponsored" boolean,
	"frequency" text DEFAULT 'daily',
	"is_active" boolean DEFAULT true,
	"last_sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scrape_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_id" integer,
	"source_name" text NOT NULL,
	"status" text DEFAULT 'running' NOT NULL,
	"jobs_scraped" integer DEFAULT 0,
	"jobs_new" integer DEFAULT 0,
	"jobs_updated" integer DEFAULT 0,
	"jobs_duplicates" integer DEFAULT 0,
	"jobs_failed" integer DEFAULT 0,
	"errors" jsonb DEFAULT '[]'::jsonb,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"duration" integer,
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
ALTER TABLE "ats_reports" ADD CONSTRAINT "ats_reports_resume_id_resumes_id_fk" FOREIGN KEY ("resume_id") REFERENCES "public"."resumes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "career_insights" ADD CONSTRAINT "career_insights_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_embeddings" ADD CONSTRAINT "job_embeddings_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resume_embeddings" ADD CONSTRAINT "resume_embeddings_resume_id_resumes_id_fk" FOREIGN KEY ("resume_id") REFERENCES "public"."resumes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resumes" ADD CONSTRAINT "resumes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_source_id_job_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."job_sources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_jobs" ADD CONSTRAINT "saved_jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_jobs" ADD CONSTRAINT "saved_jobs_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_alerts" ADD CONSTRAINT "job_alerts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scrape_logs" ADD CONSTRAINT "scrape_logs_source_id_job_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."job_sources"("id") ON DELETE set null ON UPDATE no action;