import { describe, it, expect, beforeAll } from "vitest";
import { KumapClient } from "./kumapClient";

describe("KumapClient", () => {
  let client: KumapClient;

  beforeAll(() => {
    client = new KumapClient();
  });

  it("should have API key configured", () => {
    // APIキーが設定されていることを確認
    expect(process.env.KUMAP_API_KEY).toBeDefined();
    expect(process.env.KUMAP_API_KEY).not.toBe("");
  });

  it("should successfully connect to Kumap API", async () => {
    // API接続テスト
    const isConnected = await client.testConnection();
    expect(isConnected).toBe(true);
  }, 10000);

  it("should fetch points list", async () => {
    // ポイント一覧取得テスト
    const response = await client.listPoints({ limit: 10 });
    
    expect(response).toBeDefined();
    expect(response.data).toBeDefined();
    expect(Array.isArray(response.data)).toBe(true);
    expect(response.limit).toBe(10);
    expect(response.offset).toBe(0);
  }, 10000);

  it("should fetch points with valid structure", async () => {
    // ポイントデータの構造確認
    const response = await client.listPoints({ limit: 5 });
    
    if (response.data.length > 0) {
      const point = response.data[0];
      
      // 必須フィールドの確認
      expect(point.id).toBeDefined();
      expect(point.name).toBeDefined();  // point_kind ではなく name
      expect(point.event_time).toBeDefined();
      expect(point.location).toBeDefined();  // position ではなく location
      expect(point.location.lat).toBeDefined();
      expect(point.location.lng).toBeDefined();
      expect(point.status).toBeDefined();
      
      // ポイント種別の確認
      expect(["witness", "trace", "injury", "damage"]).toContain(point.name);
      
      // ステータスの確認
      expect(["active", "inactive", "draft"]).toContain(point.status);
      
      // 緯度経度の範囲確認
      expect(point.location.lat).toBeGreaterThanOrEqual(-90);
      expect(point.location.lat).toBeLessThanOrEqual(90);
      expect(point.location.lng).toBeGreaterThanOrEqual(-180);
      expect(point.location.lng).toBeLessThanOrEqual(180);
    }
  }, 10000);

  it("should fetch witness points only", async () => {
    // 目撃情報のみ取得テスト
    const response = await client.listPoints({ 
      limit: 10,
      point_kind_ids: ["witness"]
    });
    
    if (response.data.length > 0) {
      response.data.forEach(point => {
        expect(point.name).toBe("witness");  // point_kind ではなく name
      });
    }
  }, 10000);

  it("should handle pagination correctly", async () => {
    // ページネーションテスト
    const page1 = await client.listPoints({ limit: 5, offset: 0 });
    const page2 = await client.listPoints({ limit: 5, offset: 5 });
    
    expect(page1.data.length).toBeLessThanOrEqual(5);
    expect(page2.data.length).toBeLessThanOrEqual(5);
    
    // 同じデータが含まれていないことを確認
    if (page1.data.length > 0 && page2.data.length > 0) {
      const page1Ids = page1.data.map(p => p.id);
      const page2Ids = page2.data.map(p => p.id);
      
      page2Ids.forEach(id => {
        expect(page1Ids).not.toContain(id);
      });
    }
  }, 15000);
});
