import { router, publicProcedure } from "./_core/trpc";
import { processScraping } from "./scraper";

export const scraperRouter = router({
  /**
   * Manually trigger scraping (for testing or manual updates)
   */
  runScraper: publicProcedure.mutation(async () => {
    const result = await processScraping();
    return result;
  }),
});
