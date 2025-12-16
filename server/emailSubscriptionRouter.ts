/**
 * tRPC router for email subscriptions (public - no login required)
 */

import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import {
  createEmailSubscriptions,
  confirmEmailSubscription,
  unsubscribeByToken,
  getSubscriptionsByEmail,
  isEmailSubscribed,
} from "./emailSubscriptionDb";
import { sendConfirmationEmail } from "./emailService";
import { PREFECTURES } from "../shared/constants";

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const emailSubscriptionRouter = router({
  /**
   * Subscribe to notifications for selected prefectures
   * Sends confirmation email (double opt-in)
   */
  subscribe: publicProcedure
    .input(
      z.object({
        email: z.string().regex(emailRegex, "有効なメールアドレスを入力してください"),
        prefectures: z.array(z.string()).min(1, "少なくとも1つの都道府県を選択してください"),
      })
    )
    .mutation(async ({ input }) => {
      const { email, prefectures } = input;

      // Validate prefectures
      const validPrefectures = prefectures.filter((p) =>
        (PREFECTURES as readonly string[]).includes(p)
      );
      if (validPrefectures.length === 0) {
        return {
          success: false,
          message: "有効な都道府県を選択してください",
        };
      }

      // Check for existing subscriptions
      const existingSubscriptions = await getSubscriptionsByEmail(email);
      const existingPrefectures = existingSubscriptions
        .filter((s) => s.active)
        .map((s) => s.prefecture);

      // Filter out already subscribed prefectures
      const newPrefectures = validPrefectures.filter(
        (p) => !existingPrefectures.includes(p)
      );

      if (newPrefectures.length === 0) {
        return {
          success: false,
          message: "選択された都道府県はすでに登録済みです",
        };
      }

      // Create subscriptions
      const result = await createEmailSubscriptions(email, newPrefectures);
      if (!result) {
        return {
          success: false,
          message: "登録に失敗しました。しばらくしてからお試しください。",
        };
      }

      // Get base URL from environment or use default
      const baseUrl = process.env.VITE_APP_URL || "https://kumap.manus.space";

      // Send confirmation email
      const emailSent = await sendConfirmationEmail(
        email,
        result.confirmToken,
        newPrefectures,
        baseUrl
      );

      if (!emailSent) {
        return {
          success: false,
          message: "確認メールの送信に失敗しました。メールアドレスを確認してください。",
        };
      }

      return {
        success: true,
        message: "確認メールを送信しました。メールに記載されたリンクをクリックして登録を完了してください。",
        prefectures: newPrefectures,
      };
    }),

  /**
   * Confirm email subscription (called from confirmation link)
   */
  confirm: publicProcedure
    .input(
      z.object({
        token: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await confirmEmailSubscription(input.token);

      if (!result.success) {
        return {
          success: false,
          message: "無効または期限切れのリンクです。再度登録してください。",
        };
      }

      return {
        success: true,
        message: "メールアドレスの確認が完了しました。通知の配信を開始します。",
        email: result.email,
        prefectures: result.prefectures,
      };
    }),

  /**
   * Unsubscribe from notifications (called from unsubscribe link)
   */
  unsubscribe: publicProcedure
    .input(
      z.object({
        token: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await unsubscribeByToken(input.token);

      if (!result.success) {
        return {
          success: false,
          message: "無効なリンクです。",
        };
      }

      return {
        success: true,
        message: `${result.prefecture}の通知を解除しました。`,
        email: result.email,
        prefecture: result.prefecture,
      };
    }),

  /**
   * Check subscription status for an email
   */
  checkStatus: publicProcedure
    .input(
      z.object({
        email: z.string().regex(emailRegex, "有効なメールアドレスを入力してください"),
      })
    )
    .query(async ({ input }) => {
      const subscriptions = await getSubscriptionsByEmail(input.email);

      return {
        subscriptions: subscriptions.filter((s) => s.active),
      };
    }),
});
