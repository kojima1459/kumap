import { router } from "./_core/trpc";
import { adminProcedure } from "./adminProcedure";
import { processScraping } from "./scraper";
import { runNaganoPrefectureScraper } from "./prefectureScraper";
import { scrapeKumapData } from "./kumapScraper";
import { z } from "zod";

export const scraperRouter = router({
  /**
   * Manually trigger Yahoo News scraping (ADMIN ONLY)
   * Only the project owner can execute this to prevent abuse and cost overruns
   */
  runScraper: adminProcedure.mutation(async () => {
    const result = await processScraping();
    return result;
  }),

  /**
   * Manually trigger Nagano Prefecture PDF scraping (ADMIN ONLY)
   * Only the project owner can execute this to prevent abuse and cost overruns
   */
  runNaganoScraper: adminProcedure.mutation(async () => {
    await runNaganoPrefectureScraper();
    return { success: true, message: 'Nagano Prefecture scraper completed' };
  }),

  /**
   * Manually trigger Kumap API scraping (ADMIN ONLY)
   * Fetches bear sighting data from Kumap (Xenon) API
   */
  runKumapScraper: adminProcedure
    .input(z.object({
      daysBack: z.number().min(1).max(365).default(30),
      prefecture: z.string().optional(),
      dryRun: z.boolean().default(false),
    }).optional())
    .mutation(async ({ input }) => {
      const result = await scrapeKumapData({
        daysBack: input?.daysBack ?? 30,
        prefecture: input?.prefecture,
        dryRun: input?.dryRun ?? false,
      });
      return {
        success: true,
        message: `Kumap scraper completed: ${result.imported} imported, ${result.duplicates} duplicates, ${result.errors} errors`,
        ...result,
      };
    }),
});
