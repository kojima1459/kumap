import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { scraperRouter } from "./scraperRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  getBearSightings,
  insertBearSighting,
  getUserSightings,
  getPendingSightings,
  updateSightingStatus,
} from "./db";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  scraper: scraperRouter,
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

  bearSightings: router({
    /**
     * Get all approved bear sightings with optional filters
     */
    list: publicProcedure
      .input(
        z
          .object({
            prefecture: z.string().optional(),
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
          prefecture: z.string(),
          city: z.string().optional(),
          location: z.string().optional(),
          latitude: z.string(),
          longitude: z.string(),
          sightedAt: z.date(),
          bearType: z.string().optional(),
          description: z.string().optional(),
          imageUrl: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return insertBearSighting({
          ...input,
          sourceType: "user",
          userId: ctx.user.id,
          status: "approved", // Auto-approve for now, can change to "pending" later
        });
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
    pending: protectedProcedure.query(async ({ ctx }) => {
      // TODO: Add admin role check
      return getPendingSightings();
    }),

    /**
     * Approve or reject a sighting (admin only)
     */
    updateStatus: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["approved", "rejected"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // TODO: Add admin role check
        return updateSightingStatus(input.id, input.status);
      }),
  }),
});

export type AppRouter = typeof appRouter;
