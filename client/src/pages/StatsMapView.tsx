import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { MapView } from "@/components/Map";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, BarChart3 } from "lucide-react";
import { useLocation } from "wouter";

interface PrefectureStats {
  prefecture: string;
  count: number;
  percentage: number;
}

export default function StatsMapView() {
  const [, navigate] = useLocation();
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedPrefecture, setSelectedPrefecture] = useState<string | null>(null);
  const [prefectureMarkers, setPrefectureMarkers] = useState<Map<string, google.maps.Marker>>(new Map());

  // Fetch prefecture statistics
  const { data: prefectureStats, isLoading } = trpc.stats.prefectureStats.useQuery();

  // Prefecture coordinates (approximate center of each prefecture)
  const prefectureCoordinates: Record<string, { lat: number; lng: number }> = {
    "北海道": { lat: 43.2, lng: 142.8 },
    "青森県": { lat: 40.8, lng: 140.7 },
    "岩手県": { lat: 39.6, lng: 141.3 },
    "宮城県": { lat: 38.3, lng: 140.8 },
    "秋田県": { lat: 39.7, lng: 140.1 },
    "山形県": { lat: 38.2, lng: 140.3 },
    "福島県": { lat: 37.4, lng: 140.4 },
    "茨城県": { lat: 36.3, lng: 140.4 },
    "栃木県": { lat: 36.6, lng: 139.9 },
    "群馬県": { lat: 36.4, lng: 138.2 },
    "埼玉県": { lat: 35.8, lng: 139.6 },
    "東京都": { lat: 35.7, lng: 139.7 },
    "神奈川県": { lat: 35.4, lng: 139.6 },
    "新潟県": { lat: 37.9, lng: 138.6 },
    "富山県": { lat: 36.7, lng: 137.2 },
    "石川県": { lat: 36.6, lng: 136.6 },
    "福井県": { lat: 36.1, lng: 136.2 },
    "山梨県": { lat: 35.7, lng: 138.6 },
    "長野県": { lat: 36.7, lng: 137.9 },
    "岐阜県": { lat: 36.2, lng: 137.3 },
    "静岡県": { lat: 34.8, lng: 138.4 },
    "愛知県": { lat: 35.1, lng: 136.9 },
    "三重県": { lat: 34.7, lng: 136.5 },
    "滋賀県": { lat: 35.0, lng: 136.2 },
    "京都府": { lat: 35.0, lng: 135.8 },
    "大阪府": { lat: 34.7, lng: 135.5 },
    "兵庫県": { lat: 34.8, lng: 135.2 },
    "奈良県": { lat: 34.3, lng: 135.8 },
    "和歌山県": { lat: 33.7, lng: 135.9 },
    "鳥取県": { lat: 35.3, lng: 133.9 },
    "島根県": { lat: 35.5, lng: 133.1 },
    "岡山県": { lat: 34.7, lng: 133.9 },
    "広島県": { lat: 34.4, lng: 132.5 },
    "山口県": { lat: 34.2, lng: 131.5 },
    "徳島県": { lat: 33.9, lng: 134.6 },
    "高知県": { lat: 33.6, lng: 133.3 },
  };

  const handleMapReady = (mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  };

  // Add markers for each prefecture when stats are loaded
  useEffect(() => {
    if (!map || !prefectureStats || prefectureStats.length === 0) return;

    // Clear existing markers
    prefectureMarkers.forEach((marker) => marker.setMap(null));
    const newMarkers = new Map<string, google.maps.Marker>();

    // Find max count for color scaling
    const maxCount = Math.max(...prefectureStats.map((s) => s.count), 1);

    prefectureStats.forEach((stat) => {
      const coords = prefectureCoordinates[stat.prefecture];
      if (!coords) return;

      // Color intensity based on count
      const intensity = stat.count / maxCount;
      const hue = 0; // Red
      const saturation = Math.round(intensity * 100);
      const lightness = Math.round(100 - intensity * 50);
      const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

      const marker = new google.maps.Marker({
        position: coords,
        map,
        title: `${stat.prefecture}: ${stat.count}件`,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: Math.max(8, Math.min(20, 8 + (stat.count / maxCount) * 12)),
          fillColor: color,
          fillOpacity: 0.8,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });

      // Add click listener to show details
      marker.addListener("click", () => {
        setSelectedPrefecture(stat.prefecture);
        map.setCenter(coords);
        map.setZoom(8);
      });

      newMarkers.set(stat.prefecture, marker);
    });

    setPrefectureMarkers(newMarkers);
  }, [map, prefectureStats]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Button variant="outline" onClick={() => navigate("/")}>
              ← マップに戻る
            </Button>
          </div>

          <Card className="p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-gradient-to-br from-orange-500 to-red-600 p-2 rounded-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">都道府県別クマ出没統計</h1>
                <p className="text-sm text-gray-600">マーカーのサイズは出没件数を表します</p>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Map */}
            <div className="lg:col-span-3">
              <Card className="h-[600px] overflow-hidden">
                <MapView
                  onMapReady={handleMapReady}
                  initialCenter={{ lat: 36.5, lng: 138.0 }}
                  initialZoom={5}
                />
              </Card>
            </div>

            {/* Statistics Sidebar */}
            <div className="lg:col-span-1">
              <Card className="p-4 h-[600px] overflow-y-auto">
                <h2 className="text-lg font-bold mb-4">出没件数ランキング</h2>
                <div className="space-y-2">
                  {prefectureStats?.map((stat, index) => (
                    <div
                      key={stat.prefecture}
                      onClick={() => {
                        setSelectedPrefecture(stat.prefecture);
                        const coords = prefectureCoordinates[stat.prefecture];
                        if (map && coords) {
                          map.setCenter(coords);
                          map.setZoom(8);
                        }
                      }}
                      className={`p-3 rounded-lg cursor-pointer transition-all ${
                        selectedPrefecture === stat.prefecture
                          ? "bg-orange-100 border-2 border-orange-600"
                          : "bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-sm">{index + 1}. {stat.prefecture}</div>
                          <div className="text-xs text-gray-600">{stat.count}件</div>
                        </div>
                        <div className="text-xs font-bold text-orange-600">{stat.percentage}%</div>
                      </div>
                      <div className="mt-2 bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-orange-600 h-full"
                          style={{ width: `${stat.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
