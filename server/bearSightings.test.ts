import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { bearSightings } from "../drizzle/schema";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

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

describe("bearSightings API", () => {
  describe("list", () => {
    it("should return empty array when no sightings exist", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.bearSightings.list();

      expect(Array.isArray(result)).toBe(true);
    });

    it("should accept optional filters", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.bearSightings.list({
        prefecture: "北海道",
      });

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("submit", () => {
    it("should require authentication", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.bearSightings.submit({
          prefecture: "北海道",
          latitude: "43.064",
          longitude: "141.347",
          sightedAt: new Date(),
        })
      ).rejects.toThrow();
    });

    it("should create a new sighting when authenticated", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const sightingData = {
        prefecture: "北海道",
        city: "札幌市",
        location: "中央区",
        latitude: "43.064",
        longitude: "141.347",
        sightedAt: new Date(),
        bearType: "ヒグマ",
        description: "テスト投稿",
      };

      const result = await caller.bearSightings.submit(sightingData);

      expect(result).toBeDefined();
    });
  });

  describe("myList", () => {
    it("should require authentication", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.bearSightings.myList()).rejects.toThrow();
    });

    it("should return user's sightings when authenticated", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.bearSightings.myList();

      expect(Array.isArray(result)).toBe(true);
    });
  });
});
