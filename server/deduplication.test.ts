/**
 * 重複データ排除ロジックのテスト
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { getDb } from './db';
import { bearSightings } from '../drizzle/schema';
import { isDuplicate, findExistingDuplicates } from './deduplication';

describe('Deduplication Logic', () => {
  beforeEach(async () => {
    // テスト前にbear_sightingsテーブルをクリア
    const db = await getDb();
    if (db) {
      await db.delete(bearSightings);
    }
  });

  describe('isDuplicate', () => {
    it('should detect duplicate by prefecture + city + date', async () => {
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');

      // 既存データを挿入
      await db.insert(bearSightings).values({
        prefecture: '長野県',
        city: '野沢温泉村',
        latitude: '36.9167',
        longitude: '138.4500',
        sightedAt: new Date('2024-01-15T10:00:00Z'),
        sourceType: 'official',
        status: 'approved',
      });

      // 同じ都道府県・市町村・日付のデータ
      const duplicate = await isDuplicate({
        prefecture: '長野県',
        city: '野沢温泉村',
        latitude: '36.9200', // 緯度が少し違う
        longitude: '138.4600', // 経度が少し違う
        sightedAt: new Date('2024-01-15T14:00:00Z'), // 時刻が違う
        sourceType: 'official',
      });

      expect(duplicate).toBe(true);
    });

    it('should detect duplicate by close coordinates + date', async () => {
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');

      // 既存データを挿入
      await db.insert(bearSightings).values({
        prefecture: '長野県',
        city: '野沢温泉村',
        latitude: '36.9167',
        longitude: '138.4500',
        sightedAt: new Date('2024-01-15T10:00:00Z'),
        sourceType: 'official',
        status: 'approved',
      });

      // 緯度経度が近い（0.01度以内）+ 同じ日付
      const duplicate = await isDuplicate({
        prefecture: '長野県',
        city: '山ノ内町', // 市町村が違う
        latitude: '36.9200', // 0.0033度の差
        longitude: '138.4550', // 0.0050度の差
        sightedAt: new Date('2024-01-15T14:00:00Z'),
        sourceType: 'official',
      });

      expect(duplicate).toBe(true);
    });

    it('should detect duplicate by sourceUrl', async () => {
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');

      const sourceUrl = 'https://example.com/bear-sighting-123';

      // 既存データを挿入
      await db.insert(bearSightings).values({
        prefecture: '長野県',
        city: '野沢温泉村',
        latitude: '36.9167',
        longitude: '138.4500',
        sightedAt: new Date('2024-01-15T10:00:00Z'),
        sourceType: 'official',
        sourceUrl,
        status: 'approved',
      });

      // 同じsourceUrl
      const duplicate = await isDuplicate({
        prefecture: '長野県',
        city: '山ノ内町', // 市町村が違う
        latitude: '36.8000', // 緯度が大きく違う
        longitude: '138.3000', // 経度が大きく違う
        sightedAt: new Date('2024-01-16T10:00:00Z'), // 日付も違う
        sourceType: 'official',
        sourceUrl,
      });

      expect(duplicate).toBe(true);
    });

    it('should NOT detect duplicate when date is different', async () => {
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');

      // 既存データを挿入
      await db.insert(bearSightings).values({
        prefecture: '長野県',
        city: '野沢温泉村',
        latitude: '36.9167',
        longitude: '138.4500',
        sightedAt: new Date('2024-01-15T10:00:00Z'),
        sourceType: 'official',
        status: 'approved',
      });

      // 同じ都道府県・市町村だが日付が違う
      const duplicate = await isDuplicate({
        prefecture: '長野県',
        city: '野沢温泉村',
        latitude: '36.9167',
        longitude: '138.4500',
        sightedAt: new Date('2024-01-16T10:00:00Z'), // 1日違う
        sourceType: 'official',
      });

      expect(duplicate).toBe(false);
    });

    it('should NOT detect duplicate when coordinates are far apart', async () => {
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');

      // 既存データを挿入
      await db.insert(bearSightings).values({
        prefecture: '長野県',
        city: '野沢温泉村',
        latitude: '36.9167',
        longitude: '138.4500',
        sightedAt: new Date('2024-01-15T10:00:00Z'),
        sourceType: 'official',
        status: 'approved',
      });

      // 緯度経度が遠い（0.01度以上）
      const duplicate = await isDuplicate({
        prefecture: '長野県',
        city: '山ノ内町',
        latitude: '36.8000', // 0.1167度の差（約13km）
        longitude: '138.3000', // 0.1500度の差（約17km）
        sightedAt: new Date('2024-01-15T10:00:00Z'),
        sourceType: 'official',
      });

      expect(duplicate).toBe(false);
    });
  });

  describe('findExistingDuplicates', () => {
    it('should find duplicates in existing data', async () => {
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');

      // 重複データを挿入
      await db.insert(bearSightings).values([
        {
          prefecture: '長野県',
          city: '野沢温泉村',
          latitude: '36.9167',
          longitude: '138.4500',
          sightedAt: new Date('2024-01-15T10:00:00Z'),
          sourceType: 'official',
          status: 'approved',
        },
        {
          prefecture: '長野県',
          city: '野沢温泉村',
          latitude: '36.9200',
          longitude: '138.4550',
          sightedAt: new Date('2024-01-15T14:00:00Z'), // 同じ日
          sourceType: 'official',
          status: 'approved',
        },
      ]);

      const duplicates = await findExistingDuplicates();
      expect(duplicates.length).toBeGreaterThan(0);
      expect(duplicates[0].reason).toContain('Same location');
    });

    it('should NOT find duplicates when data is unique', async () => {
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');

      // ユニークなデータを挿入
      await db.insert(bearSightings).values([
        {
          prefecture: '長野県',
          city: '野沢温泉村',
          latitude: '36.9167',
          longitude: '138.4500',
          sightedAt: new Date('2024-01-15T10:00:00Z'),
          sourceType: 'official',
          status: 'approved',
        },
        {
          prefecture: '長野県',
          city: '山ノ内町',
          latitude: '36.8000',
          longitude: '138.3000',
          sightedAt: new Date('2024-01-16T10:00:00Z'), // 日付が違う
          sourceType: 'official',
          status: 'approved',
        },
      ]);

      const duplicates = await findExistingDuplicates();
      expect(duplicates.length).toBe(0);
    });
  });
});
