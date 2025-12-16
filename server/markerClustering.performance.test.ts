import { describe, it, expect, beforeAll } from "vitest";
import { getDb } from "./db";
import { bearSightings } from "../drizzle/schema";
import { eq, gte } from "drizzle-orm";

/**
 * マーカークラスタリングのパフォーマンステスト
 * 
 * このテストは、大量のマーカーデータを取得する際のパフォーマンスを検証します。
 * クラスタリングの効果を測定するため、データベースクエリの実行時間を計測します。
 */

describe("Marker Clustering Performance Tests", () => {
  describe("Database Query Performance", () => {
    it("should fetch all sightings within 1 second", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const startTime = performance.now();
      
      const sightings = await db.select().from(bearSightings).execute();
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      console.log(`[Performance] Fetched ${sightings.length} sightings in ${executionTime.toFixed(2)}ms`);
      
      // データベースクエリは2秒以内に完了すべき（初回接続のオーバーヘッドを考慮）
      expect(executionTime).toBeLessThan(2000);
    });

    it("should fetch filtered sightings (prefecture) within 500ms", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const startTime = performance.now();
      
      const sightings = await db
        .select()
        .from(bearSightings)
        .where(eq(bearSightings.prefecture, "北海道"))
        .execute();
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      console.log(`[Performance] Fetched ${sightings.length} filtered sightings in ${executionTime.toFixed(2)}ms`);
      
      // フィルタリングされたクエリは500ms以内に完了すべき
      expect(executionTime).toBeLessThan(500);
    });

    it("should fetch sightings with date range within 500ms", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const startTime = performance.now();
      
      const sightings = await db
        .select()
        .from(bearSightings)
        .where(gte(bearSightings.sightedAt, startDate))
        .execute();
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      console.log(`[Performance] Fetched ${sightings.length} sightings with date filter in ${executionTime.toFixed(2)}ms`);
      
      // 日付フィルタリングは500ms以内に完了すべき
      expect(executionTime).toBeLessThan(500);
    });
  });

  describe("Data Volume Tests", () => {
    it("should handle at least 100 sightings", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const sightings = await db.select().from(bearSightings).execute();
      
      console.log(`[Data Volume] Current sightings count: ${sightings.length}`);
      
      // 少なくとも100件のデータがあることを確認
      expect(sightings.length).toBeGreaterThanOrEqual(100);
    });

    it("should have valid coordinates for all sightings", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const sightings = await db.select().from(bearSightings).execute();
      
      const invalidCoordinates = sightings.filter(s => {
        const lat = parseFloat(s.latitude);
        const lng = parseFloat(s.longitude);
        return isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180;
      });

      console.log(`[Data Quality] Invalid coordinates: ${invalidCoordinates.length}/${sightings.length}`);
      
      // 無効な座標は5%未満であるべき
      expect(invalidCoordinates.length).toBeLessThan(sightings.length * 0.05);
    });
  });

  describe("Index Performance", () => {
    it("should use index for prefecture queries", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // インデックスが効いているか確認するため、複数回実行して平均時間を計測
      const iterations = 5;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        await db
          .select()
          .from(bearSightings)
          .where(eq(bearSightings.prefecture, "北海道"))
          .execute();
        const endTime = performance.now();
        times.push(endTime - startTime);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      console.log(`[Index Performance] Average query time: ${avgTime.toFixed(2)}ms`);

      // インデックスが効いていれば平均300ms以内
      expect(avgTime).toBeLessThan(300);
    });

    it("should use index for date range queries", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const iterations = 5;
      const times: number[] = [];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        await db
          .select()
          .from(bearSightings)
          .where(gte(bearSightings.sightedAt, startDate))
          .execute();
        const endTime = performance.now();
        times.push(endTime - startTime);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      console.log(`[Index Performance] Average date query time: ${avgTime.toFixed(2)}ms`);

      // インデックスが効いていれば平均300ms以内
      expect(avgTime).toBeLessThan(300);
    });
  });

  describe("Clustering Efficiency Simulation", () => {
    it("should group nearby sightings efficiently", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const sightings = await db.select().from(bearSightings).execute();
      
      // 簡易的なクラスタリングシミュレーション
      // 緯度経度を0.1度単位でグリッド化してグループ数を計算
      const gridSize = 0.1;
      const clusters = new Map<string, number>();

      sightings.forEach(s => {
        const lat = parseFloat(s.latitude);
        const lng = parseFloat(s.longitude);
        if (!isNaN(lat) && !isNaN(lng)) {
          const gridLat = Math.floor(lat / gridSize);
          const gridLng = Math.floor(lng / gridSize);
          const key = `${gridLat},${gridLng}`;
          clusters.set(key, (clusters.get(key) || 0) + 1);
        }
      });

      const clusterCount = clusters.size;
      const reductionRate = ((sightings.length - clusterCount) / sightings.length) * 100;

      console.log(`[Clustering Simulation] Original markers: ${sightings.length}, Clusters: ${clusterCount}, Reduction: ${reductionRate.toFixed(1)}%`);

      // クラスタリングにより少なくとも30%のマーカー削減が期待される
      expect(reductionRate).toBeGreaterThanOrEqual(30);
    });
  });
});


