#!/usr/bin/env node
/**
 * くまっぷデータインポートスクリプト
 * 
 * くまっぷAPIから全国のクマ目撃情報を取得してデータベースにインポートします。
 */

import 'dotenv/config';

// 環境変数の確認
console.log('KUMAP_API_KEY:', process.env.KUMAP_API_KEY ? 'Set' : 'Not set');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');

// 動的インポート
const { scrapeKumapData } = await import('../server/kumapScraper.js');

async function main() {
  console.log('='.repeat(60));
  console.log('くまっぷデータインポート開始');
  console.log('='.repeat(60));
  console.log(`実行日時: ${new Date().toISOString()}`);
  
  try {
    // 過去30日間のデータをインポート
    const result = await scrapeKumapData({
      daysBack: 30,
      dryRun: false,
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
    
    process.exit(0);
  } catch (error) {
    console.error('エラー:', error);
    process.exit(1);
  }
}

main();
