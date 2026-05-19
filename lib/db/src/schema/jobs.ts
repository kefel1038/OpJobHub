import { pgTable, serial, text, integer, boolean, timestamp, jsonb, doublePrecision } from "drizzle-orm/pg-core";
import { users } from "./users";
import { companies } from "./companies";
import { jobSources } from "./job-sources";

export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  company: text("company").notNull(),
  companyId: integer("company_id").references(() => companies.id, { onDelete: "set null" }),
  companyLogo: text("company_logo"),
  location: text("location").notNull(),
  salary: text("salary"),
  salaryMin: doublePrecision("salary_min"),
  salaryMax: doublePrecision("salary_max"),
  salaryCurrency: text("salary_currency").default("QAR"),
  description: text("description").notNull(),
  descriptionCleaned: text("description_cleaned"),
  responsibilities: jsonb("responsibilities").$type<string[]>().default([]),
  employmentType: text("employment_type").default("Full-Time"),
  experienceLevel: text("experience_level"),
  industry: text("industry"),
  companySize: text("company_size"),
  companyOverview: text("company_overview"),
  category: text("category"),
  tags: jsonb("tags").$type<string[]>().default([]),
  skills: jsonb("skills").$type<string[]>().default([]),
  requirements: jsonb("requirements").$type<string[]>().default([]),
  benefits: jsonb("benefits").$type<string[]>().default([]),

  visaSponsored: boolean("visa_sponsored").default(false),
  isRemote: boolean("is_remote").default(false),
  isUrgent: boolean("is_urgent").default(false),
  isFeatured: boolean("is_featured").default(false),
  isVerified: boolean("is_verified").default(false),

  nationalityFriendly: jsonb("nationality_friendly").$type<string[]>().default([]),

  source: text("source").notNull().default("manual"),
  sourceId: integer("source_id").references(() => jobSources.id, { onDelete: "set null" }),
  sourceUrl: text("source_url"),
  applyUrl: text("apply_url"),
  applyEmail: text("apply_email"),
  applyWhatsapp: text("apply_whatsapp"),

  postedAt: timestamp("posted_at"),
  expiresAt: timestamp("expires_at"),
  scrapedAt: timestamp("scraped_at").defaultNow(),
  lastSeenAt: timestamp("last_seen_at"),
  archivedAt: timestamp("archived_at"),
  isArchived: boolean("is_archived").default(false),
  freshnessScore: integer("freshness_score"),

  aiSummary: text("ai_summary"),
  aiCategory: text("ai_category"),
  aiMatchScore: doublePrecision("ai_match_score"),
  aiResumeOptimization: jsonb("ai_resume_optimization").$type<string[]>().default([]),

  status: text("status").notNull().default("active"),
  viewCount: integer("view_count").default(0),
  applyCount: integer("apply_count").default(0),
  saveCount: integer("save_count").default(0),
  reportCount: integer("report_count").default(0),

  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
