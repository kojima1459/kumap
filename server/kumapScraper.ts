/**
 * くまっぷAPIスクレイパー
 * 
 * くまっぷAPIから全国のクマ目撃情報を取得し、
 * bearSightingsテーブルに変換・インポートする
 */

import { getDb } from "./db";
import { bearSightings, InsertBearSighting } from "../drizzle/schema";
import { kumapClient, KumapPoint } from "./kumapClient";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

// くまっぷのポイントをbearSightingsの形式に変換
function convertKumapPointToSighting(point: KumapPoint): InsertBearSighting {
  // 日時のパース
  const eventDate = new Date(point.event_time);

  // 詳細情報の構築
  let description = point.content || "";
  if (point.additional_data) {
    const additionalInfo: string[] = [];
    if (point.additional_data.count) {
      additionalInfo.push(`頭数: ${point.additional_data.count}`);
    }
    if (point.additional_data.state) {
      const stateMap: Record<string, string> = {
        adult: "成獣",
        cub: "子グマ",
        with_cubs: "子連れ",
      };
      additionalInfo.push(`状態: ${stateMap[point.additional_data.state] || point.additional_data.state}`);
    }
    if (point.additional_data.gender) {
      const genderMap: Record<string, string> = {
        male: "オス",
        female: "メス",
      };
      additionalInfo.push(`性別: ${genderMap[point.additional_data.gender] || point.additional_data.gender}`);
    }
    if (additionalInfo.length > 0) {
      description = description ? `${description} (${additionalInfo.join(", ")})` : additionalInfo.join(", ");
    }
  }

  // 場所の構築
  const locationParts: string[] = [];
  if (point.prefecture) locationParts.push(point.prefecture);
  if (point.city) locationParts.push(point.city);
  if (point.address) locationParts.push(point.address);
  const location = locationParts.join(" ") || "不明";

  // クマの種類を推定（北海道はヒグマ、それ以外はツキノワグマ）
  const bearType = point.prefecture === "北海道" ? "ヒグマ" : "ツキノワグマ";

  return {
    sourceType: "official",
    userId: null,
    prefecture: point.prefecture || "不明",
    city: point.city || null,
    location: location,
    latitude: String(point.location.lat),
    longitude: String(point.location.lng),
    sightedAt: eventDate,
    bearType: bearType,
    description: description || null,
    sourceUrl: `https://kumap-xenon.web.app/map?id=${point.id}`,
    imageUrl: null,
    status: "approved",
  };
}

// バッチ重複チェック（高速化のため一括で既存データを取得）
async function batchCheckDuplicates(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  sightings: InsertBearSighting[]
): Promise<Set<number>> {
  const duplicateIndices = new Set<number>();
  
  if (sightings.length === 0) return duplicateIndices;

  // 日付範囲を取得
  const dates = sightings.map(s => s.sightedAt).filter((d): d is Date => d !== null);
  if (dates.length === 0) return duplicateIndices;
  
  const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
  
  // 日付範囲を1日広げる
  minDate.setDate(minDate.getDate() - 1);
  maxDate.setDate(maxDate.getDate() + 1);

  // 既存データを一括取得
  const existingData = await db.select({
    prefecture: bearSightings.prefecture,
    city: bearSightings.city,
    latitude: bearSightings.latitude,
    longitude: bearSightings.longitude,
    sightedAt: bearSightings.sightedAt,
    sourceUrl: bearSightings.sourceUrl,
  })
  .from(bearSightings)
  .where(
    and(
      gte(bearSightings.sightedAt, minDate),
      lte(bearSightings.sightedAt, maxDate)
    )
  );

  // 既存データをマップに変換（高速検索用）
  const existingByLocation = new Map<string, Set<string>>();
  const existingByCoords = new Map<string, Set<string>>();
  const existingSourceUrls = new Set<string>();

  for (const existing of existingData) {
    // sourceUrlでチェック
    if (existing.sourceUrl) {
      existingSourceUrls.add(existing.sourceUrl);
    }

    // 場所+日付でチェック
    if (existing.prefecture && existing.sightedAt) {
      const dateStr = existing.sightedAt.toISOString().split('T')[0];
      const locationKey = `${existing.prefecture}|${existing.city || ''}`;
      if (!existingByLocation.has(locationKey)) {
        existingByLocation.set(locationKey, new Set());
      }
      existingByLocation.get(locationKey)!.add(dateStr);
    }

    // 座標+日付でチェック
    if (existing.latitude && existing.longitude && existing.sightedAt) {
      const dateStr = existing.sightedAt.toISOString().split('T')[0];
      const lat = parseFloat(existing.latitude);
      const lng = parseFloat(existing.longitude);
      // 小数点3桁で丸める（約100m精度）
      const coordKey = `${lat.toFixed(3)}|${lng.toFixed(3)}`;
      if (!existingByCoords.has(coordKey)) {
        existingByCoords.set(coordKey, new Set());
      }
      existingByCoords.get(coordKey)!.add(dateStr);
    }
  }

  // 各sightingをチェック
  for (let i = 0; i < sightings.length; i++) {
    const sighting = sightings[i];
    
    // sourceUrlでチェック
    if (sighting.sourceUrl && existingSourceUrls.has(sighting.sourceUrl)) {
      duplicateIndices.add(i);
      continue;
    }

    // 場所+日付でチェック
    if (sighting.prefecture && sighting.sightedAt) {
      const dateStr = sighting.sightedAt.toISOString().split('T')[0];
      const locationKey = `${sighting.prefecture}|${sighting.city || ''}`;
      if (existingByLocation.get(locationKey)?.has(dateStr)) {
        console.log(`Duplicate found by location: ${sighting.prefecture} ${sighting.city || ''} on ${dateStr}`);
        duplicateIndices.add(i);
        continue;
      }
    }

    // 座標+日付でチェック
    if (sighting.latitude && sighting.longitude && sighting.sightedAt) {
      const dateStr = sighting.sightedAt.toISOString().split('T')[0];
      const lat = parseFloat(sighting.latitude);
      const lng = parseFloat(sighting.longitude);
      const coordKey = `${lat.toFixed(3)}|${lng.toFixed(3)}`;
      if (existingByCoords.get(coordKey)?.has(dateStr)) {
        console.log(`Duplicate found by coordinates: (${lat}, ${lng}) on ${dateStr}`);
        duplicateIndices.add(i);
        continue;
      }
    }
  }

  return duplicateIndices;
}

// くまっぷからデータを取得してインポート
export async function scrapeKumapData(options: {
  daysBack?: number;
  prefecture?: string;
  dryRun?: boolean;
} = {}): Promise<{
  total: number;
  imported: number;
  duplicates: number;
  errors: number;
}> {
  const { daysBack = 365, prefecture, dryRun = false } = options;

  console.log(`[KumapScraper] Starting scrape...`);
  console.log(`  - Days back: ${daysBack}`);
  console.log(`  - Prefecture filter: ${prefecture || "全国"}`);
  console.log(`  - Dry run: ${dryRun}`);

  // データベース接続を試行
  let db: Awaited<ReturnType<typeof getDb>> = null;
  try {
    db = await getDb();
  } catch (error) {
    console.warn("[KumapScraper] Database connection not available, will save to JSON file");
  }

  // 日付範囲の設定
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  // くまっぷからデータを取得
  let points: KumapPoint[];
  try {
    if (prefecture) {
      points = await kumapClient.fetchPointsByPrefecture(prefecture, {
        event_time_after: startDate.toISOString(),
        event_time_before: endDate.toISOString(),
      });
    } else {
      points = await kumapClient.fetchPointsByDateRange(startDate, endDate);
    }
  } catch (error) {
    console.error("[KumapScraper] Failed to fetch data from Kumap API:", error);
    throw error;
  }

  console.log(`[KumapScraper] Fetched ${points.length} points from Kumap API`);

  // 全ポイントを変換
  const sightings = points.map(convertKumapPointToSighting);

  // データベース接続がない場合はJSONファイルに保存
  if (!db) {
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const timestamp = Date.now();
    const jsonPath = path.join(dataDir, `kumap_bear_sightings_${timestamp}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(sightings, null, 2));
    console.log(`[KumapScraper] Saved ${sightings.length} records to ${jsonPath}`);
    
    return {
      total: points.length,
      imported: sightings.length,
      duplicates: 0,
      errors: 0,
    };
  }

  // バッチ重複チェック
  console.log(`[KumapScraper] Checking for duplicates...`);
  const duplicateIndices = await batchCheckDuplicates(db, sightings);
  
  // 重複を除外
  const newSightings = sightings.filter((_, i) => !duplicateIndices.has(i));
  
  console.log(`[KumapScraper] Found ${duplicateIndices.size} duplicates, ${newSightings.length} new records`);

  // バッチインサート
  let imported = 0;
  let errors = 0;

  if (!dryRun && newSightings.length > 0) {
    // 100件ずつバッチインサート
    const batchSize = 100;
    for (let i = 0; i < newSightings.length; i += batchSize) {
      const batch = newSightings.slice(i, i + batchSize);
      try {
        await db.insert(bearSightings).values(batch);
        imported += batch.length;
        console.log(`[KumapScraper] Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(newSightings.length / batchSize)} (${batch.length} records)`);
      } catch (error) {
        console.error(`[KumapScraper] Error inserting batch:`, error);
        errors += batch.length;
      }
    }
  } else if (dryRun) {
    imported = newSightings.length;
  }

  console.log(`[KumapScraper] Scrape completed:`);
  console.log(`  - Total points: ${points.length}`);
  console.log(`  - Imported: ${imported}`);
  console.log(`  - Duplicates: ${duplicateIndices.size}`);
  console.log(`  - Errors: ${errors}`);

  return {
    total: points.length,
    imported,
    duplicates: duplicateIndices.size,
    errors,
  };
}

// 特定の都道府県のデータを更新
export async function updatePrefectureData(prefecture: string, daysBack: number = 30): Promise<{
  total: number;
  imported: number;
  duplicates: number;
  errors: number;
}> {
  return scrapeKumapData({
    prefecture,
    daysBack,
    dryRun: false,
  });
}

// 全国のデータを更新（毎日実行用）
export async function updateAllPrefecturesData(daysBack: number = 7): Promise<{
  total: number;
  imported: number;
  duplicates: number;
  errors: number;
}> {
  return scrapeKumapData({
    daysBack,
    dryRun: false,
  });
}
