/**
 * 長野県PDF自動スクレイピングのスケジュール設定
 * 毎日午前2時（日本時間）に実行
 */

import { runNaganoPrefectureScraper } from '../server/prefectureScraper';

async function main() {
  console.log('=== Scheduled Nagano Prefecture Scraper Started ===');
  console.log(`Execution time: ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}`);
  
  try {
    await runNaganoPrefectureScraper();
    console.log('=== Scheduled Nagano Prefecture Scraper Completed Successfully ===');
  } catch (error) {
    console.error('=== Scheduled Nagano Prefecture Scraper Failed ===', error);
    process.exit(1);
  }
}

main();
