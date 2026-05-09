import { pgTable, serial, text, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { jobSources } from "./job-sources";

export const scrapeLogs = pgTable("scrape_logs", {
  id: serial("id").primaryKey(),
  sourceId: integer("source_id").references(() => jobSources.id, { onDelete: "set null" }),
  sourceName: text("source_name").notNull(),
  status: text("status").notNull().default("running"),
  jobsScraped: integer("jobs_scraped").default(0),
  jobsNew: integer("jobs_new").default(0),
  jobsUpdated: integer("jobs_updated").default(0),
  jobsDuplicates: integer("jobs_duplicates").default(0),
  jobsFailed: integer("jobs_failed").default(0),
  errors: jsonb("errors").$type<string[]>().default([]),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  duration: integer("duration"),
  metadata: jsonb("metadata").default({}),
});

export type ScrapeLog = typeof scrapeLogs.$inferSelect;
export type NewScrapeLog = typeof scrapeLogs.$inferInsert;
