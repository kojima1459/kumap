import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "sample-user",
    email: "sample@example.com",
    name: "Sample User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("notification preferences", () => {
  it("should allow user to set notification preference", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.notifications.upsertPreference({
      prefecture: "東京都",
      enabled: true,
    });

    expect(result).toEqual({ success: true });
  });

  it("should retrieve user notification preferences", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Set a preference first
    await caller.notifications.upsertPreference({
      prefecture: "東京都",
      enabled: true,
    });

    // Retrieve preferences
    const preferences = await caller.notifications.getPreferences();

    expect(Array.isArray(preferences)).toBe(true);
    expect(preferences.length).toBeGreaterThan(0);
    
    const tokyoPref = preferences.find((p) => p.prefecture === "東京都");
    expect(tokyoPref).toBeDefined();
    expect(tokyoPref?.enabled).toBe(1);
  });

  it("should allow user to disable notification preference", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Enable first
    await caller.notifications.upsertPreference({
      prefecture: "京都府",
      enabled: true,
    });

    // Then disable
    await caller.notifications.upsertPreference({
      prefecture: "京都府",
      enabled: false,
    });

    // Verify it's disabled
    const preferences = await caller.notifications.getPreferences();
    const kyotoPref = preferences.find((p) => p.prefecture === "京都府");
    expect(kyotoPref?.enabled).toBe(0);
  });

  it("should allow user to delete notification preference", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Set a preference
    await caller.notifications.upsertPreference({
      prefecture: "大阪府",
      enabled: true,
    });

    // Delete it
    const result = await caller.notifications.deletePreference({
      prefecture: "大阪府",
    });

    expect(result).toEqual({ success: true });

    // Verify it's deleted
    const preferences = await caller.notifications.getPreferences();
    const osakaPref = preferences.find((p) => p.prefecture === "大阪府");
    expect(osakaPref).toBeUndefined();
  });
});
