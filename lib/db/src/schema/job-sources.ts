import { pgTable, serial, text, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";

export const jobSources = pgTable("job_sources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
  type: text("type").notNull().default("website"),
  baseUrl: text("base_url"),
  scraperType: text("scraper_type").default("cheerio"),
  isActive: boolean("is_active").default(true),
  scrapeInterval: text("scrape_interval").default("daily"),
  lastScrapedAt: timestamp("last_scraped_at"),
  config: jsonb("config").default({}),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type JobSource = typeof jobSources.$inferSelect;
export type NewJobSource = typeof jobSources.$inferInsert;
