/**
 * 重複データ排除ロジック
 * 
 * 重複判定基準:
 * 1. 同じ都道府県 + 同じ市町村 + 同じ日付（時刻は無視）
 * 2. 緯度経度が非常に近い（0.01度以内 = 約1km以内）+ 同じ日付
 */

import { getDb } from './db';
import { bearSightings } from '../drizzle/schema';
import { and, eq, sql } from 'drizzle-orm';

interface SightingData {
  prefecture: string;
  city?: string | null;
  latitude: string;
  longitude: string;
  sightedAt: Date;
  sourceType: 'official' | 'user';
  sourceUrl?: string | null;
}

/**
 * 既存データとの重複をチェック
 * @param data 新しい目撃情報
 * @returns 重複している場合はtrue
 */
export async function isDuplicate(data: SightingData): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    console.error('Database connection is null');
    return false;
  }

  // 日付を日単位で比較するため、時刻を00:00:00にリセット
  const sightedDate = new Date(data.sightedAt);
  sightedDate.setHours(0, 0, 0, 0);
  const nextDate = new Date(sightedDate);
  nextDate.setDate(nextDate.getDate() + 1);

  // 方法1: 都道府県 + 市町村 + 日付で重複チェック
  if (data.city) {
    const existingByLocation = await db
      .select()
      .from(bearSightings)
      .where(
        and(
          eq(bearSightings.prefecture, data.prefecture),
          eq(bearSightings.city, data.city),
          sql`DATE(${bearSightings.sightedAt}) = DATE(${sightedDate})`
        )
      )
      .limit(1);

    if (existingByLocation.length > 0) {
      console.log(`Duplicate found by location: ${data.prefecture} ${data.city} on ${sightedDate.toISOString().split('T')[0]}`);
      return true;
    }
  }

  // 方法2: 緯度経度が近い（0.01度以内 = 約1km）+ 同じ日付で重複チェック
  const lat = parseFloat(data.latitude);
  const lng = parseFloat(data.longitude);
  const latRange = 0.01; // 約1km
  const lngRange = 0.01;

  const existingByCoords = await db
    .select()
    .from(bearSightings)
    .where(
      and(
        sql`ABS(CAST(${bearSightings.latitude} AS DECIMAL(10,7)) - ${lat}) < ${latRange}`,
        sql`ABS(CAST(${bearSightings.longitude} AS DECIMAL(10,7)) - ${lng}) < ${lngRange}`,
        sql`DATE(${bearSightings.sightedAt}) = DATE(${sightedDate})`
      )
    )
    .limit(1);

  if (existingByCoords.length > 0) {
    console.log(`Duplicate found by coordinates: (${lat}, ${lng}) on ${sightedDate.toISOString().split('T')[0]}`);
    return true;
  }

  // 方法3: sourceUrlが同じ場合は重複とみなす（公式データの場合）
  if (data.sourceType === 'official' && data.sourceUrl) {
    const existingBySource = await db
      .select()
      .from(bearSightings)
      .where(eq(bearSightings.sourceUrl, data.sourceUrl))
      .limit(1);

    if (existingBySource.length > 0) {
      console.log(`Duplicate found by sourceUrl: ${data.sourceUrl}`);
      return true;
    }
  }

  return false;
}

/**
 * データベース内の既存の重複データを検出
 * @returns 重複データのペアのリスト
 */
export async function findExistingDuplicates(): Promise<Array<{ id1: number; id2: number; reason: string }>> {
  const db = await getDb();
  if (!db) {
    console.error('Database connection is null');
    return [];
  }

  const duplicates: Array<{ id1: number; id2: number; reason: string }> = [];

  // すべてのデータを取得
  const allSightings = await db.select().from(bearSightings);

  // 2重ループで重複をチェック（効率は悪いが、データ量が少ないため許容）
  for (let i = 0; i < allSightings.length; i++) {
    for (let j = i + 1; j < allSightings.length; j++) {
      const s1 = allSightings[i];
      const s2 = allSightings[j];

      // 日付を日単位で比較
      const date1 = new Date(s1.sightedAt);
      date1.setHours(0, 0, 0, 0);
      const date2 = new Date(s2.sightedAt);
      date2.setHours(0, 0, 0, 0);

      if (date1.getTime() !== date2.getTime()) {
        continue; // 日付が異なる場合はスキップ
      }

      // 都道府県 + 市町村が同じ
      if (s1.prefecture === s2.prefecture && s1.city && s2.city && s1.city === s2.city) {
        duplicates.push({
          id1: s1.id,
          id2: s2.id,
          reason: `Same location: ${s1.prefecture} ${s1.city}`,
        });
        continue;
      }

      // 緯度経度が近い（0.01度以内）
      const lat1 = parseFloat(s1.latitude);
      const lng1 = parseFloat(s1.longitude);
      const lat2 = parseFloat(s2.latitude);
      const lng2 = parseFloat(s2.longitude);

      if (Math.abs(lat1 - lat2) < 0.01 && Math.abs(lng1 - lng2) < 0.01) {
        duplicates.push({
          id1: s1.id,
          id2: s2.id,
          reason: `Close coordinates: (${lat1}, ${lng1}) vs (${lat2}, ${lng2})`,
        });
        continue;
      }

      // sourceUrlが同じ
      if (s1.sourceUrl && s2.sourceUrl && s1.sourceUrl === s2.sourceUrl) {
        duplicates.push({
          id1: s1.id,
          id2: s2.id,
          reason: `Same sourceUrl: ${s1.sourceUrl}`,
        });
      }
    }
  }

  return duplicates;
}

/**
 * 重複データを削除（古い方を残す）
 * @param duplicates 重複データのペアのリスト
 * @returns 削除した件数
 */
export async function removeDuplicates(duplicates: Array<{ id1: number; id2: number; reason: string }>): Promise<number> {
  const db = await getDb();
  if (!db) {
    console.error('Database connection is null');
    return 0;
  }

  let removed = 0;
  const idsToRemove = new Set<number>();

  // 重複ペアから削除対象IDを抽出（新しい方を削除）
  for (const dup of duplicates) {
    // id2の方が大きい（新しい）と仮定して削除
    if (!idsToRemove.has(dup.id1)) {
      idsToRemove.add(dup.id2);
    }
  }

  // 削除実行
  for (const id of Array.from(idsToRemove)) {
    await db.delete(bearSightings).where(eq(bearSightings.id, id));
    removed++;
    console.log(`Removed duplicate sighting: id=${id}`);
  }

  return removed;
}
