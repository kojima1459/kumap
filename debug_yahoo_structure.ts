import axios from "axios";
import * as cheerio from "cheerio";

const YAHOO_BEAR_PAGE = "https://emg.yahoo.co.jp/notebook/contents/article/bearsummary251114.html";

async function debugYahooStructure() {
  try {
    console.log("Fetching Yahoo! News page...");
    const response = await axios.get(YAHOO_BEAR_PAGE, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    const $ = cheerio.load(response.data);
    
    console.log("\n=== Page Title ===");
    console.log($("title").text());
    
    console.log("\n=== All Headings ===");
    $("h1, h2, h3, h4, h5, h6").each((i, el) => {
      const tag = el.tagName;
      const text = $(el).text().trim();
      console.log(`${tag}: ${text.substring(0, 100)}`);
    });
    
    console.log("\n=== Links containing '北海道' ===");
    $("a:contains('北海道')").each((i, el) => {
      const href = $(el).attr("href");
      const text = $(el).text().trim();
      console.log(`Link: ${text} -> ${href}`);
    });
    
    console.log("\n=== Links containing '京都' ===");
    $("a:contains('京都')").each((i, el) => {
      const href = $(el).attr("href");
      const text = $(el).text().trim();
      console.log(`Link: ${text} -> ${href}`);
    });
    
    console.log("\n=== Links containing 'マップ' ===");
    $("a:contains('マップ')").each((i, el) => {
      const href = $(el).attr("href");
      const text = $(el).text().trim();
      console.log(`Link: ${text} -> ${href}`);
    });

  } catch (error) {
    console.error("Error:", error);
  }
}

debugYahooStructure();
