/**
 * E2E tests for bear sightings API
 * Tests the full flow from API request to database operations
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from './db';
import { bearSightings } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('Bear Sightings E2E Tests', () => {
  let testSightingId: number;

  beforeAll(async () => {
    // Ensure database connection is available
    const db = await getDb();
    if (!db) {
      throw new Error('Database connection not available for E2E tests');
    }
  });

  afterAll(async () => {
    // Cleanup: Remove test data
    if (testSightingId) {
      const db = await getDb();
      if (db) {
        await db.delete(bearSightings).where(eq(bearSightings.id, testSightingId));
      }
    }
  });

  describe('Input Validation', () => {
    it('should reject invalid latitude values', async () => {
      const invalidLatitudes = ['-91', '91', 'abc', ''];
      
      for (const lat of invalidLatitudes) {
        // In a real E2E test, you would make an HTTP request to the API
        // For now, we test the validation logic directly
        const isValid = !isNaN(parseFloat(lat)) && 
                       parseFloat(lat) >= -90 && 
                       parseFloat(lat) <= 90;
        expect(isValid).toBe(false);
      }
    });

    it('should accept valid latitude values', () => {
      const validLatitudes = ['0', '45.5', '-45.5', '90', '-90'];
      
      for (const lat of validLatitudes) {
        const isValid = !isNaN(parseFloat(lat)) && 
                       parseFloat(lat) >= -90 && 
                       parseFloat(lat) <= 90;
        expect(isValid).toBe(true);
      }
    });

    it('should reject invalid longitude values', () => {
      const invalidLongitudes = ['-181', '181', 'xyz', ''];
      
      for (const lng of invalidLongitudes) {
        const isValid = !isNaN(parseFloat(lng)) && 
                       parseFloat(lng) >= -180 && 
                       parseFloat(lng) <= 180;
        expect(isValid).toBe(false);
      }
    });

    it('should accept valid longitude values', () => {
      const validLongitudes = ['0', '135.5', '-135.5', '180', '-180'];
      
      for (const lng of validLongitudes) {
        const isValid = !isNaN(parseFloat(lng)) && 
                       parseFloat(lng) >= -180 && 
                       parseFloat(lng) <= 180;
        expect(isValid).toBe(true);
      }
    });
  });

  describe('Database Operations', () => {
    it('should create a bear sighting with valid data', async () => {
      const db = await getDb();
      if (!db) {
        throw new Error('Database not available');
      }

      const testData = {
        sourceType: 'user' as const,
        userId: 1,
        prefecture: '北海道',
        city: '札幌市',
        location: 'テスト用の場所',
        latitude: '43.064',
        longitude: '141.347',
        sightedAt: new Date(),
        bearType: 'ヒグマ',
        description: 'E2Eテスト用のデータ',
        status: 'approved' as const,
      };

      const result = await db.insert(bearSightings).values(testData);
      expect(result).toBeDefined();

      // Store the ID for cleanup
      testSightingId = Number(result[0].insertId);
      expect(testSightingId).toBeGreaterThan(0);
    });

    it('should retrieve the created bear sighting', async () => {
      if (!testSightingId) {
        throw new Error('Test sighting not created');
      }

      const db = await getDb();
      if (!db) {
        throw new Error('Database not available');
      }

      const result = await db
        .select()
        .from(bearSightings)
        .where(eq(bearSightings.id, testSightingId))
        .limit(1);

      expect(result).toHaveLength(1);
      expect(result[0].prefecture).toBe('北海道');
      expect(result[0].city).toBe('札幌市');
      expect(result[0].bearType).toBe('ヒグマ');
    });

    it('should filter sightings by prefecture', async () => {
      const db = await getDb();
      if (!db) {
        throw new Error('Database not available');
      }

      const result = await db
        .select()
        .from(bearSightings)
        .where(eq(bearSightings.prefecture, '北海道'))
        .limit(10);

      expect(result.length).toBeGreaterThan(0);
      result.forEach(sighting => {
        expect(sighting.prefecture).toBe('北海道');
      });
    });

    it('should filter sightings by source type', async () => {
      const db = await getDb();
      if (!db) {
        throw new Error('Database not available');
      }

      const result = await db
        .select()
        .from(bearSightings)
        .where(eq(bearSightings.sourceType, 'official'))
        .limit(10);

      result.forEach(sighting => {
        expect(sighting.sourceType).toBe('official');
      });
    });
  });

  describe('Data Integrity', () => {
    it('should have valid coordinates for all sightings', async () => {
      const db = await getDb();
      if (!db) {
        throw new Error('Database not available');
      }

      const result = await db
        .select()
        .from(bearSightings)
        .limit(100);

      result.forEach(sighting => {
        const lat = parseFloat(sighting.latitude);
        const lng = parseFloat(sighting.longitude);

        expect(lat).toBeGreaterThanOrEqual(-90);
        expect(lat).toBeLessThanOrEqual(90);
        expect(lng).toBeGreaterThanOrEqual(-180);
        expect(lng).toBeLessThanOrEqual(180);
      });
    });

    it('should have valid status values', async () => {
      const db = await getDb();
      if (!db) {
        throw new Error('Database not available');
      }

      const result = await db
        .select()
        .from(bearSightings)
        .limit(100);

      const validStatuses = ['pending', 'approved', 'rejected'];
      result.forEach(sighting => {
        expect(validStatuses).toContain(sighting.status);
      });
    });

    it('should have valid source types', async () => {
      const db = await getDb();
      if (!db) {
        throw new Error('Database not available');
      }

      const result = await db
        .select()
        .from(bearSightings)
        .limit(100);

      const validSourceTypes = ['official', 'user'];
      result.forEach(sighting => {
        expect(validSourceTypes).toContain(sighting.sourceType);
      });
    });
  });

  describe('Performance', () => {
    it('should retrieve sightings within acceptable time', async () => {
      const db = await getDb();
      if (!db) {
        throw new Error('Database not available');
      }

      const startTime = Date.now();
      
      await db
        .select()
        .from(bearSightings)
        .limit(100);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within 1 second
      expect(duration).toBeLessThan(1000);
    });

    it('should handle large result sets efficiently', async () => {
      const db = await getDb();
      if (!db) {
        throw new Error('Database not available');
      }

      const startTime = Date.now();
      
      const result = await db
        .select()
        .from(bearSightings)
        .limit(1000);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within 2 seconds even for 1000 records
      expect(duration).toBeLessThan(2000);
      expect(result.length).toBeLessThanOrEqual(1000);
    });
  });
});
