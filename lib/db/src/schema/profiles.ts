import { pgTable, serial, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { users } from "./users";

export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  fullName: text("full_name"),
  headline: text("headline"),
  bio: text("bio"),
  location: text("location"),
  phoneNumber: text("phone_number"),
  avatarUrl: text("avatar_url"),
  skills: jsonb("skills").$type<string[]>().default([]),
  experience: jsonb("experience").default([]),
  education: jsonb("education").default([]),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
