/**
 * Bear sighting scraper - Hybrid approach
 * 1. Scrapes Yahoo! News to get prefecture external links
 * 2. Saves prefecture-level information with links to official sources
 */

import axios from "axios";
import * as cheerio from "cheerio";
import { insertBearSighting, getDb } from "./db";
import { bearSightings } from "../drizzle/schema";
import { and, eq } from "drizzle-orm";
import { PREFECTURE_MAP_URLS } from "./prefectureUrlMapping";
import { withRetry, isRetryableError } from "./utils/retryHelper";

const YAHOO_BEAR_PAGE = "https://emg.yahoo.co.jp/notebook/contents/article/bearsummary251114.html";

/**
 * Prefecture geocoding data (approximate center coordinates)
 */
const PREFECTURE_COORDS: Record<string, { lat: string; lng: string }> = {
  北海道: { lat: "43.064", lng: "141.347" },
  青森県: { lat: "40.824", lng: "140.740" },
  岩手県: { lat: "39.703", lng: "141.153" },
  宮城県: { lat: "38.269", lng: "140.872" },
  秋田県: { lat: "39.719", lng: "140.103" },
  山形県: { lat: "38.240", lng: "140.363" },
  福島県: { lat: "37.750", lng: "140.467" },
  茨城県: { lat: "36.341", lng: "140.447" },
  栃木県: { lat: "36.566", lng: "139.883" },
  群馬県: { lat: "36.391", lng: "139.060" },
  埼玉県: { lat: "35.857", lng: "139.649" },
  東京都: { lat: "35.689", lng: "139.692" },
  神奈川県: { lat: "35.448", lng: "139.643" },
  新潟県: { lat: "37.902", lng: "139.023" },
  富山県: { lat: "36.696", lng: "137.211" },
  石川県: { lat: "36.595", lng: "136.626" },
  福井県: { lat: "36.065", lng: "136.222" },
  山梨県: { lat: "35.664", lng: "138.568" },
  長野県: { lat: "36.651", lng: "138.181" },
  岐阜県: { lat: "35.391", lng: "136.722" },
  静岡県: { lat: "34.977", lng: "138.383" },
  愛知県: { lat: "35.180", lng: "136.907" },
  三重県: { lat: "34.730", lng: "136.509" },
  滋賀県: { lat: "35.004", lng: "135.869" },
  京都府: { lat: "35.021", lng: "135.756" },
  大阪府: { lat: "34.686", lng: "135.520" },
  兵庫県: { lat: "34.691", lng: "135.183" },
  奈良県: { lat: "34.685", lng: "135.833" },
  和歌山県: { lat: "34.226", lng: "135.167" },
  鳥取県: { lat: "35.504", lng: "134.238" },
  島根県: { lat: "35.472", lng: "133.051" },
  岡山県: { lat: "34.662", lng: "133.935" },
  広島県: { lat: "34.397", lng: "132.460" },
  山口県: { lat: "34.186", lng: "131.471" },
  徳島県: { lat: "34.066", lng: "134.559" },
  高知県: { lat: "33.560", lng: "133.531" },
};

interface PrefectureLink {
  prefecture: string;
  summaryUrl?: string;
  mapUrl?: string;
}

/**
 * Scrape Yahoo! News bear page to extract prefecture external links
 * This is the core of the hybrid approach - we get links to official sources
 */
export async function scrapePrefectureLinks(): Promise<PrefectureLink[]> {
  try {
    console.log("[Scraper] Fetching Yahoo! News bear page...");
    
    // Use retry helper for robust HTTP requests
    const response = await withRetry(
      async () => {
        return await axios.get(YAHOO_BEAR_PAGE, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
          timeout: 10000, // 10 second timeout
        });
      },
      {
        maxRetries: 3,
        initialDelayMs: 1000,
        onRetry: (error, attempt) => {
          console.warn(`[Scraper] Retry attempt ${attempt} after error: ${error.message}`);
        },
      }
    );

    const $ = cheerio.load(response.data);
    const links: PrefectureLink[] = [];

    // Find all prefecture sections (h2 headings contain prefecture names)
    $("h2").each((_, element) => {
      const heading = $(element).text().trim();
      
      // Check if this is a prefecture heading
      const prefectureMatch = heading.match(/^(北海道|.+[都道府県])$/);
      if (!prefectureMatch) return;
      
      const prefecture = prefectureMatch[1];
      if (!PREFECTURE_COORDS[prefecture]) return;

      // Find the section after this h2 until the next h2
      let currentElement = $(element).next();
      let summaryUrl: string | undefined;
      let mapUrl: string | undefined;

      // Traverse siblings until we hit another h2 or h1
      while (currentElement.length > 0 && !currentElement.is("h1, h2")) {
        // Look for links in this element and its children
        const allLinks = currentElement.find("a").addBack("a");
        
        allLinks.each((_, link) => {
          const href = $(link).attr("href");
          const text = $(link).text();
          
          if (!href) return;

          // Identify link type based on text content
          if (text.includes("マップ") || text.includes("出没情報") || text.includes("目撃")) {
            if (!mapUrl) mapUrl = href;
          } else if (text.includes(prefecture) && !summaryUrl) {
            summaryUrl = href;
          }
        });
        
        currentElement = currentElement.next();
      }

      if (summaryUrl || mapUrl) {
        links.push({
          prefecture,
          summaryUrl,
          mapUrl,
        });
        console.log(`[Scraper] ${prefecture}: summary=${summaryUrl ? 'YES' : 'NO'}, map=${mapUrl ? 'YES' : 'NO'}`);
      }
    });

    console.log(`[Scraper] Found ${links.length} prefecture links`);
    return links;
  } catch (error) {
    console.error("[Scraper] Failed to scrape prefecture links:", error);
    return [];
  }
}

/**
 * Process scraped prefecture links and save to database
 * Creates prefecture-level entries with external links
 */
export async function processScraping() {
  console.log("[Scraper] Starting prefecture link scraping...");

  const prefectureLinks = await scrapePrefectureLinks();
  console.log(`[Scraper] Found ${prefectureLinks.length} prefectures with external links`);

  const db = await getDb();
  if (!db) {
    console.error("[Scraper] Database not available");
    return { total: prefectureLinks.length, saved: 0, skipped: 0 };
  }

  let savedCount = 0;
  let skippedCount = 0;

  for (const link of prefectureLinks) {
    const coords = PREFECTURE_COORDS[link.prefecture];
    if (!coords) continue;

      // Use accurate URL mapping if available, otherwise use scraped URL
      const sourceUrl = PREFECTURE_MAP_URLS[link.prefecture] || link.mapUrl || link.summaryUrl;
      if (!sourceUrl) continue;

    try {
      // Check for duplicate: same prefecture + sourceUrl
      const existing = await db
        .select()
        .from(bearSightings)
        .where(
          and(
            eq(bearSightings.prefecture, link.prefecture),
            eq(bearSightings.sourceUrl, sourceUrl)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        console.log(`[Scraper] Skipping duplicate: ${link.prefecture}`);
        skippedCount++;
        continue;
      }

      // Create description with link information
      let description = `${link.prefecture}の公式出没情報`;
      if (link.mapUrl) {
        description += "（マップあり）";
      }

      await insertBearSighting({
        sourceType: "official",
        prefecture: link.prefecture,
        location: link.prefecture,
        latitude: coords.lat,
        longitude: coords.lng,
        sightedAt: new Date(),
        description,
        sourceUrl,
        status: "approved",
      });
      
      savedCount++;
      console.log(`[Scraper] Saved: ${link.prefecture} - ${sourceUrl}`);
    } catch (error) {
      console.error(`[Scraper] Failed to save ${link.prefecture}:`, error);
    }
  }

  const result = {
    total: prefectureLinks.length,
    saved: savedCount,
    skipped: skippedCount,
  };
  
  console.log(`[Scraper] Complete. Total: ${result.total}, Saved: ${result.saved}, Skipped: ${result.skipped}`);
  return result;
}

/**
 * Run scraper as a standalone script
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  processScraping()
    .then((result) => {
      console.log("Scraping result:", result);
      process.exit(0);
    })
    .catch((error) => {
      console.error("Scraping failed:", error);
      process.exit(1);
    });
}
