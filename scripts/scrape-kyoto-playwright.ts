/**
 * 京都府クマ出没情報スクレイパー（Playwright版）
 * 
 * 京都府GISシステムからクマ出没情報を取得し、
 * bearSightingsテーブルにインポートする
 * 
 * データソース: https://g-kyoto.gis.pref.kyoto.lg.jp/g-kyoto/
 * 
 * Playwrightを使用してブラウザ自動化でデータを取得
 */

import { chromium, Browser, Page } from "playwright";
import { getDb } from "../server/db";
import { bearSightings, InsertBearSighting } from "../drizzle/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

// 京都府GIS URL
const KYOTO_BASE_URL = "https://g-kyoto.gis.pref.kyoto.lg.jp";
const KYOTO_AGREEMENT_URL = `${KYOTO_BASE_URL}/g-kyoto/top/select.asp?dtp=676`;

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

// ブラウザを起動して利用規約に同意
async function initBrowser(): Promise<{ browser: Browser; page: Page }> {
  console.log("[KyotoScraper] Launching browser...");
  
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1920, height: 1080 },
  });
  
  const page = await context.newPage();
  
  // 利用規約ページに移動
  console.log("[KyotoScraper] Navigating to agreement page...");
  await page.goto(KYOTO_AGREEMENT_URL, { waitUntil: "networkidle", timeout: 60000 });
  
  // 同意ボタンをクリック
  console.log("[KyotoScraper] Clicking agreement button...");
  await page.click('input#Agree');
  
  // ページ遷移を待機
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000); // 追加の待機
  console.log("[KyotoScraper] Agreement accepted, now on position select page");
  
  // 現在のURLを確認
  console.log("[KyotoScraper] Current URL:", page.url());
  
  return { browser, page };
}

// 特定年度のデータを直接URLで取得
async function fetchYearDataDirect(page: Page, layerId: string, yearLabel: string): Promise<KyotoRecord[]> {
  const records: KyotoRecord[] = [];
  
  console.log(`[KyotoScraper] Fetching data for ${yearLabel} (layer ${layerId})...`);
  
  // 直接検索結果ページにアクセス
  const searchUrl = `${KYOTO_BASE_URL}/g-kyoto/ThemeSearch?mid=676&mcl=${layerId},1,1,1&ac=26000`;
  
  try {
    await page.goto(searchUrl, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(5000); // 待機時間を延長
    
    // テーブルが表示されるまで待機（より具体的なセレクタを使用）
    const tableExists = await page.locator('table[role="grid"]#parent-grid_').isVisible({ timeout: 15000 }).catch(() => false);
    
    if (!tableExists) {
      console.log(`[KyotoScraper] ${yearLabel}: Table not found`);
      return records;
    }
    
    // ページネーションを処理
    let pageNum = 1;
    const maxPages = 20; // 最大20ページまで取得
    
    while (pageNum <= maxPages) {
      console.log(`[KyotoScraper] ${yearLabel}: Processing page ${pageNum}...`);
      
      // テーブルからデータを抽出
      const pageRecords = await page.evaluate(() => {
        const rows = document.querySelectorAll('table[role="grid"]#parent-grid_ tr[role="row"]');
        const data: Array<{ date: string; location: string }> = [];
        
        rows.forEach((row) => {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 4) {
            const date = cells[2]?.textContent?.trim() || "";
            const location = cells[3]?.textContent?.trim() || "";
            
            if (date && location && date.match(/\d{4}\/\d{2}\/\d{2}/)) {
              data.push({ date, location });
            }
          }
        });
        
        return data;
      });
      
      // レコードを追加
      for (const record of pageRecords) {
        const cityMatch = record.location.match(/^([^市町村区]+(?:市|町|村|区))/);
        records.push({
          id: `kyoto-${layerId}-${record.date}-${record.location}`,
          date: record.date,
          location: record.location,
          city: cityMatch ? cityMatch[1] : "",
        });
      }
      
      console.log(`[KyotoScraper] ${yearLabel}: Got ${pageRecords.length} records from page ${pageNum}`);
      
      // 次のページがあるか確認
      const nextButton = page.locator('a:has-text("次へ")');
      const hasNextPage = await nextButton.isVisible().catch(() => false);
      
      if (!hasNextPage || pageRecords.length === 0) {
        console.log(`[KyotoScraper] ${yearLabel}: No more pages or empty page`);
        break;
      }
      
      // 次のページに移動（AJAX更新を待機）
      await nextButton.click();
      
      // AJAXリクエストの完了を待つ
      await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {
        console.log(`[KyotoScraper] ${yearLabel}: Network idle timeout`);
      });
      
      // 追加の待機時間（AJAX更新が完了するまで）
      await page.waitForTimeout(3000);
      
      pageNum++;
    }
    
  } catch (error) {
    console.error(`[KyotoScraper] Error fetching ${yearLabel}:`, error);
  }
  
  return records;
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

  console.log(`[KyotoScraper] Starting Playwright scrape...`);
  console.log(`  - Days back: ${daysBack}`);
  console.log(`  - Dry run: ${dryRun}`);
  console.log(`  - Fiscal years: ${fiscalYears.join(", ")}`);

  let browser: Browser | null = null;
  const allRecords: KyotoRecord[] = [];
  
  try {
    // ブラウザを起動
    const { browser: b, page } = await initBrowser();
    browser = b;
    
    // 各年度のデータを取得
    for (const yearKey of fiscalYears) {
      const layerId = LAYER_IDS[yearKey];
      
      if (!layerId) {
        console.warn(`[KyotoScraper] Unknown fiscal year key: ${yearKey}`);
        continue;
      }
      
      // 年度ラベルを生成
      let yearLabel = "";
      if (yearKey === "R7") yearLabel = "令和7年度";
      else if (yearKey === "R6") yearLabel = "令和6年度";
      else if (yearKey === "R5") yearLabel = "令和5年度";
      else if (yearKey === "R4") yearLabel = "令和4年度";
      else if (yearKey === "R3") yearLabel = "令和3年度";
      
      const records = await fetchYearDataDirect(page, layerId, yearLabel);
      allRecords.push(...records);
      
      console.log(`[KyotoScraper] ${yearLabel}: Total ${records.length} records`);
    }
    
  } catch (error) {
    console.error("[KyotoScraper] Browser error:", error);
  } finally {
    if (browser) {
      await browser.close();
      console.log("[KyotoScraper] Browser closed");
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
