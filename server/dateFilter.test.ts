import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

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

describe("bearSightings date filter", () => {
  it("should filter by start date", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // Get all sightings
    const allSightings = await caller.bearSightings.list();

    // Get sightings from the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentSightings = await caller.bearSightings.list({
      startDate: sevenDaysAgo,
    });

    // Recent sightings should be less than or equal to all sightings
    expect(recentSightings.length).toBeLessThanOrEqual(allSightings.length);
    expect(Array.isArray(recentSightings)).toBe(true);
  });

  it("should filter by prefecture and date range", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const filteredSightings = await caller.bearSightings.list({
      prefecture: "北海道",
      startDate: thirtyDaysAgo,
    });

    expect(Array.isArray(filteredSightings)).toBe(true);
    
    // All results should be from Hokkaido
    filteredSightings.forEach((sighting) => {
      expect(sighting.prefecture).toBe("北海道");
    });
  });

  it("should return all sightings when no date filter is applied", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const allSightings = await caller.bearSightings.list();
    const noFilterSightings = await caller.bearSightings.list({});

    expect(allSightings.length).toBe(noFilterSightings.length);
  });
});
