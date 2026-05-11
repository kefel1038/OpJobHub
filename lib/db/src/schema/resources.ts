import { pgTable, uuid, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const resources = pgTable("resources", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category"),
  url: text("url"),
  thumbnail: text("thumbnail"),
  featured: boolean("featured").default(false),
  status: text("status").default("active"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Resource = typeof resources.$inferSelect;
export type NewResource = typeof resources.$inferInsert;
