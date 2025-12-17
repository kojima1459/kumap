/**
 * Notification service for sending alerts to users
 * Uses Gmail MCP for email delivery and Manus notification API for owner alerts
 */

import { notifyOwner } from "./_core/notification";
import { getUsersSubscribedToPrefecture, logNotification } from "./notificationDb";
import { getActiveSubscriptionsForPrefecture } from "./emailSubscriptionDb";
import { sendSightingNotificationEmail } from "./emailService";
import { sendPushNotificationsToPrefecture } from "./pushNotificationService";

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
    // Get base URL for email links
    const baseUrl = process.env.VITE_APP_URL || "https://kumap.manus.space";

    let sentCount = 0;
    let failedCount = 0;

    // 1. Send email notifications to email subscribers (no login required)
    const emailSubscriptions = await getActiveSubscriptionsForPrefecture(sighting.prefecture);
    
    if (emailSubscriptions.length > 0) {
      console.log(
        `[Notification] Sending emails to ${emailSubscriptions.length} email subscribers for ${sighting.prefecture}`
      );

      for (const subscription of emailSubscriptions) {
        try {
          const success = await sendSightingNotificationEmail(
            subscription.email,
            subscription.unsubscribeToken,
            sighting,
            baseUrl
          );

          if (success) {
            sentCount++;
            console.log(`[Notification] Email sent to ${subscription.email}`);
          } else {
            failedCount++;
            console.error(`[Notification] Failed to send email to ${subscription.email}`);
          }
        } catch (error) {
          console.error(`[Notification] Error sending email to ${subscription.email}:`, error);
          failedCount++;
        }
      }
    }

    // 2. Send app notifications to logged-in users (existing functionality)
    const appSubscriptions = await getUsersSubscribedToPrefecture(sighting.prefecture);

    if (appSubscriptions.length > 0) {
      console.log(
        `[Notification] Sending app notifications to ${appSubscriptions.length} app subscribers for ${sighting.prefecture}`
      );

      for (const subscription of appSubscriptions) {
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

クマップで詳細を確認してください。
          `.trim();

          // Send notification to owner (placeholder for app notification)
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
    }

    // 3. Send push notifications to PWA subscribers
    try {
      const location = sighting.city ? `${sighting.prefecture} ${sighting.city}` : sighting.prefecture;
      const timeStr = formatDate(sighting.sightedAt);
      
      const pushResult = await sendPushNotificationsToPrefecture(sighting.prefecture, {
        title: `🐻 ${sighting.prefecture}でクマ出没情報`,
        body: `${location}で${timeStr}にクマが目撃されました。タップして詳細を確認してください。`,
        icon: "/kumap-logo.webp",
        badge: "/icon-192.png",
        url: `/?prefecture=${encodeURIComponent(sighting.prefecture)}`,
        tag: `sighting-${sighting.id}`,
      });

      sentCount += pushResult.sent;
      failedCount += pushResult.failed;

      if (pushResult.sent > 0) {
        console.log(`[Notification] Push notifications sent: ${pushResult.sent}`);
      }
    } catch (error) {
      console.error("[Notification] Error sending push notifications:", error);
    }

    if (emailSubscriptions.length === 0 && appSubscriptions.length === 0) {
      console.log(`[Notification] No subscribers for ${sighting.prefecture}`);
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
