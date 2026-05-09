import { pgTable, serial, text, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { users } from "./users";

export const jobAlerts = pgTable("job_alerts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: text("name"),
  keywords: jsonb("keywords").$type<string[]>().default([]),
  locations: jsonb("locations").$type<string[]>().default([]),
  categories: jsonb("categories").$type<string[]>().default([]),
  salaryMin: integer("salary_min"),
  salaryMax: integer("salary_max"),
  employmentType: jsonb("employment_type").$type<string[]>().default([]),
  visaSponsored: boolean("visa_sponsored"),
  frequency: text("frequency").default("daily"),
  isActive: boolean("is_active").default(true),
  lastSentAt: timestamp("last_sent_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type JobAlert = typeof jobAlerts.$inferSelect;
export type NewJobAlert = typeof jobAlerts.$inferInsert;
