/**
 * Push Notification Router
 * Handles PWA push notification subscriptions
 */

import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import {
  savePushSubscription,
  removePushSubscription,
  getVapidPublicKey,
} from "./pushNotificationService";
import { PREFECTURES } from "@shared/constants";

export const pushNotificationRouter = router({
  /**
   * Get VAPID public key for client-side subscription
   */
  getVapidPublicKey: publicProcedure.query(() => {
    return { publicKey: getVapidPublicKey() };
  }),

  /**
   * Subscribe to push notifications for a prefecture
   */
  subscribe: publicProcedure
    .input(
      z.object({
        subscription: z.object({
          endpoint: z.string().url(),
          keys: z.object({
            p256dh: z.string(),
            auth: z.string(),
          }),
        }),
        prefecture: z.string().refine(
          (val): val is typeof PREFECTURES[number] => PREFECTURES.includes(val as typeof PREFECTURES[number]),
          { message: "Invalid prefecture" }
        ),
        userAgent: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await savePushSubscription(
        input.subscription,
        input.prefecture,
        input.userAgent
      );
      return result;
    }),

  /**
   * Unsubscribe from push notifications
   */
  unsubscribe: publicProcedure
    .input(
      z.object({
        endpoint: z.string().url(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await removePushSubscription(input.endpoint);
      return result;
    }),
});
