/**
 * Database helpers for notification preferences and logs
 */

import { eq, and } from "drizzle-orm";
import { getDb } from "./db";
import {
  notificationPreferences,
  notificationLogs,
  InsertNotificationPreference,
  InsertNotificationLog,
} from "../drizzle/schema";

/**
 * Get user's notification preferences
 */
export async function getUserNotificationPreferences(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId));
}

/**
 * Add or update notification preference
 */
export async function upsertNotificationPreference(
  userId: number,
  prefecture: string,
  enabled: boolean
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if preference exists
  const existing = await db
    .select()
    .from(notificationPreferences)
    .where(
      and(
        eq(notificationPreferences.userId, userId),
        eq(notificationPreferences.prefecture, prefecture)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    // Update existing
    await db
      .update(notificationPreferences)
      .set({ enabled: enabled ? 1 : 0, updatedAt: new Date() })
      .where(eq(notificationPreferences.id, existing[0].id));
  } else {
    // Insert new
    await db.insert(notificationPreferences).values({
      userId,
      prefecture,
      enabled: enabled ? 1 : 0,
    });
  }
}

/**
 * Delete notification preference
 */
export async function deleteNotificationPreference(userId: number, prefecture: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(notificationPreferences)
    .where(
      and(
        eq(notificationPreferences.userId, userId),
        eq(notificationPreferences.prefecture, prefecture)
      )
    );
}

/**
 * Get all users subscribed to a specific prefecture
 */
export async function getUsersSubscribedToPrefecture(prefecture: string) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(notificationPreferences)
    .where(
      and(
        eq(notificationPreferences.prefecture, prefecture),
        eq(notificationPreferences.enabled, 1)
      )
    );
}

/**
 * Log a sent notification
 */
export async function logNotification(data: InsertNotificationLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(notificationLogs).values(data);
}

/**
 * Get notification logs for a user
 */
export async function getUserNotificationLogs(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(notificationLogs)
    .where(eq(notificationLogs.userId, userId))
    .orderBy(notificationLogs.sentAt)
    .limit(limit);
}
