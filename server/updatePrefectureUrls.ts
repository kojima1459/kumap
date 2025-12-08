/**
 * Update existing prefecture entries with accurate map URLs
 */

import { getDb } from "./db";
import { bearSightings } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { PREFECTURE_MAP_URLS } from "./prefectureUrlMapping";

async function updatePrefectureUrls() {
  console.log("[Update] Starting prefecture URL update...");
  
  const db = await getDb();
  if (!db) {
    console.error("[Update] Database not available");
    return;
  }

  let updatedCount = 0;
  let skippedCount = 0;

  for (const [prefecture, mapUrl] of Object.entries(PREFECTURE_MAP_URLS)) {
    try {
      // Find all entries for this prefecture with sourceType='official'
      const entries = await db
        .select()
        .from(bearSightings)
        .where(eq(bearSightings.prefecture, prefecture));

      if (entries.length === 0) {
        console.log(`[Update] No entries found for ${prefecture}, skipping`);
        skippedCount++;
        continue;
      }

      // Update all entries for this prefecture
      for (const entry of entries) {
        if (entry.sourceUrl !== mapUrl) {
          await db
            .update(bearSightings)
            .set({ sourceUrl: mapUrl })
            .where(eq(bearSightings.id, entry.id));
          
          console.log(`[Update] Updated ${prefecture}: ${entry.sourceUrl} -> ${mapUrl}`);
          updatedCount++;
        } else {
          console.log(`[Update] ${prefecture} already has correct URL`);
          skippedCount++;
        }
      }
    } catch (error) {
      console.error(`[Update] Failed to update ${prefecture}:`, error);
    }
  }

  console.log(`[Update] Complete. Updated: ${updatedCount}, Skipped: ${skippedCount}`);
  return { updated: updatedCount, skipped: skippedCount };
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  updatePrefectureUrls()
    .then((result) => {
      console.log("Update result:", result);
      process.exit(0);
    })
    .catch((error) => {
      console.error("Update failed:", error);
      process.exit(1);
    });
}

export { updatePrefectureUrls };
