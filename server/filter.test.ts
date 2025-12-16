import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database module
vi.mock("./db", () => ({
  getBearSightings: vi.fn(),
}));

import { getBearSightings } from "./db";

describe("Bear Sightings Filter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getBearSightings filter parameters", () => {
    it("should accept single prefecture filter", async () => {
      const mockGetBearSightings = getBearSightings as ReturnType<typeof vi.fn>;
      mockGetBearSightings.mockResolvedValue([]);

      await getBearSightings({ prefecture: "北海道" });

      expect(mockGetBearSightings).toHaveBeenCalledWith({ prefecture: "北海道" });
    });

    it("should accept multiple prefectures filter", async () => {
      const mockGetBearSightings = getBearSightings as ReturnType<typeof vi.fn>;
      mockGetBearSightings.mockResolvedValue([]);

      await getBearSightings({ prefectures: ["北海道", "長野県", "岩手県"] });

      expect(mockGetBearSightings).toHaveBeenCalledWith({
        prefectures: ["北海道", "長野県", "岩手県"],
      });
    });

    it("should accept date range filter with startDate and endDate", async () => {
      const mockGetBearSightings = getBearSightings as ReturnType<typeof vi.fn>;
      mockGetBearSightings.mockResolvedValue([]);

      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-12-31");

      await getBearSightings({ startDate, endDate });

      expect(mockGetBearSightings).toHaveBeenCalledWith({ startDate, endDate });
    });

    it("should accept combined filters", async () => {
      const mockGetBearSightings = getBearSightings as ReturnType<typeof vi.fn>;
      mockGetBearSightings.mockResolvedValue([]);

      const startDate = new Date("2024-06-01");
      const endDate = new Date("2024-06-30");

      await getBearSightings({
        prefectures: ["北海道", "長野県"],
        startDate,
        endDate,
        sourceType: "official",
      });

      expect(mockGetBearSightings).toHaveBeenCalledWith({
        prefectures: ["北海道", "長野県"],
        startDate,
        endDate,
        sourceType: "official",
      });
    });

    it("should return empty array when no filters provided", async () => {
      const mockGetBearSightings = getBearSightings as ReturnType<typeof vi.fn>;
      mockGetBearSightings.mockResolvedValue([]);

      const result = await getBearSightings();

      expect(result).toEqual([]);
    });
  });
});
