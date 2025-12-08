/**
 * E2E tests for notification system
 * Tests notification preferences and delivery
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from './db';
import { notificationPreferences, users } from '../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import {
  getUserNotificationPreferences,
  upsertNotificationPreference,
  deleteNotificationPreference,
  getUsersSubscribedToPrefecture,
} from './notificationDb';

describe('Notification System E2E Tests', () => {
  let testUserId: number;
  const testPrefecture = '北海道';

  beforeAll(async () => {
    const db = await getDb();
    if (!db) {
      throw new Error('Database connection not available for E2E tests');
    }

    // Create a test user
    const result = await db.insert(users).values({
      openId: 'test-e2e-user-' + Date.now(),
      name: 'E2E Test User',
      email: 'e2e-test@example.com',
      role: 'user',
    });

    testUserId = Number(result[0].insertId);
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Cleanup: Remove test data
    await db.delete(notificationPreferences).where(eq(notificationPreferences.userId, testUserId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  describe('Notification Preferences', () => {
    it('should create a new notification preference', async () => {
      await upsertNotificationPreference(testUserId, testPrefecture, true);

      const preferences = await getUserNotificationPreferences(testUserId);
      expect(preferences.length).toBeGreaterThan(0);

      const pref = preferences.find(p => p.prefecture === testPrefecture);
      expect(pref).toBeDefined();
      expect(pref?.enabled).toBe(1);
    });

    it('should update an existing notification preference', async () => {
      // Disable the preference
      await upsertNotificationPreference(testUserId, testPrefecture, false);

      const preferences = await getUserNotificationPreferences(testUserId);
      const pref = preferences.find(p => p.prefecture === testPrefecture);
      
      expect(pref).toBeDefined();
      expect(pref?.enabled).toBe(0);
    });

    it('should retrieve all preferences for a user', async () => {
      // Add multiple preferences
      await upsertNotificationPreference(testUserId, '青森県', true);
      await upsertNotificationPreference(testUserId, '岩手県', true);

      const preferences = await getUserNotificationPreferences(testUserId);
      expect(preferences.length).toBeGreaterThanOrEqual(3);
    });

    it('should delete a notification preference', async () => {
      await deleteNotificationPreference(testUserId, '青森県');

      const preferences = await getUserNotificationPreferences(testUserId);
      const deletedPref = preferences.find(p => p.prefecture === '青森県');
      
      expect(deletedPref).toBeUndefined();
    });
  });

  describe('Subscriber Queries', () => {
    it('should retrieve users subscribed to a prefecture', async () => {
      // Enable notification for test prefecture
      await upsertNotificationPreference(testUserId, testPrefecture, true);

      const subscribers = await getUsersSubscribedToPrefecture(testPrefecture);
      expect(subscribers.length).toBeGreaterThan(0);

      const testUserSubscription = subscribers.find(s => s.userId === testUserId);
      expect(testUserSubscription).toBeDefined();
      expect(testUserSubscription?.prefecture).toBe(testPrefecture);
    });

    it('should not retrieve disabled subscriptions', async () => {
      // Disable the preference
      await upsertNotificationPreference(testUserId, testPrefecture, false);

      const subscribers = await getUsersSubscribedToPrefecture(testPrefecture);
      const testUserSubscription = subscribers.find(s => s.userId === testUserId);
      
      expect(testUserSubscription).toBeUndefined();
    });

    it('should include user details in subscription query (JOIN test)', async () => {
      // Re-enable the preference
      await upsertNotificationPreference(testUserId, testPrefecture, true);

      const subscribers = await getUsersSubscribedToPrefecture(testPrefecture);
      const testUserSubscription = subscribers.find(s => s.userId === testUserId);

      expect(testUserSubscription).toBeDefined();
      expect(testUserSubscription?.userName).toBe('E2E Test User');
      expect(testUserSubscription?.userEmail).toBe('e2e-test@example.com');
    });
  });

  describe('Data Integrity', () => {
    it('should not allow duplicate preferences for same user and prefecture', async () => {
      // Try to create the same preference twice
      await upsertNotificationPreference(testUserId, '秋田県', true);
      await upsertNotificationPreference(testUserId, '秋田県', true);

      const preferences = await getUserNotificationPreferences(testUserId);
      const akitaPrefs = preferences.filter(p => p.prefecture === '秋田県');

      // Should only have one preference for 秋田県
      expect(akitaPrefs.length).toBe(1);
    });

    it('should handle multiple users subscribing to the same prefecture', async () => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Create another test user
      const result = await db.insert(users).values({
        openId: 'test-e2e-user-2-' + Date.now(),
        name: 'E2E Test User 2',
        role: 'user',
      });

      const testUserId2 = Number(result[0].insertId);

      try {
        // Both users subscribe to the same prefecture
        await upsertNotificationPreference(testUserId, '山形県', true);
        await upsertNotificationPreference(testUserId2, '山形県', true);

        const subscribers = await getUsersSubscribedToPrefecture('山形県');
        const userIds = subscribers.map(s => s.userId);

        expect(userIds).toContain(testUserId);
        expect(userIds).toContain(testUserId2);
      } finally {
        // Cleanup
        await db.delete(notificationPreferences).where(eq(notificationPreferences.userId, testUserId2));
        await db.delete(users).where(eq(users.id, testUserId2));
      }
    });
  });

  describe('Performance', () => {
    it('should retrieve preferences within acceptable time', async () => {
      const startTime = Date.now();
      
      await getUserNotificationPreferences(testUserId);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within 500ms
      expect(duration).toBeLessThan(500);
    });

    it('should retrieve subscribers within acceptable time', async () => {
      const startTime = Date.now();
      
      await getUsersSubscribedToPrefecture(testPrefecture);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within 500ms (with JOIN)
      expect(duration).toBeLessThan(500);
    });
  });
});
