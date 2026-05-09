import { pgTable, serial, text, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";

export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").unique(),
  logo: text("logo"),
  website: text("website"),
  industry: text("industry"),
  size: text("size"),
  description: text("description"),
  location: text("location"),
  foundedYear: text("founded_year"),
  isVerified: boolean("is_verified").default(false),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;
