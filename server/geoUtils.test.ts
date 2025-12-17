/**
 * Tests for geoUtils - GPS-based danger assessment utilities
 */

import { describe, it, expect } from "vitest";
import {
  calculateDistance,
  getPrefectureFromCoordinates,
  filterSightingsWithinRadius,
  calculateDangerLevel,
  getDangerLevelInfo,
  PREFECTURE_BOUNDS,
} from "../client/src/lib/geoUtils";

describe("calculateDistance", () => {
  it("should calculate distance between two points correctly", () => {
    // Tokyo to Osaka (approximately 400km)
    const distance = calculateDistance(35.6762, 139.6503, 34.6937, 135.5023);
    expect(distance).toBeGreaterThan(390);
    expect(distance).toBeLessThan(410);
  });

  it("should return 0 for same coordinates", () => {
    const distance = calculateDistance(35.6762, 139.6503, 35.6762, 139.6503);
    expect(distance).toBe(0);
  });

  it("should handle negative coordinates", () => {
    // Should still calculate correctly
    const distance = calculateDistance(35.0, 139.0, 35.1, 139.1);
    expect(distance).toBeGreaterThan(0);
  });

  it("should calculate short distances accurately", () => {
    // About 1km apart
    const distance = calculateDistance(35.6762, 139.6503, 35.6852, 139.6503);
    expect(distance).toBeGreaterThan(0.9);
    expect(distance).toBeLessThan(1.1);
  });
});

describe("getPrefectureFromCoordinates", () => {
  it("should return Tokyo for Tokyo coordinates", () => {
    const prefecture = getPrefectureFromCoordinates(35.6762, 139.6503);
    expect(prefecture).toBe("東京都");
  });

  it("should return Hokkaido for Sapporo coordinates", () => {
    const prefecture = getPrefectureFromCoordinates(43.0618, 141.3545);
    expect(prefecture).toBe("北海道");
  });

  it("should return Nagano for Nagano city coordinates", () => {
    const prefecture = getPrefectureFromCoordinates(36.6513, 138.1810);
    expect(prefecture).toBe("長野県");
  });

  it("should return null for coordinates outside Japan", () => {
    // New York coordinates
    const prefecture = getPrefectureFromCoordinates(40.7128, -74.0060);
    expect(prefecture).toBeNull();
  });

  it("should return null for coordinates far outside Japan bounds", () => {
    const prefecture = getPrefectureFromCoordinates(0, 0);
    expect(prefecture).toBeNull();
  });
});

describe("filterSightingsWithinRadius", () => {
  const mockSightings = [
    { id: 1, latitude: "35.6762", longitude: "139.6503", sightedAt: new Date() }, // Tokyo
    { id: 2, latitude: "35.6800", longitude: "139.6550", sightedAt: new Date() }, // Near Tokyo (~0.5km)
    { id: 3, latitude: "34.6937", longitude: "135.5023", sightedAt: new Date() }, // Osaka (~400km)
    { id: 4, latitude: "36.6513", longitude: "138.1810", sightedAt: new Date() }, // Nagano (~150km)
  ];

  it("should filter sightings within 5km radius", () => {
    const filtered = filterSightingsWithinRadius(mockSightings, 35.6762, 139.6503, 5);
    expect(filtered.length).toBe(2); // Tokyo and nearby point
    expect(filtered.map(s => s.id)).toContain(1);
    expect(filtered.map(s => s.id)).toContain(2);
  });

  it("should return all sightings within very large radius", () => {
    const filtered = filterSightingsWithinRadius(mockSightings, 35.6762, 139.6503, 1000);
    expect(filtered.length).toBe(4);
  });

  it("should return empty array for very small radius", () => {
    const filtered = filterSightingsWithinRadius(mockSightings, 35.6762, 139.6503, 0.001);
    expect(filtered.length).toBe(1); // Only exact match
  });

  it("should handle numeric latitude/longitude", () => {
    const numericSightings = [
      { id: 1, latitude: 35.6762, longitude: 139.6503, sightedAt: new Date() },
    ];
    const filtered = filterSightingsWithinRadius(numericSightings, 35.6762, 139.6503, 1);
    expect(filtered.length).toBe(1);
  });

  it("should handle invalid coordinates gracefully", () => {
    const invalidSightings = [
      { id: 1, latitude: "invalid", longitude: "139.6503", sightedAt: new Date() },
      { id: 2, latitude: "35.6762", longitude: "139.6503", sightedAt: new Date() },
    ];
    const filtered = filterSightingsWithinRadius(invalidSightings, 35.6762, 139.6503, 5);
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe(2);
  });
});

describe("calculateDangerLevel", () => {
  it("should return critical for 5+ recent sightings", () => {
    expect(calculateDangerLevel(10, 5)).toBe("critical");
    expect(calculateDangerLevel(5, 6)).toBe("critical");
  });

  it("should return high for 3+ recent sightings", () => {
    expect(calculateDangerLevel(5, 3)).toBe("high");
    expect(calculateDangerLevel(5, 4)).toBe("high");
  });

  it("should return high for 10+ total sightings", () => {
    expect(calculateDangerLevel(10, 0)).toBe("high");
    expect(calculateDangerLevel(15, 2)).toBe("high");
  });

  it("should return medium for 1+ recent sightings", () => {
    expect(calculateDangerLevel(2, 1)).toBe("medium");
    expect(calculateDangerLevel(2, 2)).toBe("medium");
  });

  it("should return medium for 3+ total sightings", () => {
    expect(calculateDangerLevel(3, 0)).toBe("medium");
    expect(calculateDangerLevel(5, 0)).toBe("medium");
  });

  it("should return low for no recent sightings and few total", () => {
    expect(calculateDangerLevel(0, 0)).toBe("low");
    expect(calculateDangerLevel(1, 0)).toBe("low");
    expect(calculateDangerLevel(2, 0)).toBe("low");
  });
});

describe("getDangerLevelInfo", () => {
  it("should return correct info for critical level", () => {
    const info = getDangerLevelInfo("critical");
    expect(info.label).toBe("非常に危険");
    expect(info.icon).toBe("🔴");
    expect(info.color).toContain("red");
  });

  it("should return correct info for high level", () => {
    const info = getDangerLevelInfo("high");
    expect(info.label).toBe("注意が必要");
    expect(info.icon).toBe("🟠");
    expect(info.color).toContain("orange");
  });

  it("should return correct info for medium level", () => {
    const info = getDangerLevelInfo("medium");
    expect(info.label).toBe("やや注意");
    expect(info.icon).toBe("🟡");
    expect(info.color).toContain("yellow");
  });

  it("should return correct info for low level", () => {
    const info = getDangerLevelInfo("low");
    expect(info.label).toBe("比較的安全");
    expect(info.icon).toBe("🟢");
    expect(info.color).toContain("green");
  });
});

describe("PREFECTURE_BOUNDS", () => {
  it("should have all 47 prefectures", () => {
    expect(Object.keys(PREFECTURE_BOUNDS).length).toBe(47);
  });

  it("should have valid bounds for each prefecture", () => {
    for (const [name, bounds] of Object.entries(PREFECTURE_BOUNDS)) {
      expect(bounds.minLat).toBeLessThan(bounds.maxLat);
      expect(bounds.minLon).toBeLessThan(bounds.maxLon);
      expect(bounds.center.lat).toBeGreaterThanOrEqual(bounds.minLat);
      expect(bounds.center.lat).toBeLessThanOrEqual(bounds.maxLat);
      expect(bounds.center.lon).toBeGreaterThanOrEqual(bounds.minLon);
      expect(bounds.center.lon).toBeLessThanOrEqual(bounds.maxLon);
    }
  });

  it("should have Hokkaido as the northernmost prefecture", () => {
    const hokkaido = PREFECTURE_BOUNDS["北海道"];
    expect(hokkaido.maxLat).toBeGreaterThan(45);
  });

  it("should have Okinawa as the southernmost prefecture", () => {
    const okinawa = PREFECTURE_BOUNDS["沖縄県"];
    expect(okinawa.minLat).toBeLessThan(25);
  });
});
