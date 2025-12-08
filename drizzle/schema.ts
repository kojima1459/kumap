import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Bear sighting records table
 * Stores both official (scraped) and user-submitted sightings
 */
export const bearSightings = mysqlTable("bear_sightings", {
  id: int("id").autoincrement().primaryKey(),
  /** Source type: 'official' (scraped from government sites) or 'user' (user submission) */
  sourceType: mysqlEnum("source_type", ["official", "user"]).notNull(),
  /** User ID if source is 'user', null for official data */
  userId: int("user_id"),
  /** Prefecture name (e.g., '北海道', '青森県') */
  prefecture: varchar("prefecture", { length: 64 }).notNull(),
  /** City/town/village name */
  city: varchar("city", { length: 128 }),
  /** Detailed location description */
  location: text("location"),
  /** Latitude for map display */
  latitude: varchar("latitude", { length: 32 }).notNull(),
  /** Longitude for map display */
  longitude: varchar("longitude", { length: 32 }).notNull(),
  /** Sighting date and time */
  sightedAt: timestamp("sighted_at").notNull(),
  /** Bear type: 'ツキノワグマ', 'ヒグマ', '不明' */
  bearType: varchar("bear_type", { length: 64 }),
  /** Detailed description */
  description: text("description"),
  /** Source URL (for official data) */
  sourceUrl: text("source_url"),
  /** Image URL (for user submissions) */
  imageUrl: text("image_url"),
  /** Approval status for user submissions: 'pending', 'approved', 'rejected' */
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("approved").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type BearSighting = typeof bearSightings.$inferSelect;
export type InsertBearSighting = typeof bearSightings.$inferInsert;