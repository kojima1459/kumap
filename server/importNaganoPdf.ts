/**
 * 長野県PDFから抽出したデータをデータベースにインポートするスクリプト
 */
import { getDb } from "./db";
import { bearSightings } from "../drizzle/schema";
import { geocodeAddress } from "./geocoding";
import * as fs from "fs";
import * as path from "path";

interface NaganoPdfSighting {
  prefecture: string;
  source_type: string;
  number: string;
  date_str: string; // "2025/12/4"形式
  municipality: string; // "野沢温泉村"
  area_type: string; // "里地" or "林内"
  sighting_type: string; // "目撃" or "痕跡"
  bear_size: string; // "成獣", "幼獣", "親子", "不明"
  bear_count: string; // "１頭", "２頭", "不明"
  details: string; // 状況詳細
  location: string;
}

/**
 * 日付文字列をDateオブジェクトに変換
 * @param dateStr "2025/12/4"形式の日付文字列
 * @returns Dateオブジェクト
 */
function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split("/").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * クマの種類を判定
 * @param bearSize "成獣", "幼獣", "親子", "不明"
 * @returns "asian_black_bear" or "unknown"
 */
function determineBearType(bearSize: string): string {
  // 長野県はツキノワグマのみ
  return "asian_black_bear";
}

/**
 * 長野県PDFデータをインポート
 * @param jsonFilePath 解析済みJSONファイルのパス
 */
export async function importNaganoPdfData(jsonFilePath: string) {
  console.log(`[importNaganoPdfData] Starting import from: ${jsonFilePath}`);

  // JSONファイルを読み込み
  const jsonData = fs.readFileSync(jsonFilePath, "utf-8");
  const sightings: NaganoPdfSighting[] = JSON.parse(jsonData);

  console.log(`[importNaganoPdfData] Loaded ${sightings.length} sightings from JSON`);

  const db = await getDb();
  
  if (!db) {
    throw new Error("Failed to get database connection");
  }
  
  let successCount = 0;
  let errorCount = 0;

  for (const sighting of sightings) {
    try {
      // 市町村名から緯度経度を取得
      const fullAddress = `長野県${sighting.municipality}`;
      console.log(`[importNaganoPdfData] Geocoding: ${fullAddress}`);

      const geocodeResult = await geocodeAddress(fullAddress);

      if (!geocodeResult) {
        console.error(`[importNaganoPdfData] Geocoding failed for: ${fullAddress}`);
        errorCount++;
        continue;
      }

      // 日付を解析
      const sightedAt = parseDateString(sighting.date_str);

      // データベースに挿入
      await db.insert(bearSightings).values({
        prefecture: sighting.prefecture,
        city: sighting.municipality,
        location: sighting.location,
        latitude: String(geocodeResult.latitude),
        longitude: String(geocodeResult.longitude),
        sightedAt: sightedAt,
        bearType: determineBearType(sighting.bear_size),
        description: `${sighting.sighting_type} - ${sighting.bear_size} ${sighting.bear_count}\n${sighting.details}`,
        sourceType: sighting.source_type as "official" | "user",
        sourceUrl: "https://www.pref.nagano.lg.jp/shinrin/sangyo/ringyo/choju/joho/kuma-map.html",
        status: "approved",
      });

      console.log(`[importNaganoPdfData] Imported: ${sighting.municipality} - ${sighting.date_str}`);
      successCount++;

      // レート制限対策で遅延
      await new Promise((resolve) => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`[importNaganoPdfData] Error importing sighting:`, error);
      errorCount++;
    }
  }

  console.log(`[importNaganoPdfData] Import completed: ${successCount} success, ${errorCount} errors`);
}

// CLIから実行された場合
if (import.meta.url === `file://${process.argv[1]}`) {
  const jsonFilePath = process.argv[2] || "/home/ubuntu/bear_map_app/data/pdfs/nagano_sightings_latest_parsed.json";

  importNaganoPdfData(jsonFilePath)
    .then(() => {
      console.log("[importNaganoPdfData] Done");
      process.exit(0);
    })
    .catch((error) => {
      console.error("[importNaganoPdfData] Fatal error:", error);
      process.exit(1);
    });
}
