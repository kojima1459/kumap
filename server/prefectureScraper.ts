/**
 * 都道府県別PDF自動スクレイピング
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { getDb } from './db';
import { bearSightings } from '../drizzle/schema';
import { geocodeAddress } from './geocoding';
import { isDuplicate } from './deduplication';

const execAsync = promisify(exec);

interface ParsedSighting {
  date_str: string;
  municipality: string;
  category: string;
  type: string;
  bear_type: string;
  count: string;
  details: string;
}

/**
 * 長野県PDFをダウンロード
 */
async function downloadNaganoPdf(): Promise<string> {
  const pdfDir = path.join(process.cwd(), 'data', 'pdfs');
  await fs.mkdir(pdfDir, { recursive: true });
  
  const pdfPath = path.join(pdfDir, 'nagano_latest.pdf');
  const url = 'https://www.pref.nagano.lg.jp/yasei/documents/kemonootomokugeki.pdf';
  
  console.log(`Downloading Nagano PDF from ${url}...`);
  
  try {
    await execAsync(`wget -O "${pdfPath}" "${url}"`);
    console.log(`Downloaded to ${pdfPath}`);
    return pdfPath;
  } catch (error) {
    console.error(`Failed to download Nagano PDF:`, error);
    throw error;
  }
}

/**
 * 長野県PDFを解析
 */
async function parseNaganoPdf(pdfPath: string): Promise<ParsedSighting[]> {
  const scriptPath = path.join(process.cwd(), 'scripts', 'parse_nagano_pdf.py');
  
  console.log(`Parsing Nagano PDF with ${scriptPath}...`);
  
  try {
    const { stdout } = await execAsync(`python3.11 "${scriptPath}"`);
    const results: ParsedSighting[] = JSON.parse(stdout);
    console.log(`Parsed ${results.length} sightings from Nagano PDF`);
    return results;
  } catch (error) {
    console.error(`Failed to parse Nagano PDF:`, error);
    throw error;
  }
}

/**
 * 長野県データをデータベースにインポート
 */
async function importNaganoData(sightings: ParsedSighting[]): Promise<number> {
  const db = await getDb();
  let imported = 0;
  
  for (const sighting of sightings) {
    try {
      // 日付を解析（YYYY/MM/DD形式）
      const [year, month, day] = sighting.date_str.split('/').map(Number);
      const sightedAt = new Date(year, month - 1, day);
      
      // 住所から緯度経度を取得
      const address = `長野県${sighting.municipality}`;
      const coords = await geocodeAddress(address);
      
      if (!coords) {
        console.warn(`Failed to geocode: ${address}`);
        continue;
      }
      
      // 重複チェック
      const duplicate = await isDuplicate({
        prefecture: '長野県',
        city: sighting.municipality,
        latitude: coords.latitude.toString(),
        longitude: coords.longitude.toString(),
        sightedAt,
        sourceType: 'official',
        sourceUrl: 'https://www.pref.nagano.lg.jp/yasei/documents/kemonootomokugeki.pdf',
      });
      
      if (duplicate) {
        console.log(`Skipped duplicate: ${address} on ${sighting.date_str}`);
        continue;
      }
      
      // データベースに保存（nullチェック）
      if (!db) {
        console.error('Database connection is null');
        continue;
      }
      
      await db.insert(bearSightings).values({
        prefecture: '長野県',
        city: sighting.municipality,
        latitude: coords.latitude.toString(),
        longitude: coords.longitude.toString(),
        sightedAt,
        description: `${sighting.category} / ${sighting.type} / ${sighting.bear_type} / ${sighting.count} / ${sighting.details}`,
        sourceType: 'official',
        sourceUrl: 'https://www.pref.nagano.lg.jp/yasei/documents/kemonootomokugeki.pdf',
        status: 'approved',
      });
      
      imported++;
      console.log(`Imported: ${address} on ${sighting.date_str}`);
    } catch (error) {
      console.error(`Failed to import sighting:`, sighting, error);
    }
  }
  
  return imported;
}

/**
 * 長野県の自動スクレイピングを実行
 */
export async function runNaganoPrefectureScraper(): Promise<void> {
  console.log('=== Starting Nagano Prefecture Scraper ===');
  
  try {
    // 1. PDFをダウンロード
    const pdfPath = await downloadNaganoPdf();
    
    // 2. PDFを解析
    const sightings = await parseNaganoPdf(pdfPath);
    
    // 3. データベースにインポート
    const imported = await importNaganoData(sightings);
    
    console.log(`=== Nagano Prefecture Scraper Completed: ${imported}/${sightings.length} imported ===`);
  } catch (error) {
    console.error('=== Nagano Prefecture Scraper Failed ===', error);
    throw error;
  }
}
