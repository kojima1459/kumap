/**
 * Bear sighting scraper
 * Scrapes Yahoo! News bear sighting summary page and extracts prefecture links
 */

import axios from "axios";
import { insertBearSighting } from "./db";

const YAHOO_BEAR_PAGE = "https://emg.yahoo.co.jp/notebook/contents/article/bearsummary251114.html";

/**
 * Prefecture geocoding data (approximate center coordinates)
 * Used when exact location is not available from scraped data
 */
const PREFECTURE_COORDS: Record<string, { lat: string; lng: string }> = {
  北海道: { lat: "43.064", lng: "141.347" },
  青森県: { lat: "40.824", lng: "140.740" },
  岩手県: { lat: "39.703", lng: "141.153" },
  宮城県: { lat: "38.269", lng: "140.872" },
  秋田県: { lat: "39.719" , lng: "140.103" },
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

interface ScrapedSighting {
  prefecture: string;
  sourceUrl: string;
  description: string;
}

/**
 * Scrape Yahoo! News bear sighting page
 * Extracts prefecture-level information and links to official sources
 */
export async function scrapeYahooBearPage(): Promise<ScrapedSighting[]> {
  try {
    const response = await axios.get(YAHOO_BEAR_PAGE, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; BearMapBot/1.0)",
      },
    });

    const html = response.data as string;
    const sightings: ScrapedSighting[] = [];

    // Parse HTML to extract prefecture information
    // This is a simplified parser - in production, use a proper HTML parser like cheerio
    const prefecturePattern = /<h2[^>]*>([^<]+県|北海道|東京都|京都府|大阪府)<\/h2>/g;
    const linkPattern = /<a[^>]*href="([^"]+)"[^>]*>([^<]*出没[^<]*)<\/a>/g;

    let match;
    let currentPrefecture = "";

    // Extract prefectures
    const prefectures: string[] = [];
    while ((match = prefecturePattern.exec(html)) !== null) {
      prefectures.push(match[1]);
    }

    // For each prefecture, extract links
    for (const prefecture of prefectures) {
      if (!PREFECTURE_COORDS[prefecture]) continue;

      // Find links in the prefecture section
      const sectionStart = html.indexOf(`<h2>${prefecture}</h2>`);
      if (sectionStart === -1) continue;

      const nextSectionStart = html.indexOf("<h2>", sectionStart + 1);
      const sectionHtml = html.substring(
        sectionStart,
        nextSectionStart === -1 ? html.length : nextSectionStart
      );

      // Extract links from this section
      let linkMatch;
      linkPattern.lastIndex = 0;
      while ((linkMatch = linkPattern.exec(sectionHtml)) !== null) {
        const url = linkMatch[1];
        const text = linkMatch[2];

        sightings.push({
          prefecture,
          sourceUrl: url,
          description: `${prefecture}の公式情報: ${text}`,
        });
      }
    }

    return sightings;
  } catch (error) {
    console.error("Failed to scrape Yahoo bear page:", error);
    return [];
  }
}

/**
 * Process scraped sightings and save to database
 * Creates entries with prefecture-level coordinates
 */
export async function processScraping() {
  console.log("Starting bear sighting scraping...");

  const sightings = await scrapeYahooBearPage();
  console.log(`Found ${sightings.length} prefecture-level sightings`);

  let savedCount = 0;

  for (const sighting of sightings) {
    const coords = PREFECTURE_COORDS[sighting.prefecture];
    if (!coords) continue;

    try {
      await insertBearSighting({
        sourceType: "official",
        prefecture: sighting.prefecture,
        location: sighting.prefecture,
        latitude: coords.lat,
        longitude: coords.lng,
        sightedAt: new Date(), // Use current date as we don't have exact sighting date
        description: sighting.description,
        sourceUrl: sighting.sourceUrl,
        status: "approved",
      });
      savedCount++;
    } catch (error) {
      console.error(`Failed to save sighting for ${sighting.prefecture}:`, error);
    }
  }

  console.log(`Scraping complete. Saved ${savedCount} sightings.`);
  return { total: sightings.length, saved: savedCount };
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
