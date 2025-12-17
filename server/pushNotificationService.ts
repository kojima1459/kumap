/**
 * Push Notification Service
 * Handles Web Push API notifications for PWA
 */

import webpush from "web-push";
import { getDb } from "./db";
import { pushSubscriptions } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

// Configure VAPID keys
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_SUBJECT = "mailto:kumap@example.com";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
}

/**
 * Save a new push subscription
 */
export async function savePushSubscription(
  subscription: PushSubscriptionData,
  prefecture: string,
  userAgent?: string
): Promise<{ success: boolean; id?: number; error?: string }> {
  try {
    const db = await getDb();
    if (!db) {
      return { success: false, error: "Database not available" };
    }

    // Check if subscription already exists (same endpoint)
    const existing = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, subscription.endpoint))
      .limit(1);

    if (existing.length > 0) {
      // Update existing subscription
      await db
        .update(pushSubscriptions)
        .set({
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          prefecture,
          userAgent,
          active: 1,
        })
        .where(eq(pushSubscriptions.id, existing[0].id));
      
      return { success: true, id: existing[0].id };
    }

    // Create new subscription
    const result = await db.insert(pushSubscriptions).values({
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      prefecture,
      userAgent,
      active: 1,
    });

    return { success: true, id: Number(result[0].insertId) };
  } catch (error) {
    console.error("Failed to save push subscription:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Remove a push subscription
 */
export async function removePushSubscription(
  endpoint: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getDb();
    if (!db) {
      return { success: false, error: "Database not available" };
    }

    await db
      .update(pushSubscriptions)
      .set({ active: 0 })
      .where(eq(pushSubscriptions.endpoint, endpoint));
    
    return { success: true };
  } catch (error) {
    console.error("Failed to remove push subscription:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Send push notification to a single subscription
 */
export async function sendPushNotification(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: PushNotificationPayload
): Promise<{ success: boolean; error?: string }> {
  try {
    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    };

    await webpush.sendNotification(
      pushSubscription,
      JSON.stringify(payload)
    );

    return { success: true };
  } catch (error: any) {
    console.error("Failed to send push notification:", error);
    
    // If subscription is no longer valid, mark it as inactive
    if (error.statusCode === 410 || error.statusCode === 404) {
      const db = await getDb();
      if (db) {
        await db
          .update(pushSubscriptions)
          .set({ active: 0 })
          .where(eq(pushSubscriptions.endpoint, subscription.endpoint));
      }
    }
    
    return { success: false, error: String(error) };
  }
}

/**
 * Send push notifications to all subscribers of a prefecture
 */
export async function sendPushNotificationsToPrefecture(
  prefecture: string,
  payload: PushNotificationPayload
): Promise<{ sent: number; failed: number }> {
  try {
    const db = await getDb();
    if (!db) {
      return { sent: 0, failed: 0 };
    }

    // Get all active subscriptions for the prefecture
    const subscriptions = await db
      .select()
      .from(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.prefecture, prefecture),
          eq(pushSubscriptions.active, 1)
        )
      );

    let sent = 0;
    let failed = 0;

    for (const sub of subscriptions) {
      const result = await sendPushNotification(
        {
          endpoint: sub.endpoint,
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
        payload
      );

      if (result.success) {
        sent++;
      } else {
        failed++;
      }
    }

    return { sent, failed };
  } catch (error) {
    console.error("Failed to send push notifications to prefecture:", error);
    return { sent: 0, failed: 0 };
  }
}

/**
 * Get VAPID public key for client-side subscription
 */
export function getVapidPublicKey(): string {
  return VAPID_PUBLIC_KEY;
}
