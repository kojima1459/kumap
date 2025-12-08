import { eq, desc, and, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, bearSightings, InsertBearSighting } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Bear Sightings Database Helpers
 */

/**
 * Get all approved bear sightings with optional filters
 */
export async function getBearSightings(filters?: {
  prefecture?: string;
  startDate?: Date;
  endDate?: Date;
  sourceType?: "official" | "user";
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(bearSightings.status, "approved")];

  if (filters?.prefecture) {
    conditions.push(eq(bearSightings.prefecture, filters.prefecture));
  }
  if (filters?.startDate) {
    conditions.push(gte(bearSightings.sightedAt, filters.startDate));
  }
  if (filters?.endDate) {
    conditions.push(lte(bearSightings.sightedAt, filters.endDate));
  }
  if (filters?.sourceType) {
    conditions.push(eq(bearSightings.sourceType, filters.sourceType));
  }

  return db
    .select()
    .from(bearSightings)
    .where(and(...conditions))
    .orderBy(desc(bearSightings.sightedAt));
}

/**
 * Insert a new bear sighting
 */
export async function insertBearSighting(sighting: InsertBearSighting) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(bearSightings).values(sighting);
  
  // Get the inserted record using the insert result
  const insertedId = (result as any).insertId;
  if (insertedId) {
    const inserted = await db
      .select()
      .from(bearSightings)
      .where(eq(bearSightings.id, Number(insertedId)))
      .limit(1);
    return inserted[0] || null;
  }
  
  return null;
}

/**
 * Get sightings by user ID
 */
export async function getUserSightings(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(bearSightings)
    .where(eq(bearSightings.userId, userId))
    .orderBy(desc(bearSightings.createdAt));
}

/**
 * Get pending sightings for admin approval
 */
export async function getPendingSightings() {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(bearSightings)
    .where(eq(bearSightings.status, "pending"))
    .orderBy(desc(bearSightings.createdAt));
}

/**
 * Update sighting status (for admin approval)
 */
export async function updateSightingStatus(
  id: number,
  status: "approved" | "rejected"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .update(bearSightings)
    .set({ status, updatedAt: new Date() })
    .where(eq(bearSightings.id, id));
}
