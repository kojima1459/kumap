/**
 * 京都府クマ出没情報スクレイパー
 * 
 * 京都府GISシステムからクマ出没情報を取得し、
 * bearSightingsテーブルにインポートする
 * 
 * データソース: https://g-kyoto.gis.pref.kyoto.lg.jp/g-kyoto/
 * 
 * 注意: 京都府GISは独自システムのため、ThemeSearch APIを使用
 */

import { getDb } from "../server/db";
import { bearSightings, InsertBearSighting } from "../drizzle/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

// 京都府GIS ThemeSearch APIエンドポイント
const KYOTO_BASE_URL = "https://g-kyoto.gis.pref.kyoto.lg.jp";

// 年度ごとのレイヤーID
const LAYER_IDS: Record<string, string> = {
  "R7": "8010",   // 令和7年度
  "R6": "7451",   // 令和6年度
  "R5": "7450",   // 令和5年度
  "R4": "7400",   // 令和4年度
  "R3": "7184",   // 令和3年度
};

interface KyotoRecord {
  id: string;
  date: string;
  location: string;
  city: string;
  description?: string;
  latitude?: number;
  longitude?: number;
}

// 京都府GISからデータを取得（HTMLパース方式）
async function fetchKyotoDataFromHTML(layerId: string, page: number = 1): Promise<{ records: KyotoRecord[], totalPages: number }> {
  const url = `${KYOTO_BASE_URL}/g-kyoto/ThemeSearch?mid=676&mcl=${layerId},1,1,1&ac=26000&page=${page}`;
  
  console.log(`[KyotoScraper] Fetching page ${page} from layer ${layerId}...`);
  
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
  }
  
  const html = await response.text();
  
  // HTMLからデータを抽出
  const records: KyotoRecord[] = [];
  
  // テーブル行からデータを抽出（正規表現で簡易パース）
  const rowRegex = /<tr[^>]*id="jqg\d+"[^>]*>[\s\S]*?<\/tr>/gi;
  const rows = html.match(rowRegex) || [];
  
  for (const row of rows) {
    // 日付を抽出
    const dateMatch = row.match(/(\d{4}\/\d{2}\/\d{2})/);
    // 場所を抽出
    const locationMatch = row.match(/<td[^>]*>([^<]*(?:市|町|村|区)[^<]*)<\/td>/);
    
    if (dateMatch && locationMatch) {
      const location = locationMatch[1].trim();
      const cityMatch = location.match(/^([^市町村区]+(?:市|町|村|区))/);
      
      records.push({
        id: `kyoto-${layerId}-${dateMatch[1]}-${location}`,
        date: dateMatch[1],
        location: location,
        city: cityMatch ? cityMatch[1] : "",
      });
    }
  }
  
  // 総ページ数を抽出
  const totalPagesMatch = html.match(/(\d+)件\(/);
  const totalRecords = totalPagesMatch ? parseInt(totalPagesMatch[1]) : 0;
  const totalPages = Math.ceil(totalRecords / 10);
  
  return { records, totalPages };
}

// 詳細情報を取得（個別レコード）
async function fetchRecordDetails(recordId: string): Promise<Partial<KyotoRecord>> {
  // 詳細ページからの情報取得は実装が複雑なため、基本情報のみを使用
  return {};
}

// 京都府レコードをbearSightingsの形式に変換
function convertKyotoRecordToSighting(record: KyotoRecord): InsertBearSighting | null {
  // 日時のパース
  const dateMatch = record.date.match(/(\d{4})\/(\d{2})\/(\d{2})/);
  if (!dateMatch) {
    console.warn(`Invalid date format: ${record.date}`);
    return null;
  }
  
  const [, year, month, day] = dateMatch;
  const eventDate = new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day)
  );
  
  // 場所の構築
  const location = record.location || record.city || "京都府";
  
  // 市区町村の抽出
  const cityMatch = location.match(/^([^市町村区]+(?:市|町|村|区))/);
  const city = record.city || (cityMatch ? cityMatch[1] : null);
  
  return {
    sourceType: "official",
    userId: null,
    prefecture: "京都府",
    city: city,
    location: location,
    latitude: record.latitude ? String(record.latitude) : null,
    longitude: record.longitude ? String(record.longitude) : null,
    sightedAt: eventDate,
    bearType: "ツキノワグマ",
    description: record.description || null,
    sourceUrl: `https://g-kyoto.gis.pref.kyoto.lg.jp/g-kyoto/Portal?mid=676`,
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
    location: bearSightings.location,
    sightedAt: bearSightings.sightedAt,
  })
  .from(bearSightings)
  .where(
    and(
      eq(bearSightings.prefecture, "京都府"),
      gte(bearSightings.sightedAt, minDate),
      lte(bearSightings.sightedAt, maxDate)
    )
  );

  // 既存データをマップに変換
  const existingByLocationDate = new Map<string, Set<string>>();

  for (const existing of existingData) {
    if (existing.location && existing.sightedAt) {
      const dateStr = existing.sightedAt.toISOString().split('T')[0];
      const locationKey = existing.location.substring(0, 20);
      if (!existingByLocationDate.has(locationKey)) {
        existingByLocationDate.set(locationKey, new Set());
      }
      existingByLocationDate.get(locationKey)!.add(dateStr);
    }
  }

  // 各sightingをチェック
  for (let i = 0; i < sightings.length; i++) {
    const sighting = sightings[i];
    
    // 場所+日付でチェック
    if (sighting.location && sighting.sightedAt) {
      const dateStr = sighting.sightedAt.toISOString().split('T')[0];
      const locationKey = sighting.location.substring(0, 20);
      if (existingByLocationDate.get(locationKey)?.has(dateStr)) {
        duplicateIndices.add(i);
        continue;
      }
    }
  }

  return duplicateIndices;
}

// メイン処理
export async function scrapeKyotoData(options: {
  daysBack?: number;
  dryRun?: boolean;
  fiscalYears?: string[];
} = {}): Promise<{
  total: number;
  imported: number;
  duplicates: number;
  errors: number;
}> {
  const { daysBack = 365, dryRun = false, fiscalYears = ["R7", "R6"] } = options;

  console.log(`[KyotoScraper] Starting scrape...`);
  console.log(`  - Days back: ${daysBack}`);
  console.log(`  - Dry run: ${dryRun}`);
  console.log(`  - Fiscal years: ${fiscalYears.join(", ")}`);

  const allRecords: KyotoRecord[] = [];
  
  // 各年度のデータを取得
  for (const year of fiscalYears) {
    const layerId = LAYER_IDS[year];
    if (!layerId) {
      console.warn(`[KyotoScraper] Unknown fiscal year: ${year}`);
      continue;
    }
    
    try {
      let page = 1;
      let totalPages = 1;
      
      do {
        const result = await fetchKyotoDataFromHTML(layerId, page);
        allRecords.push(...result.records);
        totalPages = result.totalPages;
        
        console.log(`[KyotoScraper] ${year}: Page ${page}/${totalPages}, got ${result.records.length} records`);
        
        page++;
        
        // レート制限を避けるため少し待機
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 最大10ページまで（100件）
        if (page > 10) break;
      } while (page <= totalPages);
      
    } catch (error) {
      console.error(`[KyotoScraper] Error fetching ${year}:`, error);
    }
  }
  
  console.log(`[KyotoScraper] Total records fetched: ${allRecords.length}`);

  // 日付フィルタリング
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);
  
  // レコードを変換
  const sightings: InsertBearSighting[] = [];
  
  for (const record of allRecords) {
    const sighting = convertKyotoRecordToSighting(record);
    if (!sighting) continue;
    
    // 日付フィルタリング
    if (sighting.sightedAt && sighting.sightedAt < cutoffDate) {
      continue;
    }
    
    sightings.push(sighting);
  }
  
  // 重複除去（同じ日付・場所の組み合わせ）
  const uniqueSightings: InsertBearSighting[] = [];
  const seen = new Set<string>();
  
  for (const sighting of sightings) {
    const key = `${sighting.sightedAt?.toISOString().split('T')[0]}-${sighting.location}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueSightings.push(sighting);
    }
  }
  
  console.log(`[KyotoScraper] Unique sightings in range: ${uniqueSightings.length}`);

  // データベース接続を試行
  let db: Awaited<ReturnType<typeof getDb>> = null;
  try {
    db = await getDb();
  } catch (error) {
    console.warn("[KyotoScraper] Database connection not available, will save to JSON file");
  }

  let imported = 0;
  let duplicates = 0;
  let errors = 0;

  if (db && !dryRun) {
    // バッチ重複チェック
    console.log(`[KyotoScraper] Checking for duplicates...`);
    const duplicateIndices = await batchCheckDuplicates(db, uniqueSightings);
    duplicates = duplicateIndices.size;
    
    // 重複を除外
    const newSightings = uniqueSightings.filter((_, i) => !duplicateIndices.has(i));
    console.log(`[KyotoScraper] Found ${duplicates} duplicates, ${newSightings.length} new records`);

    // バッチインサート
    const batchSize = 100;
    for (let i = 0; i < newSightings.length; i += batchSize) {
      const batch = newSightings.slice(i, i + batchSize);
      try {
        await db.insert(bearSightings).values(batch);
        imported += batch.length;
        console.log(`[KyotoScraper] Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(newSightings.length / batchSize)} (${batch.length} records)`);
      } catch (error) {
        console.error(`[KyotoScraper] Error inserting batch:`, error);
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
    const jsonPath = path.join(dataDir, `kyoto_bear_sightings_${timestamp}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(uniqueSightings, null, 2));
    console.log(`[KyotoScraper] Saved ${uniqueSightings.length} records to ${jsonPath}`);
    imported = uniqueSightings.length;
  }

  console.log(`[KyotoScraper] Scrape completed:`);
  console.log(`  - Total records: ${allRecords.length}`);
  console.log(`  - Unique sightings: ${uniqueSightings.length}`);
  console.log(`  - Imported: ${imported}`);
  console.log(`  - Duplicates: ${duplicates}`);
  console.log(`  - Errors: ${errors}`);

  return {
    total: uniqueSightings.length,
    imported,
    duplicates,
    errors,
  };
}

// スタンドアロン実行
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  let daysBack = 365;
  let dryRun = false;
  
  for (const arg of args) {
    if (arg.startsWith("--days-back=")) {
      daysBack = parseInt(arg.split("=")[1], 10);
    } else if (arg === "--dry-run") {
      dryRun = true;
    }
  }
  
  scrapeKyotoData({ daysBack, dryRun })
    .then((result) => {
      console.log("Scraping result:", result);
      process.exit(0);
    })
    .catch((error) => {
      console.error("Scraping failed:", error);
      process.exit(1);
    });
}
