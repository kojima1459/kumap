/**
 * tRPC router for notification preferences
 */

import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import {
  getUserNotificationPreferences,
  upsertNotificationPreference,
  deleteNotificationPreference,
  getUserNotificationLogs,
} from "./notificationDb";

export const notificationRouter = router({
  /**
   * Get user's notification preferences
   */
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    return await getUserNotificationPreferences(ctx.user.id);
  }),

  /**
   * Add or update notification preference
   */
  upsertPreference: protectedProcedure
    .input(
      z.object({
        prefecture: z.string(),
        enabled: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await upsertNotificationPreference(ctx.user.id, input.prefecture, input.enabled);
      return { success: true };
    }),

  /**
   * Delete notification preference
   */
  deletePreference: protectedProcedure
    .input(
      z.object({
        prefecture: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await deleteNotificationPreference(ctx.user.id, input.prefecture);
      return { success: true };
    }),

  /**
   * Get notification logs
   */
  getLogs: protectedProcedure
    .input(
      z.object({
        limit: z.number().optional().default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      return await getUserNotificationLogs(ctx.user.id, input.limit);
    }),
});
