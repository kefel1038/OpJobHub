import { pgTable, serial, text, integer, timestamp, jsonb, vector } from "drizzle-orm/pg-core";
import { users } from "./users";
import { jobs } from "./jobs";

export const resumes = pgTable("resumes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  rawText: text("raw_text"),
  parsedData: jsonb("parsed_data"), // Structured data from AI
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const resumeEmbeddings = pgTable("resume_embeddings", {
  id: serial("id").primaryKey(),
  resumeId: integer("resume_id").references(() => resumes.id, { onDelete: "cascade" }).notNull(),
  embedding: vector("embedding", { dimensions: 1536 }), // OpenAI text-embedding-3-small/ada-002
});

export const jobEmbeddings = pgTable("job_embeddings", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").references(() => jobs.id, { onDelete: "cascade" }).notNull().unique(),
  embedding: vector("embedding", { dimensions: 1536 }),
});

export const atsReports = pgTable("ats_reports", {
  id: serial("id").primaryKey(),
  resumeId: integer("resume_id").references(() => resumes.id, { onDelete: "cascade" }).notNull(),
  scores: jsonb("scores").notNull(), // { ats: 92, keyword: 80, readability: 89, ... }
  suggestions: jsonb("suggestions").notNull(), // { missingKeywords: [], weakAreas: [], ... }
  marketPosition: jsonb("market_position"), // { rank: "Top 25%", demand: "High", ... }
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const careerInsights = pgTable("career_insights", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  insights: jsonb("insights").notNull(), // Missing certifications, skills to learn, etc.
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
