import { describe, it, expect, beforeAll } from "vitest";
import { scrapeKumapData } from "./kumapScraper";
import { kumapClient } from "./kumapClient";

describe("KumapScraper", () => {
  beforeAll(() => {
    // APIキーが設定されていることを確認
    expect(process.env.KUMAP_API_KEY).toBeDefined();
    expect(process.env.KUMAP_API_KEY).not.toBe("");
  });

  it("should fetch data from Kumap API in dry run mode", async () => {
    // ドライランモードでデータ取得をテスト（DBには書き込まない）
    const result = await scrapeKumapData({
      daysBack: 7,
      dryRun: true,
    });

    expect(result).toBeDefined();
    expect(result.total).toBeGreaterThanOrEqual(0);
    expect(result.imported).toBeGreaterThanOrEqual(0);
    expect(result.duplicates).toBeGreaterThanOrEqual(0);
    expect(result.errors).toBe(0);
    
    // imported + duplicates = total - errors
    expect(result.imported + result.duplicates).toBe(result.total - result.errors);
  }, 60000);

  it("should filter by prefecture in dry run mode", async () => {
    // 特定の都道府県でフィルターしてテスト
    const result = await scrapeKumapData({
      daysBack: 30,
      prefecture: "富山県",
      dryRun: true,
    });

    expect(result).toBeDefined();
    expect(result.total).toBeGreaterThanOrEqual(0);
    expect(result.errors).toBe(0);
  }, 60000);

  it("should convert Kumap points to correct format", async () => {
    // くまっぷからデータを取得
    const points = await kumapClient.listPoints({ limit: 5 });
    
    if (points.data.length > 0) {
      const point = points.data[0];
      
      // 必須フィールドの確認
      expect(point.id).toBeDefined();
      expect(point.location).toBeDefined();
      expect(point.location.lat).toBeDefined();
      expect(point.location.lng).toBeDefined();
      expect(point.event_time).toBeDefined();
      expect(point.name).toBeDefined();
      
      // 日本の緯度経度範囲内であることを確認
      expect(point.location.lat).toBeGreaterThanOrEqual(20);
      expect(point.location.lat).toBeLessThanOrEqual(50);
      expect(point.location.lng).toBeGreaterThanOrEqual(120);
      expect(point.location.lng).toBeLessThanOrEqual(155);
    }
  }, 30000);
});
