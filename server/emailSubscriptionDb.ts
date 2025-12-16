/**
 * Database helpers for email subscriptions
 */

import { getDb } from "./db";
import { emailSubscriptions } from "../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";
import crypto from "crypto";

/**
 * Generate a random token
 */
function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Create a new email subscription (unconfirmed)
 */
export async function createEmailSubscription(
  email: string,
  prefecture: string
): Promise<{ confirmToken: string; unsubscribeToken: string } | null> {
  const db = await getDb();
  if (!db) return null;

  const confirmToken = generateToken();
  const unsubscribeToken = generateToken();

  await db.insert(emailSubscriptions).values({
    email,
    prefecture,
    confirmToken,
    unsubscribeToken,
    confirmed: 0,
    active: 1,
  });

  return { confirmToken, unsubscribeToken };
}

/**
 * Create multiple subscriptions for the same email (batch)
 */
export async function createEmailSubscriptions(
  email: string,
  prefectures: string[]
): Promise<{ confirmToken: string } | null> {
  const db = await getDb();
  if (!db) return null;

  // Use the same confirm token for all subscriptions from this email
  const confirmToken = generateToken();

  for (const prefecture of prefectures) {
    const unsubscribeToken = generateToken();
    await db.insert(emailSubscriptions).values({
      email,
      prefecture,
      confirmToken,
      unsubscribeToken,
      confirmed: 0,
      active: 1,
    });
  }

  return { confirmToken };
}

/**
 * Confirm email subscription by token
 */
export async function confirmEmailSubscription(
  confirmToken: string
): Promise<{ success: boolean; email?: string; prefectures?: string[] }> {
  const db = await getDb();
  if (!db) return { success: false };

  // Find all subscriptions with this token
  const subscriptions = await db
    .select()
    .from(emailSubscriptions)
    .where(eq(emailSubscriptions.confirmToken, confirmToken));

  if (subscriptions.length === 0) {
    return { success: false };
  }

  // Check if already confirmed
  if (subscriptions[0].confirmed === 1) {
    return {
      success: true,
      email: subscriptions[0].email,
      prefectures: subscriptions.map((s) => s.prefecture),
    };
  }

  // Update all subscriptions with this token to confirmed
  await db
    .update(emailSubscriptions)
    .set({ confirmed: 1, confirmedAt: new Date() })
    .where(eq(emailSubscriptions.confirmToken, confirmToken));

  return {
    success: true,
    email: subscriptions[0].email,
    prefectures: subscriptions.map((s) => s.prefecture),
  };
}

/**
 * Unsubscribe by token (single prefecture)
 */
export async function unsubscribeByToken(
  unsubscribeToken: string
): Promise<{ success: boolean; email?: string; prefecture?: string }> {
  const db = await getDb();
  if (!db) return { success: false };

  const subscription = await db
    .select()
    .from(emailSubscriptions)
    .where(eq(emailSubscriptions.unsubscribeToken, unsubscribeToken))
    .limit(1);

  if (subscription.length === 0) {
    return { success: false };
  }

  await db
    .update(emailSubscriptions)
    .set({ active: 0 })
    .where(eq(emailSubscriptions.unsubscribeToken, unsubscribeToken));

  return {
    success: true,
    email: subscription[0].email,
    prefecture: subscription[0].prefecture,
  };
}

/**
 * Unsubscribe all prefectures for an email
 */
export async function unsubscribeAllByEmail(email: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db
    .update(emailSubscriptions)
    .set({ active: 0 })
    .where(eq(emailSubscriptions.email, email));

  return true;
}

/**
 * Get all active, confirmed subscriptions for a prefecture
 */
export async function getActiveSubscriptionsForPrefecture(
  prefecture: string
): Promise<Array<{ email: string; unsubscribeToken: string }>> {
  const db = await getDb();
  if (!db) return [];

  const subscriptions = await db
    .select({
      email: emailSubscriptions.email,
      unsubscribeToken: emailSubscriptions.unsubscribeToken,
    })
    .from(emailSubscriptions)
    .where(
      and(
        eq(emailSubscriptions.prefecture, prefecture),
        eq(emailSubscriptions.confirmed, 1),
        eq(emailSubscriptions.active, 1)
      )
    );

  return subscriptions;
}

/**
 * Get all subscriptions for an email
 */
export async function getSubscriptionsByEmail(
  email: string
): Promise<
  Array<{
    prefecture: string;
    confirmed: boolean;
    active: boolean;
  }>
> {
  const db = await getDb();
  if (!db) return [];

  const subscriptions = await db
    .select({
      prefecture: emailSubscriptions.prefecture,
      confirmed: emailSubscriptions.confirmed,
      active: emailSubscriptions.active,
    })
    .from(emailSubscriptions)
    .where(eq(emailSubscriptions.email, email));

  return subscriptions.map((s) => ({
    prefecture: s.prefecture,
    confirmed: s.confirmed === 1,
    active: s.active === 1,
  }));
}

/**
 * Check if email is already subscribed to a prefecture
 */
export async function isEmailSubscribed(
  email: string,
  prefecture: string
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const subscription = await db
    .select()
    .from(emailSubscriptions)
    .where(
      and(
        eq(emailSubscriptions.email, email),
        eq(emailSubscriptions.prefecture, prefecture),
        eq(emailSubscriptions.active, 1)
      )
    )
    .limit(1);

  return subscription.length > 0;
}

/**
 * Delete unconfirmed subscriptions older than 24 hours
 */
export async function cleanupUnconfirmedSubscriptions(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  await db
    .delete(emailSubscriptions)
    .where(
      and(
        eq(emailSubscriptions.confirmed, 0),
        sql`${emailSubscriptions.createdAt} < ${oneDayAgo}`
      )
    );

  return 0; // Drizzle doesn't return affected rows count easily
}
