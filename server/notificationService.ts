/**
 * Notification service for sending alerts to users
 * Uses Manus built-in notification API
 */

import { notifyOwner } from "./_core/notification";
import { getUsersSubscribedToPrefecture, logNotification } from "./notificationDb";
import { getUserByOpenId } from "./db";
import { ENV } from "./_core/env";

interface BearSighting {
  id: number;
  prefecture: string;
  city?: string;
  sightedAt: Date;
  description?: string;
  sourceType: "official" | "user";
}

/**
 * Send notifications to users subscribed to a prefecture
 * when a new bear sighting is added
 */
export async function notifyUsersOfNewSighting(sighting: BearSighting) {
  try {
    // Get all users subscribed to this prefecture
    const subscriptions = await getUsersSubscribedToPrefecture(sighting.prefecture);

    if (subscriptions.length === 0) {
      console.log(`[Notification] No subscribers for ${sighting.prefecture}`);
      return { sent: 0, failed: 0 };
    }

    console.log(
      `[Notification] Sending to ${subscriptions.length} subscribers for ${sighting.prefecture}`
    );

    let sentCount = 0;
    let failedCount = 0;

    for (const subscription of subscriptions) {
      try {
        // Format notification message
        const title = `🐻 ${sighting.prefecture}でクマ出没情報`;
        const location = sighting.city ? `${sighting.prefecture} ${sighting.city}` : sighting.prefecture;
        const timeStr = formatDate(sighting.sightedAt);
        const sourceLabel = sighting.sourceType === "official" ? "公式情報" : "ユーザー投稿";
        
        const content = `
場所: ${location}
日時: ${timeStr}
情報源: ${sourceLabel}
${sighting.description ? `\n詳細: ${sighting.description}` : ""}

クマ出没情報マップで詳細を確認してください。
        `.trim();

        // Send notification (currently using owner notification as placeholder)
        // In production, this should send email to the user
        const success = await notifyOwner({
          title,
          content,
        });

        if (success) {
          sentCount++;
          await logNotification({
            userId: subscription.userId,
            sightingId: sighting.id,
            status: "sent",
          });
        } else {
          failedCount++;
          await logNotification({
            userId: subscription.userId,
            sightingId: sighting.id,
            status: "failed",
          });
        }
      } catch (error) {
        console.error(`[Notification] Failed to send to user ${subscription.userId}:`, error);
        failedCount++;
        await logNotification({
          userId: subscription.userId,
          sightingId: sighting.id,
          status: "failed",
        });
      }
    }

    console.log(`[Notification] Complete. Sent: ${sentCount}, Failed: ${failedCount}`);
    return { sent: sentCount, failed: failedCount };
  } catch (error) {
    console.error("[Notification] Error in notifyUsersOfNewSighting:", error);
    return { sent: 0, failed: 0 };
  }
}

/**
 * Format date for notification
 */
function formatDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "今日";
  } else if (diffDays === 1) {
    return "昨日";
  } else if (diffDays < 7) {
    return `${diffDays}日前`;
  } else {
    return date.toLocaleDateString("ja-JP");
  }
}
