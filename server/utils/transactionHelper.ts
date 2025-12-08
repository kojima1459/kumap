/**
 * Transaction helper for database operations
 * Ensures data consistency with automatic rollback on errors
 */

import { getDb } from "../db";

/**
 * Execute a function within a database transaction
 * Automatically commits on success and rolls back on error
 * 
 * @param fn - Async function that receives the transaction object
 * @returns Promise with the result of the function
 */
export async function withTransaction<T>(
  fn: (tx: any) => Promise<T>
): Promise<T> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    // Drizzle ORM transaction API
    return await db.transaction(async (tx) => {
      return await fn(tx);
    });
  } catch (error) {
    console.error("[Transaction] Transaction failed and rolled back:", error);
    throw error;
  }
}

/**
 * Example usage:
 * 
 * await withTransaction(async (tx) => {
 *   await tx.insert(bearSightings).values(sighting);
 *   await tx.update(users).set({ lastActivity: new Date() }).where(eq(users.id, userId));
 *   // If any operation fails, all changes are rolled back
 * });
 */
