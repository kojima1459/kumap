/**
 * Bear marker utility for Google Maps
 * Handles marker creation and info window content
 */

export interface BearSighting {
  id: number;
  prefecture: string;
  city?: string | null;
  location?: string | null;
  latitude: string;
  longitude: string;
  sightedAt: Date;
  sourceType: "official" | "user";
  bearType?: string | null;
  description?: string | null;
  sourceUrl?: string | null;
  createdAt: Date;
}

/**
 * Create a marker for a bear sighting
 */
export function createBearMarker(
  sighting: BearSighting,
  map: google.maps.Map,
  infoWindow: google.maps.InfoWindow
): google.maps.Marker | null {
  const lat = parseFloat(sighting.latitude);
  const lng = parseFloat(sighting.longitude);

  if (isNaN(lat) || isNaN(lng)) {
    console.warn(`[BearMarker] Invalid coordinates for sighting ${sighting.id}`);
    return null;
  }

  const marker = new google.maps.Marker({
    position: { lat, lng },
    map,
    title: `${sighting.prefecture} - ${sighting.location || "詳細不明"}`,
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 8,
      fillColor: sighting.sourceType === "official" ? "#ef4444" : "#f97316",
      fillOpacity: 0.8,
      strokeColor: "#ffffff",
      strokeWeight: 2,
    },
  });

  marker.addListener("click", () => {
    const content = generateInfoWindowContent(sighting);
    infoWindow.setContent(content);
    infoWindow.open(map, marker);
  });

  return marker;
}

/**
 * Generate HTML content for info window
 */
function generateInfoWindowContent(sighting: BearSighting): string {
  const sightedDate = new Date(sighting.sightedAt);
  const createdDate = new Date(sighting.createdAt);
  const now = new Date();
  const daysAgo = Math.floor((now.getTime() - sightedDate.getTime()) / (1000 * 60 * 60 * 24));
  const timeAgoText = daysAgo === 0 ? "今日" : daysAgo === 1 ? "昨日" : `${daysAgo}日前`;

  const isOfficial = sighting.sourceType === "official";
  const color = isOfficial ? "#ef4444" : "#f97316";
  const icon = isOfficial ? "🏛️" : "👤";
  const label = isOfficial ? "公式情報" : "ユーザー投稿";

  return `
    <div style="padding: 8px; max-width: 300px;">
      <h3 style="font-weight: bold; margin-bottom: 8px; color: ${color};">
        ${icon} ${label}
      </h3>
      <p style="margin-bottom: 4px;"><strong>場所:</strong> ${sighting.prefecture} ${sighting.city || ""}</p>
      <p style="margin-bottom: 4px;"><strong>詳細:</strong> ${sighting.location || "詳細不明"}</p>
      <p style="margin-bottom: 4px;"><strong>目撃日時:</strong> ${sightedDate.toLocaleString("ja-JP")} (${timeAgoText})</p>
      ${isOfficial ? `<p style="margin-bottom: 4px; font-size: 12px; color: #666;"><strong>情報取得日:</strong> ${createdDate.toLocaleString("ja-JP")}</p>` : ""}
      ${sighting.bearType ? `<p style="margin-bottom: 4px;"><strong>クマの種類:</strong> ${sighting.bearType}</p>` : ""}
      ${sighting.description ? `<p style="margin-bottom: 4px;"><strong>詳細情報:</strong> ${sighting.description}</p>` : ""}
      ${sighting.sourceUrl ? `<p style="margin-top: 8px;"><a href="${sighting.sourceUrl}" target="_blank" rel="noopener noreferrer" style="color: ${color}; text-decoration: underline;">情報源を確認</a></p>` : ""}
    </div>
  `;
}

/**
 * Calculate time ago text from date
 */
export function getTimeAgoText(date: Date): string {
  const now = new Date();
  const daysAgo = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysAgo === 0) return "今日";
  if (daysAgo === 1) return "昨日";
  if (daysAgo < 7) return `${daysAgo}日前`;
  if (daysAgo < 30) return `${Math.floor(daysAgo / 7)}週間前`;
  if (daysAgo < 365) return `${Math.floor(daysAgo / 30)}ヶ月前`;
  return `${Math.floor(daysAgo / 365)}年前`;
}
