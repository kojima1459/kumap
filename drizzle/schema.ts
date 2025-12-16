import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, index } from "drizzle-orm/mysql-core";

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
 * User notification preferences for bear sightings
 * Users can subscribe to notifications for specific prefectures
 */
export const notificationPreferences = mysqlTable("notification_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  prefecture: varchar("prefecture", { length: 20 }).notNull(),
  enabled: int("enabled").default(1).notNull(), // 1 = enabled, 0 = disabled
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreference = typeof notificationPreferences.$inferInsert;

/**
 * Notification log to track sent notifications
 */
export const notificationLogs = mysqlTable("notification_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  sightingId: int("sighting_id").notNull(),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  status: mysqlEnum("status", ["sent", "failed"]).default("sent").notNull(),
});

export type NotificationLog = typeof notificationLogs.$inferSelect;
export type InsertNotificationLog = typeof notificationLogs.$inferInsert;

// TODO: Add your tables here

/**
 * Bear sightings table
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
}, (table) => ({
  prefectureIdx: index("prefecture_idx").on(table.prefecture),
  sightedAtIdx: index("sighted_at_idx").on(table.sightedAt),
  sourceTypeIdx: index("source_type_idx").on(table.sourceType),
  statusIdx: index("status_idx").on(table.status),
  prefectureSightedAtIdx: index("prefecture_sighted_at_idx").on(table.prefecture, table.sightedAt),
}));

export type BearSighting = typeof bearSightings.$inferSelect;
export type InsertBearSighting = typeof bearSightings.$inferInsert;

/**
 * Email subscriptions for bear sighting notifications
 * Allows anonymous users to subscribe to notifications without logging in
 */
export const emailSubscriptions = mysqlTable("email_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  /** Email address for notifications */
  email: varchar("email", { length: 320 }).notNull(),
  /** Prefecture to receive notifications for */
  prefecture: varchar("prefecture", { length: 20 }).notNull(),
  /** Confirmation token for double opt-in */
  confirmToken: varchar("confirm_token", { length: 64 }).notNull(),
  /** Unsubscribe token for one-click unsubscribe */
  unsubscribeToken: varchar("unsubscribe_token", { length: 64 }).notNull(),
  /** Whether the email has been confirmed (double opt-in) */
  confirmed: int("confirmed").default(0).notNull(), // 0 = unconfirmed, 1 = confirmed
  /** Whether the subscription is active */
  active: int("active").default(1).notNull(), // 1 = active, 0 = unsubscribed
  createdAt: timestamp("created_at").defaultNow().notNull(),
  confirmedAt: timestamp("confirmed_at"),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  emailIdx: index("email_idx").on(table.email),
  prefectureIdx: index("email_prefecture_idx").on(table.prefecture),
  confirmTokenIdx: index("confirm_token_idx").on(table.confirmToken),
  unsubscribeTokenIdx: index("unsubscribe_token_idx").on(table.unsubscribeToken),
}));

export type EmailSubscription = typeof emailSubscriptions.$inferSelect;
export type InsertEmailSubscription = typeof emailSubscriptions.$inferInsert;