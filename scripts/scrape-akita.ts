/**
 * 秋田県クマダスCSVスクレイパー
 * 
 * 秋田県オープンデータカタログサイトから「クマダス」のCSVデータを取得し、
 * bearSightingsテーブルにインポートする
 * 
 * データソース: https://ckan.pref.akita.lg.jp/dataset/050008_shizenhogoka_003
 */

import { getDb } from "../server/db";
import { bearSightings, InsertBearSighting } from "../drizzle/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

const AKITA_CSV_URL = "https://ckan.pref.akita.lg.jp/dataset/f801a10f-f076-47e4-b5a6-0bb5569639e0/resource/326bfe79-3f64-401b-9862-b37a477c7211/download/050008_kumadas.csv";

interface AkitaRecord {
  出没情報ID: string;
  情報種別: string;
  市町村: string;
  地番情報: string;
  目撃日時: string;
  獣種: string;
  性別: string;
  単独か親子: string;
  頭数: string;
  目撃時の状況: string;
  "x(緯度)": string;
  "y(経度)": string;
}

// CSVをパース
function parseCSV(csvText: string): AkitaRecord[] {
  // BOMを除去し、CRLFをLFに統一
  const cleanText = csvText.replace(/^\ufeff/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = cleanText.trim().split("\n");
  const headers = lines[0].split(",");
  
  console.log(`[AkitaScraper] CSV headers: ${headers.join(", ")}`);
  
  const records: AkitaRecord[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    
    // フィールド数が合わない場合はスキップ（ただしログは出さない）
    if (values.length < 12) continue;
    
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = values[index] || "";
    });
    records.push(record as unknown as AkitaRecord);
  }
  
  return records;
}

// CSVの1行をパース（カンマ区切り、ダブルクォート対応）
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  
  return values;
}

// 秋田県レコードをbearSightingsの形式に変換
function convertAkitaRecordToSighting(record: AkitaRecord): InsertBearSighting | null {
  // ツキノワグマのみを対象とする
  if (record.獣種 !== "ツキノワグマ") {
    return null;
  }
  
  // 日時のパース（YYYY/MM/DD HH:mm形式）
  const dateMatch = record.目撃日時.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})\s*(\d{1,2})?:?(\d{1,2})?/);
  if (!dateMatch) {
    console.warn(`Invalid date format: ${record.目撃日時}`);
    return null;
  }
  
  const [, year, month, day, hour = "0", minute = "0"] = dateMatch;
  const eventDate = new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    parseInt(hour),
    parseInt(minute)
  );
  
  // 緯度経度の確認
  const latitude = record["x(緯度)"];
  const longitude = record["y(経度)"];
  if (!latitude || !longitude || latitude === "0" || longitude === "0") {
    console.warn(`Invalid coordinates for record ${record.出没情報ID}`);
    return null;
  }
  
  // 詳細情報の構築
  let description = record.目撃時の状況 || "";
  const additionalInfo: string[] = [];
  
  if (record.情報種別) {
    additionalInfo.push(`種別: ${record.情報種別}`);
  }
  if (record.単独か親子 && record.単独か親子 !== "単独") {
    additionalInfo.push(`状態: ${record.単独か親子}`);
  }
  if (record.頭数 && record.頭数 !== "1") {
    additionalInfo.push(`頭数: ${record.頭数}`);
  }
  if (record.性別 && record.性別 !== "不明") {
    additionalInfo.push(`性別: ${record.性別}`);
  }
  
  if (additionalInfo.length > 0) {
    description = description
      ? `${description} (${additionalInfo.join(", ")})`
      : additionalInfo.join(", ");
  }
  
  return {
    sourceType: "official",
    userId: null,
    prefecture: "秋田県",
    city: record.市町村 || null,
    location: record.地番情報 || record.市町村 || "秋田県",
    latitude: latitude,
    longitude: longitude,
    sightedAt: eventDate,
    bearType: "ツキノワグマ",
    description: description || null,
    sourceUrl: `https://kumadas.net/?id=${record.出没情報ID}`,
    imageUrl: null,
    status: "approved",
  };
}

// バッチ重複チェック
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
    latitude: bearSightings.latitude,
    longitude: bearSightings.longitude,
    sightedAt: bearSightings.sightedAt,
    sourceUrl: bearSightings.sourceUrl,
  })
  .from(bearSightings)
  .where(
    and(
      eq(bearSightings.prefecture, "秋田県"),
      gte(bearSightings.sightedAt, minDate),
      lte(bearSightings.sightedAt, maxDate)
    )
  );

  // 既存データをマップに変換
  const existingSourceUrls = new Set<string>();
  const existingByCoords = new Map<string, Set<string>>();

  for (const existing of existingData) {
    if (existing.sourceUrl) {
      existingSourceUrls.add(existing.sourceUrl);
    }

    if (existing.latitude && existing.longitude && existing.sightedAt) {
      const dateStr = existing.sightedAt.toISOString().split('T')[0];
      const lat = parseFloat(existing.latitude);
      const lng = parseFloat(existing.longitude);
      const coordKey = `${lat.toFixed(4)}|${lng.toFixed(4)}`;
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

    // 座標+日付でチェック
    if (sighting.latitude && sighting.longitude && sighting.sightedAt) {
      const dateStr = sighting.sightedAt.toISOString().split('T')[0];
      const lat = parseFloat(sighting.latitude);
      const lng = parseFloat(sighting.longitude);
      const coordKey = `${lat.toFixed(4)}|${lng.toFixed(4)}`;
      if (existingByCoords.get(coordKey)?.has(dateStr)) {
        duplicateIndices.add(i);
        continue;
      }
    }
  }

  return duplicateIndices;
}

// メイン処理
export async function scrapeAkitaData(options: {
  daysBack?: number;
  dryRun?: boolean;
} = {}): Promise<{
  total: number;
  imported: number;
  duplicates: number;
  errors: number;
  skipped: number;
}> {
  const { daysBack = 365, dryRun = false } = options;

  console.log(`[AkitaScraper] Starting scrape...`);
  console.log(`  - Days back: ${daysBack}`);
  console.log(`  - Dry run: ${dryRun}`);

  // CSVデータを取得
  console.log(`[AkitaScraper] Fetching CSV from ${AKITA_CSV_URL}...`);
  const response = await fetch(AKITA_CSV_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
  }
  const csvText = await response.text();
  
  // CSVをパース
  const records = parseCSV(csvText);
  console.log(`[AkitaScraper] Parsed ${records.length} records from CSV`);

  // 日付フィルタリング
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);
  
  // レコードを変換
  const sightings: InsertBearSighting[] = [];
  let skipped = 0;
  
  for (const record of records) {
    const sighting = convertAkitaRecordToSighting(record);
    if (!sighting) {
      skipped++;
      continue;
    }
    
    // 日付フィルタリング
    if (sighting.sightedAt && sighting.sightedAt < cutoffDate) {
      continue;
    }
    
    sightings.push(sighting);
  }
  
  console.log(`[AkitaScraper] Converted ${sightings.length} bear sightings (skipped ${skipped} non-bear records)`);

  // データベース接続を試行
  let db: Awaited<ReturnType<typeof getDb>> = null;
  try {
    db = await getDb();
  } catch (error) {
    console.warn("[AkitaScraper] Database connection not available, will save to JSON file");
  }

  let imported = 0;
  let duplicates = 0;
  let errors = 0;

  if (db && !dryRun) {
    // バッチ重複チェック
    console.log(`[AkitaScraper] Checking for duplicates...`);
    const duplicateIndices = await batchCheckDuplicates(db, sightings);
    duplicates = duplicateIndices.size;
    
    // 重複を除外
    const newSightings = sightings.filter((_, i) => !duplicateIndices.has(i));
    console.log(`[AkitaScraper] Found ${duplicates} duplicates, ${newSightings.length} new records`);

    // バッチインサート
    const batchSize = 100;
    for (let i = 0; i < newSightings.length; i += batchSize) {
      const batch = newSightings.slice(i, i + batchSize);
      try {
        await db.insert(bearSightings).values(batch);
        imported += batch.length;
        console.log(`[AkitaScraper] Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(newSightings.length / batchSize)} (${batch.length} records)`);
      } catch (error) {
        console.error(`[AkitaScraper] Error inserting batch:`, error);
        errors += batch.length;
      }
    }
  } else {
    // JSONファイルに保存
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const timestamp = Date.now();
    const jsonPath = path.join(dataDir, `akita_bear_sightings_${timestamp}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(sightings, null, 2));
    console.log(`[AkitaScraper] Saved ${sightings.length} records to ${jsonPath}`);
    imported = sightings.length;
  }

  console.log(`[AkitaScraper] Scrape completed:`);
  console.log(`  - Total CSV records: ${records.length}`);
  console.log(`  - Bear sightings: ${sightings.length}`);
  console.log(`  - Imported: ${imported}`);
  console.log(`  - Duplicates: ${duplicates}`);
  console.log(`  - Errors: ${errors}`);
  console.log(`  - Skipped (non-bear): ${skipped}`);

  return {
    total: sightings.length,
    imported,
    duplicates,
    errors,
    skipped,
  };
}

// スタンドアロン実行
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  let daysBack = 30;
  let dryRun = false;
  
  for (const arg of args) {
    if (arg.startsWith("--days-back=")) {
      daysBack = parseInt(arg.split("=")[1], 10);
    } else if (arg === "--dry-run") {
      dryRun = true;
    }
  }
  
  scrapeAkitaData({ daysBack, dryRun })
    .then((result) => {
      console.log("Scraping result:", result);
      process.exit(0);
    })
    .catch((error) => {
      console.error("Scraping failed:", error);
      process.exit(1);
    });
}
