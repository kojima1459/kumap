/**
 * Geolocation utilities for GPS-based danger assessment
 * All calculations are performed client-side for privacy protection
 */

// Earth's radius in kilometers
const EARTH_RADIUS_KM = 6371;

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param lat1 - Latitude of point 1
 * @param lon1 - Longitude of point 1
 * @param lat2 - Latitude of point 2
 * @param lon2 - Longitude of point 2
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Prefecture boundary data for reverse geocoding
 * Approximate bounding boxes for each prefecture
 */
export const PREFECTURE_BOUNDS: Record<
  string,
  { minLat: number; maxLat: number; minLon: number; maxLon: number; center: { lat: number; lon: number } }
> = {
  "北海道": { minLat: 41.3, maxLat: 45.5, minLon: 139.3, maxLon: 145.8, center: { lat: 43.064, lon: 141.347 } },
  "青森県": { minLat: 40.2, maxLat: 41.5, minLon: 139.5, maxLon: 141.7, center: { lat: 40.824, lon: 140.740 } },
  "岩手県": { minLat: 38.7, maxLat: 40.5, minLon: 140.6, maxLon: 142.1, center: { lat: 39.704, lon: 141.153 } },
  "宮城県": { minLat: 37.8, maxLat: 39.0, minLon: 140.3, maxLon: 141.7, center: { lat: 38.269, lon: 140.872 } },
  "秋田県": { minLat: 39.0, maxLat: 40.5, minLon: 139.7, maxLon: 140.9, center: { lat: 39.720, lon: 140.103 } },
  "山形県": { minLat: 37.7, maxLat: 39.2, minLon: 139.5, maxLon: 140.6, center: { lat: 38.240, lon: 140.364 } },
  "福島県": { minLat: 36.8, maxLat: 37.9, minLon: 139.2, maxLon: 141.0, center: { lat: 37.750, lon: 140.468 } },
  "茨城県": { minLat: 35.7, maxLat: 36.9, minLon: 139.7, maxLon: 140.9, center: { lat: 36.342, lon: 140.447 } },
  "栃木県": { minLat: 36.2, maxLat: 37.2, minLon: 139.3, maxLon: 140.3, center: { lat: 36.566, lon: 139.884 } },
  "群馬県": { minLat: 36.0, maxLat: 37.1, minLon: 138.4, maxLon: 139.7, center: { lat: 36.391, lon: 139.061 } },
  "埼玉県": { minLat: 35.7, maxLat: 36.3, minLon: 138.7, maxLon: 139.9, center: { lat: 35.857, lon: 139.649 } },
  "千葉県": { minLat: 34.9, maxLat: 36.1, minLon: 139.7, maxLon: 140.9, center: { lat: 35.605, lon: 140.123 } },
  "東京都": { minLat: 35.5, maxLat: 35.9, minLon: 138.9, maxLon: 139.9, center: { lat: 35.689, lon: 139.692 } },
  "神奈川県": { minLat: 35.1, maxLat: 35.7, minLon: 138.9, maxLon: 139.8, center: { lat: 35.448, lon: 139.642 } },
  "新潟県": { minLat: 36.7, maxLat: 38.5, minLon: 137.8, maxLon: 140.0, center: { lat: 37.902, lon: 139.024 } },
  "富山県": { minLat: 36.3, maxLat: 36.9, minLon: 136.8, maxLon: 137.8, center: { lat: 36.695, lon: 137.211 } },
  "石川県": { minLat: 36.1, maxLat: 37.9, minLon: 136.2, maxLon: 137.4, center: { lat: 36.594, lon: 136.626 } },
  "福井県": { minLat: 35.4, maxLat: 36.3, minLon: 135.5, maxLon: 136.8, center: { lat: 36.065, lon: 136.222 } },
  "山梨県": { minLat: 35.2, maxLat: 35.9, minLon: 138.2, maxLon: 139.2, center: { lat: 35.664, lon: 138.568 } },
  "長野県": { minLat: 35.2, maxLat: 37.0, minLon: 137.3, maxLon: 138.8, center: { lat: 36.651, lon: 138.181 } },
  "岐阜県": { minLat: 35.1, maxLat: 36.5, minLon: 136.3, maxLon: 137.7, center: { lat: 35.391, lon: 136.722 } },
  "静岡県": { minLat: 34.6, maxLat: 35.6, minLon: 137.5, maxLon: 139.2, center: { lat: 34.977, lon: 138.383 } },
  "愛知県": { minLat: 34.6, maxLat: 35.4, minLon: 136.7, maxLon: 137.8, center: { lat: 35.180, lon: 136.907 } },
  "三重県": { minLat: 33.7, maxLat: 35.2, minLon: 135.9, maxLon: 136.9, center: { lat: 34.730, lon: 136.509 } },
  "滋賀県": { minLat: 34.8, maxLat: 35.7, minLon: 135.8, maxLon: 136.5, center: { lat: 35.005, lon: 135.869 } },
  "京都府": { minLat: 34.7, maxLat: 35.8, minLon: 134.9, maxLon: 136.1, center: { lat: 35.021, lon: 135.756 } },
  "大阪府": { minLat: 34.3, maxLat: 35.0, minLon: 135.1, maxLon: 135.8, center: { lat: 34.686, lon: 135.520 } },
  "兵庫県": { minLat: 34.2, maxLat: 35.7, minLon: 134.3, maxLon: 135.5, center: { lat: 34.691, lon: 135.183 } },
  "奈良県": { minLat: 33.9, maxLat: 34.8, minLon: 135.6, maxLon: 136.2, center: { lat: 34.685, lon: 135.833 } },
  "和歌山県": { minLat: 33.4, maxLat: 34.4, minLon: 135.1, maxLon: 136.0, center: { lat: 34.226, lon: 135.168 } },
  "鳥取県": { minLat: 35.1, maxLat: 35.6, minLon: 133.2, maxLon: 134.5, center: { lat: 35.504, lon: 134.238 } },
  "島根県": { minLat: 34.3, maxLat: 35.6, minLon: 131.7, maxLon: 133.4, center: { lat: 35.472, lon: 133.051 } },
  "岡山県": { minLat: 34.4, maxLat: 35.3, minLon: 133.4, maxLon: 134.4, center: { lat: 34.662, lon: 133.935 } },
  "広島県": { minLat: 34.0, maxLat: 35.0, minLon: 132.0, maxLon: 133.4, center: { lat: 34.397, lon: 132.460 } },
  "山口県": { minLat: 33.7, maxLat: 34.8, minLon: 130.8, maxLon: 132.2, center: { lat: 34.186, lon: 131.471 } },
  "徳島県": { minLat: 33.5, maxLat: 34.3, minLon: 133.6, maxLon: 134.8, center: { lat: 34.066, lon: 134.559 } },
  "香川県": { minLat: 34.1, maxLat: 34.5, minLon: 133.6, maxLon: 134.5, center: { lat: 34.340, lon: 134.043 } },
  "愛媛県": { minLat: 32.9, maxLat: 34.1, minLon: 132.0, maxLon: 133.7, center: { lat: 33.842, lon: 132.766 } },
  "高知県": { minLat: 32.7, maxLat: 33.9, minLon: 132.5, maxLon: 134.3, center: { lat: 33.560, lon: 133.531 } },
  "福岡県": { minLat: 33.0, maxLat: 34.0, minLon: 130.0, maxLon: 131.2, center: { lat: 33.606, lon: 130.418 } },
  "佐賀県": { minLat: 33.0, maxLat: 33.6, minLon: 129.7, maxLon: 130.5, center: { lat: 33.249, lon: 130.300 } },
  "長崎県": { minLat: 32.5, maxLat: 34.7, minLon: 128.6, maxLon: 130.4, center: { lat: 32.745, lon: 129.874 } },
  "熊本県": { minLat: 32.0, maxLat: 33.2, minLon: 130.1, maxLon: 131.3, center: { lat: 32.790, lon: 130.742 } },
  "大分県": { minLat: 32.7, maxLat: 33.7, minLon: 130.8, maxLon: 132.1, center: { lat: 33.238, lon: 131.613 } },
  "宮崎県": { minLat: 31.4, maxLat: 32.8, minLon: 130.7, maxLon: 131.9, center: { lat: 31.911, lon: 131.424 } },
  "鹿児島県": { minLat: 27.0, maxLat: 32.3, minLon: 128.4, maxLon: 131.2, center: { lat: 31.560, lon: 130.558 } },
  "沖縄県": { minLat: 24.0, maxLat: 27.9, minLon: 122.9, maxLon: 131.3, center: { lat: 26.212, lon: 127.681 } },
};

/**
 * Reverse geocode coordinates to prefecture name (client-side)
 * Uses bounding box matching for privacy (no server call)
 * @param lat - Latitude
 * @param lon - Longitude
 * @returns Prefecture name or null if not in Japan
 */
export function getPrefectureFromCoordinates(lat: number, lon: number): string | null {
  // First, check if coordinates are within Japan bounds
  if (lat < 24 || lat > 46 || lon < 122 || lon > 154) {
    return null;
  }

  // Find matching prefecture by bounding box
  let closestPrefecture: string | null = null;
  let minDistance = Infinity;

  for (const [prefecture, bounds] of Object.entries(PREFECTURE_BOUNDS)) {
    // Check if point is within bounding box
    if (
      lat >= bounds.minLat &&
      lat <= bounds.maxLat &&
      lon >= bounds.minLon &&
      lon <= bounds.maxLon
    ) {
      // Calculate distance to center for tie-breaking
      const distance = calculateDistance(lat, lon, bounds.center.lat, bounds.center.lon);
      if (distance < minDistance) {
        minDistance = distance;
        closestPrefecture = prefecture;
      }
    }
  }

  // If no bounding box match, find nearest prefecture center
  if (!closestPrefecture) {
    for (const [prefecture, bounds] of Object.entries(PREFECTURE_BOUNDS)) {
      const distance = calculateDistance(lat, lon, bounds.center.lat, bounds.center.lon);
      if (distance < minDistance) {
        minDistance = distance;
        closestPrefecture = prefecture;
      }
    }
  }

  return closestPrefecture;
}

/**
 * Filter sightings within a radius from a point
 * @param sightings - Array of sightings with latitude/longitude
 * @param centerLat - Center latitude
 * @param centerLon - Center longitude
 * @param radiusKm - Radius in kilometers
 * @returns Filtered sightings within radius
 */
export function filterSightingsWithinRadius<
  T extends { latitude: string | number; longitude: string | number }
>(sightings: T[], centerLat: number, centerLon: number, radiusKm: number): T[] {
  return sightings.filter((sighting) => {
    const lat = typeof sighting.latitude === "string" ? parseFloat(sighting.latitude) : sighting.latitude;
    const lon = typeof sighting.longitude === "string" ? parseFloat(sighting.longitude) : sighting.longitude;

    if (isNaN(lat) || isNaN(lon)) return false;

    const distance = calculateDistance(centerLat, centerLon, lat, lon);
    return distance <= radiusKm;
  });
}

/**
 * Calculate danger level based on sighting count and recency
 * @param sightingsWithinRadius - Number of sightings within radius
 * @param recentSightings - Number of sightings in last 7 days
 * @returns Danger level: 'low' | 'medium' | 'high' | 'critical'
 */
export function calculateDangerLevel(
  sightingsWithinRadius: number,
  recentSightings: number
): "low" | "medium" | "high" | "critical" {
  // Critical: 5+ sightings in last 7 days within radius
  if (recentSightings >= 5) return "critical";

  // High: 3+ recent sightings or 10+ total
  if (recentSightings >= 3 || sightingsWithinRadius >= 10) return "high";

  // Medium: 1+ recent sightings or 3+ total
  if (recentSightings >= 1 || sightingsWithinRadius >= 3) return "medium";

  // Low: no recent sightings and few total
  return "low";
}

/**
 * Get danger level display info
 */
export function getDangerLevelInfo(level: "low" | "medium" | "high" | "critical"): {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
  message: string;
} {
  switch (level) {
    case "critical":
      return {
        label: "非常に危険",
        color: "text-red-600",
        bgColor: "bg-red-100 dark:bg-red-900/30",
        icon: "🔴",
        message: "この地域では最近クマの出没が多発しています。外出を控えてください。",
      };
    case "high":
      return {
        label: "注意が必要",
        color: "text-orange-600",
        bgColor: "bg-orange-100 dark:bg-orange-900/30",
        icon: "🟠",
        message: "この地域ではクマの出没が報告されています。十分注意してください。",
      };
    case "medium":
      return {
        label: "やや注意",
        color: "text-yellow-600",
        bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
        icon: "🟡",
        message: "この地域でクマの出没報告があります。クマよけ対策をお勧めします。",
      };
    case "low":
      return {
        label: "比較的安全",
        color: "text-green-600",
        bgColor: "bg-green-100 dark:bg-green-900/30",
        icon: "🟢",
        message: "最近のクマ出没報告は少ないですが、山間部では常に注意が必要です。",
      };
  }
}
