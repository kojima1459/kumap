/**
 * くまっぷAPIスクレイパー実行スクリプト
 * 
 * くまっぷAPIから全国のクマ目撃情報を取得してデータベースに保存
 */

import { scrapeKumapData } from "../server/kumapScraper";

async function main() {
  const args = process.argv.slice(2);
  
  let daysBack = 30;
  let prefecture: string | undefined = undefined;
  let dryRun = false;
  
  for (const arg of args) {
    if (arg.startsWith("--days-back=")) {
      daysBack = parseInt(arg.split("=")[1], 10);
    } else if (arg.startsWith("--prefecture=")) {
      prefecture = arg.split("=")[1];
    } else if (arg === "--dry-run") {
      dryRun = true;
    }
  }
  
  console.log("[KumapRunner] Starting kumap scraper...");
  console.log(`  - Days back: ${daysBack}`);
  console.log(`  - Prefecture: ${prefecture || "全国"}`);
  console.log(`  - Dry run: ${dryRun}`);
  
  try {
    const result = await scrapeKumapData({
      prefecture,
      daysBack,
      dryRun,
    });
    
    console.log("[KumapRunner] Scraping completed successfully");
    console.log(`  - Total: ${result.total}`);
    console.log(`  - Imported: ${result.imported}`);
    console.log(`  - Duplicates: ${result.duplicates}`);
    console.log(`  - Errors: ${result.errors}`);
    
    process.exit(0);
  } catch (error) {
    console.error("[KumapRunner] Scraping failed:", error);
    process.exit(1);
  }
}

main();
