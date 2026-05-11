import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

const MIGRATION_SQL = `CREATE TABLE "ats_reports" (
\t"id" serial PRIMARY KEY NOT NULL,
\t"resume_id" integer NOT NULL,
\t"scores" jsonb NOT NULL,
\t"suggestions" jsonb NOT NULL,
\t"market_position" jsonb,
\t"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "career_insights" (
\t"id" serial PRIMARY KEY NOT NULL,
\t"user_id" integer NOT NULL,
\t"insights" jsonb NOT NULL,
\t"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_embeddings" (
\t"id" serial PRIMARY KEY NOT NULL,
\t"job_id" integer NOT NULL,
\t"embedding" vector(1536),
\tCONSTRAINT "job_embeddings_job_id_unique" UNIQUE("job_id")
);
--> statement-breakpoint
CREATE TABLE "resume_embeddings" (
\t"id" serial PRIMARY KEY NOT NULL,
\t"resume_id" integer NOT NULL,
\t"embedding" vector(1536)
);
--> statement-breakpoint
CREATE TABLE "resumes" (
\t"id" serial PRIMARY KEY NOT NULL,
\t"user_id" integer NOT NULL,
\t"file_name" text NOT NULL,
\t"file_url" text NOT NULL,
\t"raw_text" text,
\t"parsed_data" jsonb,
\t"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "applications" (
\t"id" serial PRIMARY KEY NOT NULL,
\t"user_id" integer NOT NULL,
\t"job_id" integer NOT NULL,
\t"status" text DEFAULT 'applied' NOT NULL,
\t"notes" text,
\t"metadata" jsonb DEFAULT '{}'::jsonb,
\t"created_at" timestamp DEFAULT now() NOT NULL,
\t"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "companies" (
\t"id" serial PRIMARY KEY NOT NULL,
\t"name" text NOT NULL,
\t"slug" text,
\t"logo" text,
\t"website" text,
\t"industry" text,
\t"size" text,
\t"description" text,
\t"location" text,
\t"founded_year" text,
\t"is_verified" boolean DEFAULT false,
\t"metadata" jsonb DEFAULT '{}'::jsonb,
\t"created_at" timestamp DEFAULT now() NOT NULL,
\t"updated_at" timestamp DEFAULT now() NOT NULL,
\tCONSTRAINT "companies_name_unique" UNIQUE("name"),
\tCONSTRAINT "companies_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "users" (
\t"id" serial PRIMARY KEY NOT NULL,
\t"email" text NOT NULL,
\t"password" text NOT NULL,
\t"role" text DEFAULT 'jobseeker' NOT NULL,
\t"created_at" timestamp DEFAULT now() NOT NULL,
\tCONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "jobs" (
\t"id" serial PRIMARY KEY NOT NULL,
\t"title" text NOT NULL,
\t"company" text NOT NULL,
\t"company_id" integer,
\t"company_logo" text,
\t"location" text NOT NULL,
\t"salary" text,
\t"salary_min" double precision,
\t"salary_max" double precision,
\t"salary_currency" text DEFAULT 'QAR',
\t"description" text NOT NULL,
\t"description_cleaned" text,
\t"employment_type" text DEFAULT 'Full-Time',
\t"experience_level" text,
\t"industry" text,
\t"category" text,
\t"tags" jsonb DEFAULT '[]'::jsonb,
\t"skills" jsonb DEFAULT '[]'::jsonb,
\t"visa_sponsored" boolean DEFAULT false,
\t"is_remote" boolean DEFAULT false,
\t"is_urgent" boolean DEFAULT false,
\t"is_featured" boolean DEFAULT false,
\t"is_verified" boolean DEFAULT false,
\t"nationality_friendly" jsonb DEFAULT '[]'::jsonb,
\t"source" text DEFAULT 'manual' NOT NULL,
\t"source_id" integer,
\t"source_url" text,
\t"apply_url" text,
\t"apply_email" text,
\t"apply_whatsapp" text,
\t"posted_at" timestamp,
\t"expires_at" timestamp,
\t"scraped_at" timestamp DEFAULT now(),
\t"ai_summary" text,
\t"ai_category" text,
\t"ai_match_score" double precision,
\t"status" text DEFAULT 'active' NOT NULL,
\t"view_count" integer DEFAULT 0,
\t"apply_count" integer DEFAULT 0,
\t"save_count" integer DEFAULT 0,
\t"report_count" integer DEFAULT 0,
\t"created_by" integer,
\t"created_at" timestamp DEFAULT now() NOT NULL,
\t"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
\t"id" serial PRIMARY KEY NOT NULL,
\t"user_id" integer NOT NULL,
\t"full_name" text,
\t"headline" text,
\t"bio" text,
\t"location" text,
\t"phone_number" text,
\t"avatar_url" text,
\t"skills" jsonb DEFAULT '[]'::jsonb,
\t"experience" jsonb DEFAULT '[]'::jsonb,
\t"education" jsonb DEFAULT '[]'::jsonb,
\t"metadata" jsonb DEFAULT '{}'::jsonb,
\t"created_at" timestamp DEFAULT now() NOT NULL,
\t"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_sources" (
\t"id" serial PRIMARY KEY NOT NULL,
\t"name" text NOT NULL,
\t"display_name" text NOT NULL,
\t"type" text DEFAULT 'website' NOT NULL,
\t"base_url" text,
\t"scraper_type" text DEFAULT 'cheerio',
\t"is_active" boolean DEFAULT true,
\t"scrape_interval" text DEFAULT 'daily',
\t"last_scraped_at" timestamp,
\t"config" jsonb DEFAULT '{}'::jsonb,
\t"metadata" jsonb DEFAULT '{}'::jsonb,
\t"created_at" timestamp DEFAULT now() NOT NULL,
\t"updated_at" timestamp DEFAULT now() NOT NULL,
\tCONSTRAINT "job_sources_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "saved_jobs" (
\t"id" serial PRIMARY KEY NOT NULL,
\t"user_id" integer NOT NULL,
\t"job_id" integer NOT NULL,
\t"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_alerts" (
\t"id" serial PRIMARY KEY NOT NULL,
\t"user_id" integer NOT NULL,
\t"name" text,
\t"keywords" jsonb DEFAULT '[]'::jsonb,
\t"locations" jsonb DEFAULT '[]'::jsonb,
\t"categories" jsonb DEFAULT '[]'::jsonb,
\t"salary_min" integer,
\t"salary_max" integer,
\t"employment_type" jsonb DEFAULT '[]'::jsonb,
\t"visa_sponsored" boolean,
\t"frequency" text DEFAULT 'daily',
\t"is_active" boolean DEFAULT true,
\t"last_sent_at" timestamp,
\t"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scrape_logs" (
\t"id" serial PRIMARY KEY NOT NULL,
\t"source_id" integer,
\t"source_name" text NOT NULL,
\t"status" text DEFAULT 'running' NOT NULL,
\t"jobs_scraped" integer DEFAULT 0,
\t"jobs_new" integer DEFAULT 0,
\t"jobs_updated" integer DEFAULT 0,
\t"jobs_duplicates" integer DEFAULT 0,
\t"jobs_failed" integer DEFAULT 0,
\t"errors" jsonb DEFAULT '[]'::jsonb,
\t"started_at" timestamp DEFAULT now() NOT NULL,
\t"completed_at" timestamp,
\t"duration" integer,
\t"metadata" jsonb DEFAULT '{}'::jsonb
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
ALTER TABLE "scrape_logs" ADD CONSTRAINT "scrape_logs_source_id_job_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."job_sources"("id") ON DELETE set null ON UPDATE no action;`;

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

router.get("/db-check", async (_req, res) => {
  try {
    await db.execute(sql`SELECT 1`);
    res.json({ db: "connected" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const code = err instanceof Error && "code" in err ? (err as any).code : undefined;
    const stack = err instanceof Error ? err.stack : undefined;
    res.json({ db: "error", message: msg, code, stack, name: err instanceof Error ? err.name : typeof err });
  }
});

router.get("/db-debug", async (_req, res) => {
  const results: Record<string, any> = {};
  try {
    const { Pool } = require("pg");
    const url = process.env.DATABASE_URL || "postgresql://postgres.fmcblciptvnagrpsrzcw:Lovr_1990_Lovr@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres";
    results.url_masked = url.replace(/\/\/([^:]+):([^@]+)@/, "//$1:***@");
    results.url_defined = !!process.env.DATABASE_URL;
    const pool = new Pool({ connectionString: url, connectionTimeoutMillis: 5000, ssl: { rejectUnauthorized: false } });
    const client = await pool.connect();
    results.connected = true;
    const r = await client.query("SELECT 1 as val");
    results.query_result = r.rows;
    client.release();
    await pool.end();
  } catch (err) {
    results.error = err instanceof Error ? { message: err.message, code: (err as any).code, stack: err.stack?.split("\n").slice(0, 3).join("\n") } : String(err);
  }
  res.json(results);
});

router.post("/migrate", async (_req, res) => {
  try {
    const statements = MIGRATION_SQL.split("--> statement-breakpoint").map((s) => s.trim()).filter(Boolean);
    for (const statement of statements) {
      await db.execute(sql.raw(statement));
    }
    res.json({ ok: true, message: "Migrations applied" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("already exists")) {
      res.json({ ok: true, message: "Tables already exist" });
    } else {
      res.status(500).json({ ok: false, message: msg });
    }
  }
});

export default router;
