import { describe, it, expect, beforeAll } from "vitest";
import { ENV } from "./_core/env";

/**
 * オーナー専用アクセス制御のテスト
 * 
 * このテストは、管理機能がオーナー専用に制限されていることを確認します。
 * - VITE_OWNER_OPEN_ID環境変数が正しく設定されているか
 * - adminProcedureがオーナーのopenIdをチェックしているか
 */

describe("Owner Access Control Tests", () => {
  describe("Environment Variables", () => {
    it("should have OWNER_OPEN_ID environment variable set", () => {
      expect(ENV.ownerOpenId).toBeDefined();
      expect(ENV.ownerOpenId).not.toBe("");
      expect(typeof ENV.ownerOpenId).toBe("string");
    });

    it("should have VITE_OWNER_OPEN_ID environment variable set for frontend", () => {
      const viteOwnerOpenId = process.env.VITE_OWNER_OPEN_ID;
      expect(viteOwnerOpenId).toBeDefined();
      expect(viteOwnerOpenId).not.toBe("");
      expect(typeof viteOwnerOpenId).toBe("string");
    });

    it("VITE_OWNER_OPEN_ID should match OWNER_OPEN_ID", () => {
      const viteOwnerOpenId = process.env.VITE_OWNER_OPEN_ID;
      expect(viteOwnerOpenId).toBe(ENV.ownerOpenId);
    });
  });

  describe("AdminProcedure Implementation", () => {
    it("should import adminProcedure without errors", async () => {
      const { adminProcedure } = await import("./adminProcedure");
      expect(adminProcedure).toBeDefined();
    });

    it("adminProcedure should check against ENV.ownerOpenId", async () => {
      const adminProcedureCode = await import("fs").then(fs => 
        fs.promises.readFile("./server/adminProcedure.ts", "utf-8")
      );
      
      // Check if the code contains the owner check
      expect(adminProcedureCode).toContain("ENV.ownerOpenId");
      expect(adminProcedureCode).toContain("ctx.user.openId");
      expect(adminProcedureCode).toContain("FORBIDDEN");
    });
  });

  describe("ScraperRouter Protection", () => {
    it("scraperRouter should use adminProcedure", async () => {
      const scraperRouterCode = await import("fs").then(fs => 
        fs.promises.readFile("./server/scraperRouter.ts", "utf-8")
      );
      
      // Check if scraperRouter imports and uses adminProcedure
      expect(scraperRouterCode).toContain("adminProcedure");
      expect(scraperRouterCode).toContain("runScraper: adminProcedure");
      expect(scraperRouterCode).not.toContain("publicProcedure");
    });
  });

  describe("Frontend Protection", () => {
    it("MapView should check VITE_OWNER_OPEN_ID before showing admin button", async () => {
      const mapViewCode = await import("fs").then(fs => 
        fs.promises.readFile("./client/src/pages/MapView.tsx", "utf-8")
      );
      
      // Check if MapView uses VITE_OWNER_OPEN_ID to show/hide admin button
      expect(mapViewCode).toContain("VITE_OWNER_OPEN_ID");
      expect(mapViewCode).toContain("user?.openId");
    });

    it("AdminScraper page should check VITE_OWNER_OPEN_ID before allowing access", async () => {
      const adminScraperCode = await import("fs").then(fs => 
        fs.promises.readFile("./client/src/pages/AdminScraper.tsx", "utf-8")
      );
      
      // Check if AdminScraper checks VITE_OWNER_OPEN_ID
      expect(adminScraperCode).toContain("VITE_OWNER_OPEN_ID");
      expect(adminScraperCode).toContain("user.openId");
      expect(adminScraperCode).toContain("アクセスが拒否されました");
    });
  });

  describe("Security Validation", () => {
    it("should not expose OWNER_OPEN_ID in client-side code (except VITE_ prefix)", async () => {
      const mapViewCode = await import("fs").then(fs => 
        fs.promises.readFile("./client/src/pages/MapView.tsx", "utf-8")
      );
      
      // OWNER_OPEN_ID should not be directly used in client code
      expect(mapViewCode).not.toContain("OWNER_OPEN_ID\"");
      expect(mapViewCode).not.toContain("process.env.OWNER_OPEN_ID");
    });

    it("should use VITE_ prefix for frontend environment variables", () => {
      const viteOwnerOpenId = process.env.VITE_OWNER_OPEN_ID;
      expect(viteOwnerOpenId).toBeDefined();
      
      // Verify it's accessible in the frontend build
      expect(typeof viteOwnerOpenId).toBe("string");
      expect(viteOwnerOpenId.length).toBeGreaterThan(0);
    });
  });
});
