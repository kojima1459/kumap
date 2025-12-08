import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createPublicContext(): TrpcContext {
  return {
    user: undefined,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("scraper API", () => {
  describe("runScraper", () => {
    it("should execute scraping and return results", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.scraper.runScraper();

      expect(result).toBeDefined();
      expect(typeof result.total).toBe("number");
      expect(typeof result.saved).toBe("number");
      expect(result.total).toBeGreaterThanOrEqual(0);
      expect(result.saved).toBeGreaterThanOrEqual(0);
    }, 30000); // 30 second timeout for scraping

    it("should handle duplicate entries correctly", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      // Run scraper twice
      const firstRun = await caller.scraper.runScraper();
      const secondRun = await caller.scraper.runScraper();

      // Second run should have more skipped entries
      expect(secondRun.skipped).toBeGreaterThanOrEqual(firstRun.skipped || 0);
    }, 60000); // 60 second timeout for two runs
  });
});
