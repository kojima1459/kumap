import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { scraperRouter } from "./scraperRouter";
import { notificationRouter } from "./notificationRouter";
import { emailSubscriptionRouter } from "./emailSubscriptionRouter";
import { pushNotificationRouter } from "./pushNotificationRouter";
import { statsRouter } from "./statsRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { adminProcedure } from "./adminProcedure";
import { z } from "zod";
import { PREFECTURES, VALIDATION, BEAR_TYPES } from "@shared/constants";
import {
  getBearSightings,
  insertBearSighting,
  getUserSightings,
  getPendingSightings,
  updateSightingStatus,
} from "./db";
import { notifyUsersOfNewSighting } from "./notificationService";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  scraper: scraperRouter,
  stats: statsRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  notifications: notificationRouter,
  emailSubscription: emailSubscriptionRouter,
  pushNotification: pushNotificationRouter,

  bearSightings: router({
    /**
     * Get all approved bear sightings with optional filters
     */
    list: publicProcedure
      .input(
        z
          .object({
            prefecture: z.string().optional(),
            prefectures: z.array(z.string()).optional(),
            startDate: z.date().optional(),
            endDate: z.date().optional(),
            sourceType: z.enum(["official", "user"]).optional(),
          })
          .optional()
      )
      .query(async ({ input }) => {
        return getBearSightings(input);
      }),

    /**
     * Submit a new bear sighting (requires authentication)
     */
    submit: protectedProcedure
      .input(
        z.object({
          prefecture: z.enum(PREFECTURES as any),
          city: z.string().max(VALIDATION.CITY_MAX_LENGTH).optional(),
          location: z.string().max(VALIDATION.LOCATION_MAX_LENGTH).optional(),
          latitude: z.string().refine(
            (val) => {
              const num = parseFloat(val);
              return !isNaN(num) && num >= VALIDATION.LATITUDE_MIN && num <= VALIDATION.LATITUDE_MAX;
            },
            { message: "Invalid latitude" }
          ),
          longitude: z.string().refine(
            (val) => {
              const num = parseFloat(val);
              return !isNaN(num) && num >= VALIDATION.LONGITUDE_MIN && num <= VALIDATION.LONGITUDE_MAX;
            },
            { message: "Invalid longitude" }
          ),
          sightedAt: z.date(),
          bearType: z.enum(BEAR_TYPES as any).optional(),
          description: z.string().max(VALIDATION.DESCRIPTION_MAX_LENGTH).optional(),
          imageUrl: z.string().url().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const sighting = await insertBearSighting({
          ...input,
          sourceType: "user",
          userId: ctx.user.id,
          status: "approved", // Auto-approve for now, can change to "pending" later
        });

        // Send notifications to subscribed users
        if (sighting) {
          await notifyUsersOfNewSighting({
            id: sighting.id,
            prefecture: sighting.prefecture,
            city: sighting.city || undefined,
            sightedAt: sighting.sightedAt,
            description: sighting.description || undefined,
            sourceType: "user",
          });
        }

        return sighting;
      }),

    /**
     * Get user's own sightings
     */
    myList: protectedProcedure.query(async ({ ctx }) => {
      return getUserSightings(ctx.user.id);
    }),

    /**
     * Get pending sightings for admin approval
     */
    pending: adminProcedure.query(async ({ ctx }) => {
      return getPendingSightings();
    }),

    /**
     * Approve or reject a sighting (admin only)
     */
    updateStatus: adminProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["approved", "rejected", "pending"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return updateSightingStatus(input.id, input.status);
      }),
  }),
});

export type AppRouter = typeof appRouter;
