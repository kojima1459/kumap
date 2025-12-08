import { publicProcedure, router } from "./_core/trpc";
import {
  getPrefectureStats,
  getMonthlyStats,
  getBearTypeStats,
  getTotalSightingsCount,
} from "./statsDb";

export const statsRouter = router({
  prefectureStats: publicProcedure.query(async () => {
    return await getPrefectureStats();
  }),

  monthlyStats: publicProcedure.query(async () => {
    return await getMonthlyStats();
  }),

  bearTypeStats: publicProcedure.query(async () => {
    return await getBearTypeStats();
  }),

  totalCount: publicProcedure.query(async () => {
    return await getTotalSightingsCount();
  }),
});
