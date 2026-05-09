import { pgTable, serial, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { users } from "./users";
import { jobs } from "./jobs";

export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  jobId: integer("job_id").references(() => jobs.id, { onDelete: "cascade" }).notNull(),
  status: text("status").notNull().default("applied"),
  notes: text("notes"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;
