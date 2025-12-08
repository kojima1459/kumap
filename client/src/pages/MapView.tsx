import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { MapView as GoogleMapView } from "@/components/Map";
import { PREFECTURE_MAP_URLS } from "../../../server/prefectureUrlMapping";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, Plus, Settings, Bell, BarChart3, MapPin, Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import Footer from "@/components/Footer";
import { MapFilter, type DateRange } from "@/components/MapFilter";
import { createBearMarker, type BearSighting } from "@/components/BearMarker";

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

    // Add new markers using the BearMarker component
    sightings.forEach((sighting) => {
      const marker = createBearMarker(sighting as BearSighting, map, infoWindow);
      if (marker) {
        markersRef.current.push(marker);
      }
    });

    // Fit bounds to show all markers
    if (markersRef.current.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      markersRef.current.forEach(marker => {
        const position = marker.getPosition();
        if (position) bounds.extend(position);
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
              <img src="/logo.png" alt="クマップロゴ" className="w-12 h-12" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">クマップ</h1>
                <p className="text-sm text-gray-600">Kumap - Bear Sighting Information Map</p>
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
                  <Link href="/stats">
                    <Button variant="outline">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      統計
                    </Button>
                  </Link>
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
      <Footer />
    </div>
  );
}
