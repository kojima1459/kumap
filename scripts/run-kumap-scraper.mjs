#!/usr/bin/env node
/**
 * くまっぷAPIスクレイパー実行スクリプト
 * 
 * 毎日午前3時に自動実行され、くまっぷから全国のクマ目撃情報を取得して
 * データベースにインポートします。
 * 
 * 使用方法:
 *   node scripts/run-kumap-scraper.mjs [--days-back=7] [--prefecture=北海道] [--dry-run]
 */

import { scrapeKumapData } from '../server/kumapScraper.js';

async function main() {
  const args = process.argv.slice(2);
  
  // コマンドライン引数のパース
  let daysBack = 7;
  let prefecture = undefined;
  let dryRun = false;
  
  for (const arg of args) {
    if (arg.startsWith('--days-back=')) {
      daysBack = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--prefecture=')) {
      prefecture = arg.split('=')[1];
    } else if (arg === '--dry-run') {
      dryRun = true;
    }
  }
  
  console.log('='.repeat(60));
  console.log('くまっぷAPIスクレイパー実行');
  console.log('='.repeat(60));
  console.log(`実行日時: ${new Date().toISOString()}`);
  console.log(`対象期間: 過去${daysBack}日間`);
  console.log(`都道府県: ${prefecture || '全国'}`);
  console.log(`ドライラン: ${dryRun ? 'はい' : 'いいえ'}`);
  console.log('='.repeat(60));
  
  try {
    const result = await scrapeKumapData({
      daysBack,
      prefecture,
      dryRun,
    });
    
    console.log('');
    console.log('='.repeat(60));
    console.log('実行結果');
    console.log('='.repeat(60));
    console.log(`取得件数: ${result.total}`);
    console.log(`インポート件数: ${result.imported}`);
    console.log(`重複件数: ${result.duplicates}`);
    console.log(`エラー件数: ${result.errors}`);
    console.log('='.repeat(60));
    
    if (result.errors > 0) {
      console.error('エラーが発生しました。ログを確認してください。');
      process.exit(1);
    }
    
    console.log('スクレイピングが正常に完了しました。');
    process.exit(0);
  } catch (error) {
    console.error('スクレイピング中にエラーが発生しました:', error);
    process.exit(1);
  }
}

main();
