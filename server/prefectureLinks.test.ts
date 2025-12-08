import { describe, expect, it } from "vitest";
import { scrapePrefectureLinks } from "./scraper";

describe("scrapePrefectureLinks", () => {
  it("should scrape prefecture links from Yahoo! News", async () => {
    const links = await scrapePrefectureLinks();
    
    // Should find multiple prefectures
    expect(links.length).toBeGreaterThan(30);
    
    // Each link should have required fields
    links.forEach((link) => {
      expect(link.prefecture).toBeTruthy();
      expect(link.prefecture).toMatch(/(北海道|.+[都道府県])/);
      
      // Should have at least one URL
      expect(link.summaryUrl || link.mapUrl).toBeTruthy();
    });
    
    // Check for specific prefectures
    const kyoto = links.find((l) => l.prefecture === "京都府");
    expect(kyoto).toBeTruthy();
    expect(kyoto?.mapUrl).toBeTruthy();
    
    const tokyo = links.find((l) => l.prefecture === "東京都");
    expect(tokyo).toBeTruthy();
    expect(tokyo?.mapUrl).toBeTruthy();
  }, 30000); // 30 second timeout for network request
});
