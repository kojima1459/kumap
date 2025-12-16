import { TRPCError } from "@trpc/server";
import { protectedProcedure } from "./_core/trpc";
import { ENV } from "./_core/env";

/**
 * Owner-only procedure that checks if the user is the project owner
 * Throws FORBIDDEN error if user is not the owner
 * This prevents abuse and cost overruns from unauthorized scraping
 */
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  // Check if user is the project owner
  if (ctx.user.openId !== ENV.ownerOpenId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Owner access required. Only the project owner can perform this action.",
    });
  }
  return next({ ctx });
});
