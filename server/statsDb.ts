import { getDb } from "./db";
import { bearSightings } from "../drizzle/schema";
import { sql, desc } from "drizzle-orm";

export interface PrefectureStats {
  prefecture: string;
  count: number;
  percentage: number;
}

export interface MonthlyStats {
  month: string;
  count: number;
}

export interface BearTypeStats {
  bearType: string;
  count: number;
}

/**
 * Get statistics by prefecture
 */
export async function getPrefectureStats(): Promise<PrefectureStats[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get prefecture stats: database not available");
    return [];
  }

  try {
    const results = await db
      .select({
        prefecture: bearSightings.prefecture,
        count: sql<number>`COUNT(*) as count`,
      })
      .from(bearSightings)
      .groupBy(bearSightings.prefecture)
      .orderBy(desc(sql<number>`COUNT(*)`));

    // Calculate total for percentage
    const total = results.reduce((sum, r) => sum + r.count, 0);

    return results.map((r) => ({
      prefecture: r.prefecture || "不明",
      count: r.count,
      percentage: total > 0 ? Math.round((r.count / total) * 100) : 0,
    }));
  } catch (error) {
    console.error("[Database] Failed to get prefecture stats:", error);
    return [];
  }
}

/**
 * Get monthly statistics
 */
export async function getMonthlyStats(): Promise<MonthlyStats[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get monthly stats: database not available");
    return [];
  }

  try {
    const results = await db
      .select({
        month: sql<string>`DATE_FORMAT(sightedAt, '%Y-%m') as month`,
        count: sql<number>`COUNT(*) as count`,
      })
      .from(bearSightings)
      .groupBy(sql`DATE_FORMAT(sightedAt, '%Y-%m')`)
      .orderBy(sql`DATE_FORMAT(sightedAt, '%Y-%m') DESC`);

    return results.map((r) => ({
      month: r.month || "不明",
      count: r.count,
    }));
  } catch (error) {
    console.error("[Database] Failed to get monthly stats:", error);
    return [];
  }
}

/**
 * Get statistics by bear type
 */
export async function getBearTypeStats(): Promise<BearTypeStats[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get bear type stats: database not available");
    return [];
  }

  try {
    const results = await db
      .select({
        bearType: bearSightings.bearType,
        count: sql<number>`COUNT(*) as count`,
      })
      .from(bearSightings)
      .groupBy(bearSightings.bearType)
      .orderBy(desc(sql<number>`COUNT(*)`));

    return results.map((r) => ({
      bearType: r.bearType || "不明",
      count: r.count,
    }));
  } catch (error) {
    console.error("[Database] Failed to get bear type stats:", error);
    return [];
  }
}

/**
 * Get total sightings count
 */
export async function getTotalSightingsCount(): Promise<number> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get total count: database not available");
    return 0;
  }

  try {
    const result = await db
      .select({
        count: sql<number>`COUNT(*) as count`,
      })
      .from(bearSightings);

    return result[0]?.count || 0;
  } catch (error) {
    console.error("[Database] Failed to get total count:", error);
    return 0;
  }
}
