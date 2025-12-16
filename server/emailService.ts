/**
 * Email service for sending notifications to users
 * Uses Gmail MCP for email delivery
 */

import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface EmailMessage {
  to: string;
  subject: string;
  content: string;
}

/**
 * Send an email using Gmail MCP
 * @param message - The email message to send
 * @returns Promise<boolean> - true if sent successfully, false otherwise
 */
export async function sendEmail(message: EmailMessage): Promise<boolean> {
  try {
    const input = JSON.stringify({
      messages: [
        {
          to: [message.to],
          subject: message.subject,
          content: message.content,
        },
      ],
    });

    // Escape the JSON for shell command
    const escapedInput = input.replace(/'/g, "'\\''");

    const command = `manus-mcp-cli tool call gmail_send_messages --server gmail --input '${escapedInput}'`;

    console.log(`[Email] Sending email to ${message.to}`);
    const { stdout, stderr } = await execAsync(command, { timeout: 30000 });

    if (stderr && !stderr.includes("Tool call result")) {
      console.error(`[Email] Error: ${stderr}`);
      return false;
    }

    console.log(`[Email] Successfully sent to ${message.to}`);
    return true;
  } catch (error) {
    console.error(`[Email] Failed to send email:`, error);
    return false;
  }
}

/**
 * Send confirmation email for double opt-in
 */
export async function sendConfirmationEmail(
  email: string,
  confirmToken: string,
  prefectures: string[],
  baseUrl: string
): Promise<boolean> {
  const confirmUrl = `${baseUrl}/email/confirm?token=${confirmToken}`;
  const prefectureList = prefectures.join("、");

  const content = `クマップへのメール通知登録ありがとうございます。

以下のリンクをクリックして、メールアドレスの確認を完了してください。

確認リンク: ${confirmUrl}

登録された都道府県: ${prefectureList}

このリンクは24時間有効です。

※このメールに心当たりがない場合は、無視してください。

---
クマップ - クマ出没情報マップ
https://kumap.manus.space

※このメールは自動送信されています。返信はできません。`;

  return sendEmail({
    to: email,
    subject: "【クマップ】メールアドレスの確認",
    content,
  });
}

/**
 * Send bear sighting notification email with safety warnings
 */
export async function sendSightingNotificationEmail(
  email: string,
  unsubscribeToken: string,
  sighting: {
    prefecture: string;
    city?: string;
    sightedAt: Date;
    description?: string;
    sourceType: "official" | "user";
  },
  baseUrl: string
): Promise<boolean> {
  const unsubscribeUrl = `${baseUrl}/email/unsubscribe?token=${unsubscribeToken}`;
  const emergencyGuideUrl = `${baseUrl}/emergency-guide`;
  const contactsUrl = `${baseUrl}/contacts`;
  const location = sighting.city
    ? `${sighting.prefecture} ${sighting.city}`
    : sighting.prefecture;
  const timeStr = formatDate(sighting.sightedAt);
  const sourceLabel = sighting.sourceType === "official" ? "公式情報" : "ユーザー投稿";

  const content = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ クマ出没情報 ⚠️
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【出没地域】${location}
【日時】${timeStr}
【情報源】${sourceLabel}
${sighting.description ? `【詳細】${sighting.description}` : ""}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 お近くの方へ重要なお願い 🚨
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

■ 不要不急の外出はお控えください
  特に早朝・夕方・夜間は十分にご注意ください。

■ 外出時の注意点
  ・クマよけ鈴やラジオを携帯
  ・複数人で行動し、声を出しながら歩く
  ・懐中電灯を持ち歩く（夜間）

■ ゴミ出しにご注意ください
  ・生ゴミは収集日の朝に出す
  ・食べ物の匂いがするものを外に放置しない

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🐻 クマに遭遇した場合
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ やってはいけないこと
  ・大声を出す
  ・走って逃げる
  ・背を向ける

✅ やるべきこと
  ・落ち着いてその場で止まる
  ・クマに背を向けず、ゆっくり後退
  ・荷物を静かに置いて注意をそらす

📖 詳しい対処法はこちら:
${emergencyGuideUrl}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📞 緊急連絡先
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【緊急時】110番（警察）
【目撃情報の通報】お住まいの市町村役場

📋 地域別連絡先一覧:
${contactsUrl}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🗺️ クマップで最新情報を確認:
https://kumap.manus.space

---
このメールは、${sighting.prefecture}のクマ出没情報を登録されたため送信されています。

配信停止: ${unsubscribeUrl}

※このメールは自動送信されています。返信はできません。

---
クマップ - クマ出没情報マップ
皆様の安全を心よりお祈りしております。`;

  return sendEmail({
    to: email,
    subject: `【クマップ】⚠️ ${sighting.prefecture}でクマ出没 - ご注意ください`,
    content,
  });
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
