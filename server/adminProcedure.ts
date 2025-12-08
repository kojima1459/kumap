import { TRPCError } from "@trpc/server";
import { protectedProcedure } from "./_core/trpc";

/**
 * Admin-only procedure that checks if the user has admin role
 * Throws FORBIDDEN error if user is not an admin
 */
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }
  return next({ ctx });
});
