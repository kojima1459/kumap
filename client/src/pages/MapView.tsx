import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { MapView as GoogleMapView } from "@/components/Map";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, AlertTriangle, Plus, Settings, Calendar, Bell } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PREFECTURES = [
  "全国",
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県",
  "岐阜県", "静岡県", "愛知県", "三重県",
  "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県",
  "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "高知県"
];

type DateRange = "all" | "week" | "month" | "3months";

export default function MapView() {
  const { user } = useAuth();
  const [selectedPrefecture, setSelectedPrefecture] = useState<string>("全国");
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [infoWindow, setInfoWindow] = useState<google.maps.InfoWindow | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  // Calculate date range
  const getStartDate = (range: DateRange): Date | undefined => {
    if (range === "all") return undefined;
    const now = new Date();
    const daysAgo = range === "week" ? 7 : range === "month" ? 30 : 90;
    return new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  };

  // Fetch bear sightings with filters
  const { data: sightings, isLoading } = trpc.bearSightings.list.useQuery({
    prefecture: selectedPrefecture === "全国" ? undefined : selectedPrefecture,
    startDate: getStartDate(dateRange),
  });

  // Initialize map
  const handleMapReady = (mapInstance: google.maps.Map) => {
    setMap(mapInstance);
    setInfoWindow(new google.maps.InfoWindow());
  };

  // Update markers when sightings or map changes
  useEffect(() => {
    if (!map || !sightings || !infoWindow) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add new markers
    sightings.forEach((sighting) => {
      const lat = parseFloat(sighting.latitude);
      const lng = parseFloat(sighting.longitude);

      if (isNaN(lat) || isNaN(lng)) return;

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
        const sightedDate = new Date(sighting.sightedAt);
        const createdDate = new Date(sighting.createdAt);
        const now = new Date();
        const daysAgo = Math.floor((now.getTime() - sightedDate.getTime()) / (1000 * 60 * 60 * 24));
        const timeAgoText = daysAgo === 0 ? "今日" : daysAgo === 1 ? "昨日" : `${daysAgo}日前`;

        const content = `
          <div style="padding: 8px; max-width: 300px;">
            <h3 style="font-weight: bold; margin-bottom: 8px; color: ${
              sighting.sourceType === "official" ? "#ef4444" : "#f97316"
            };">
              ${sighting.sourceType === "official" ? "🏛️ 公式情報" : "👤 ユーザー投稿"}
            </h3>
            <p style="margin-bottom: 4px;"><strong>場所:</strong> ${sighting.prefecture} ${sighting.city || ""}</p>
            <p style="margin-bottom: 4px;"><strong>詳細:</strong> ${sighting.location || "詳細不明"}</p>
            <p style="margin-bottom: 4px;"><strong>目撃日時:</strong> ${sightedDate.toLocaleString("ja-JP")} (${timeAgoText})</p>
            ${sighting.sourceType === "official" ? `<p style="margin-bottom: 4px; font-size: 12px; color: #666;"><strong>情報取得日:</strong> ${createdDate.toLocaleString("ja-JP")}</p>` : ""}
            ${sighting.bearType ? `<p style="margin-bottom: 4px;"><strong>クマの種類:</strong> ${sighting.bearType}</p>` : ""}
            ${sighting.description ? `<p style="margin-bottom: 4px;"><strong>説明:</strong> ${sighting.description}</p>` : ""}
            ${sighting.sourceUrl ? `<p style="margin-top: 8px;"><a href="${sighting.sourceUrl}" target="_blank" style="color: #3b82f6;">情報源を見る →</a></p>` : ""}
          </div>
        `;
        infoWindow.setContent(content);
        infoWindow.open(map, marker);
      });

      markersRef.current.push(marker);
    });

    // Fit bounds to show all markers
    if (sightings.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      sightings.forEach((sighting) => {
        const lat = parseFloat(sighting.latitude);
        const lng = parseFloat(sighting.longitude);
        if (!isNaN(lat) && !isNaN(lng)) {
          bounds.extend({ lat, lng });
        }
      });
      map.fitBounds(bounds);
    }
  }, [map, sightings, infoWindow]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-amber-50 to-orange-50">
      {/* Header */}
      <header className="bg-white border-b border-orange-200 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-orange-500 to-red-600 p-2 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">クマ出没情報マップ</h1>
                <p className="text-sm text-gray-600">Bear Sighting Information Map</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-sm text-gray-700">公式情報</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span className="text-sm text-gray-700">ユーザー投稿</span>
              </div>
              <Link href="/submit">
                <Button className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700">
                  <Plus className="w-4 h-4 mr-2" />
                  目撃情報を投稿
                </Button>
              </Link>
              {user && (
                <>
                  <Link href="/notifications">
                    <Button variant="outline">
                      <Bell className="w-4 h-4 mr-2" />
                      通知設定
                    </Button>
                  </Link>
                  <Link href="/admin/scraper">
                    <Button variant="outline">
                      <Settings className="w-4 h-4 mr-2" />
                      管理
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Controls */}
      <div className="container mx-auto px-4 py-4">
        <Card className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-orange-600" />
              <span className="font-medium text-gray-700">地域:</span>
            </div>
            <Select value={selectedPrefecture} onValueChange={setSelectedPrefecture}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PREFECTURES.map((pref) => (
                  <SelectItem key={pref} value={pref}>
                    {pref}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-600" />
              <span className="font-medium text-gray-700">期間:</span>
            </div>
            <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全期間</SelectItem>
                <SelectItem value="week">過去1週間</SelectItem>
                <SelectItem value="month">過去1ヶ月</SelectItem>
                <SelectItem value="3months">過去3ヶ月</SelectItem>
              </SelectContent>
            </Select>

            {isLoading && (
              <div className="flex items-center gap-2 text-gray-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">読み込み中...</span>
              </div>
            )}
            {!isLoading && sightings && (
              <span className="text-sm text-gray-600">
                {sightings.length}件の出没情報
              </span>
            )}
          </div>
        </Card>
      </div>

      {/* Map */}
      <div className="flex-1 container mx-auto px-4 pb-4">
        <Card className="h-full overflow-hidden">
          <GoogleMapView
            onMapReady={handleMapReady}
            initialCenter={{ lat: 36.5, lng: 138.0 }}
            initialZoom={6}
          />
        </Card>
      </div>
    </div>
  );
}
