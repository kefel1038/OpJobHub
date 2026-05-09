import { pgTable, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";
import { jobs } from "./jobs";

export const savedJobs = pgTable("saved_jobs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  jobId: integer("job_id").references(() => jobs.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type SavedJob = typeof savedJobs.$inferSelect;
export type NewSavedJob = typeof savedJobs.$inferInsert;
