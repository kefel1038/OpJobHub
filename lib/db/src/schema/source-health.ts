import { pgTable, serial, text, integer, doublePrecision, timestamp, jsonb } from "drizzle-orm/pg-core";
import { jobSources } from "./job-sources";

export const sourceHealth = pgTable("source_health", {
  id: serial("id").primaryKey(),
  sourceId: integer("source_id").references(() => jobSources.id, { onDelete: "cascade" }),
  sourceName: text("source_name").notNull().unique(),

  runsTotal: integer("runs_total").default(0),
  runsSuccessful: integer("runs_successful").default(0),
  runsFailed: integer("runs_failed").default(0),

  lastRunAt: timestamp("last_run_at"),
  lastSuccessAt: timestamp("last_success_at"),
  lastFailureAt: timestamp("last_failure_at"),
  lastError: text("last_error"),
  consecutiveFailures: integer("consecutive_failures").default(0),

  jobsTotal: integer("jobs_total").default(0),
  jobsNewTotal: integer("jobs_new_total").default(0),
  jobsAvgPerRun: doublePrecision("jobs_avg_per_run").default(0),

  status403Count: integer("status_403_count").default(0),
  selectorFailures: integer("selector_failures").default(0),
  navigationFailures: integer("navigation_failures").default(0),
  zeroJobRuns: integer("zero_job_runs").default(0),

  avgDurationMs: doublePrecision("avg_duration_ms").default(0),
  lastDurationMs: integer("last_duration_ms"),

  healthLevel: text("health_level").notNull().default("healthy"),
  healthScore: doublePrecision("health_score").default(100),

  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type SourceHealth = typeof sourceHealth.$inferSelect;
export type NewSourceHealth = typeof sourceHealth.$inferInsert;
