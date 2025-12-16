import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { PREFECTURE_MAP_URLS } from "../../../server/prefectureUrlMapping";
import { MapView } from "@/components/Map";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, BarChart3, ChevronDown, ChevronUp, MapPin, ExternalLink } from "lucide-react";
import { useLocation } from "wouter";
import Footer from "@/components/Footer";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

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
  const [showRankingSheet, setShowRankingSheet] = useState(false);

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

  const handlePrefectureClick = (prefecture: string) => {
    setSelectedPrefecture(prefecture);
    const coords = prefectureCoordinates[prefecture];
    if (map && coords) {
      map.setCenter(coords);
      map.setZoom(8);
    }
    setShowRankingSheet(false);
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
          scale: Math.max(10, Math.min(24, 10 + (stat.count / maxCount) * 14)),
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

  // Ranking item component (shared between desktop and mobile)
  const RankingItem = ({ stat, index }: { stat: PrefectureStats; index: number }) => (
    <div
      onClick={() => handlePrefectureClick(stat.prefecture)}
      className={`p-3 rounded-lg cursor-pointer transition-all ${
        selectedPrefecture === stat.prefecture
          ? "bg-orange-100 border-2 border-orange-600"
          : "bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
            index < 3 ? "bg-orange-600 text-white" : "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
          }`}>
            {index + 1}
          </span>
          <div>
            <div className="font-semibold text-sm">{stat.prefecture}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">{stat.count}件</div>
          </div>
        </div>
        <div className="text-sm font-bold text-orange-600">{stat.percentage}%</div>
      </div>
      <div className="mt-2 bg-gray-200 dark:bg-gray-600 rounded-full h-2 overflow-hidden">
        <div
          className="bg-gradient-to-r from-orange-500 to-red-600 h-full transition-all"
          style={{ width: `${stat.percentage}%` }}
        />
      </div>
      {PREFECTURE_MAP_URLS[stat.prefecture] && (
        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
          <a
            href={PREFECTURE_MAP_URLS[stat.prefecture]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-3 w-3" />
            公式マップを開く
          </a>
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  const totalCount = prefectureStats?.reduce((sum, s) => sum + s.count, 0) || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-4 sm:mb-6 flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => navigate("/")}>
              ← マップに戻る
            </Button>
          </div>

          {/* Title Card */}
          <Card className="p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="bg-gradient-to-br from-orange-500 to-red-600 p-2 rounded-lg w-fit">
                <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">都道府県別クマ出没統計</h1>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">マーカーのサイズは出没件数を表します</p>
              </div>
              <div className="text-right">
                <div className="text-2xl sm:text-3xl font-bold text-orange-600">{totalCount.toLocaleString()}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">総出没件数</div>
              </div>
            </div>
          </Card>

          {/* Mobile: Top 3 Summary */}
          <div className="lg:hidden mb-4">
            <Card className="p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">出没件数TOP3</h3>
                <Sheet open={showRankingSheet} onOpenChange={setShowRankingSheet}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs">
                      全ランキング
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="h-[70vh] rounded-t-xl">
                    <SheetHeader className="pb-4">
                      <SheetTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-orange-600" />
                        出没件数ランキング
                      </SheetTitle>
                    </SheetHeader>
                    <div className="overflow-y-auto h-[calc(70vh-80px)] space-y-2 pr-2">
                      {prefectureStats?.map((stat, index) => (
                        <RankingItem key={stat.prefecture} stat={stat} index={index} />
                      ))}
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {prefectureStats?.slice(0, 3).map((stat, index) => (
                  <div
                    key={stat.prefecture}
                    onClick={() => handlePrefectureClick(stat.prefecture)}
                    className={`p-2 rounded-lg cursor-pointer text-center transition-all ${
                      selectedPrefecture === stat.prefecture
                        ? "bg-orange-100 border-2 border-orange-600"
                        : "bg-gray-50 dark:bg-gray-800"
                    }`}
                  >
                    <div className={`text-xs font-bold w-5 h-5 mx-auto mb-1 flex items-center justify-center rounded-full ${
                      index === 0 ? "bg-yellow-500 text-white" :
                      index === 1 ? "bg-gray-400 text-white" :
                      "bg-orange-400 text-white"
                    }`}>
                      {index + 1}
                    </div>
                    <div className="text-xs font-semibold truncate">{stat.prefecture.replace(/県|府|都/, "")}</div>
                    <div className="text-sm font-bold text-orange-600">{stat.count}件</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Map */}
            <div className="lg:col-span-3">
              <Card className="h-[50vh] sm:h-[600px] overflow-hidden">
                <MapView
                  onMapReady={handleMapReady}
                  initialCenter={{ lat: 36.5, lng: 138.0 }}
                  initialZoom={5}
                />
              </Card>
            </div>

            {/* Statistics Sidebar - Desktop Only */}
            <div className="hidden lg:block lg:col-span-1">
              <Card className="p-4 h-[600px] overflow-y-auto">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-orange-600" />
                  出没件数ランキング
                </h2>
                <div className="space-y-2">
                  {prefectureStats?.map((stat, index) => (
                    <RankingItem key={stat.prefecture} stat={stat} index={index} />
                  ))}
                </div>
              </Card>
            </div>
          </div>

          {/* Mobile: Selected Prefecture Details */}
          {selectedPrefecture && (
            <div className="lg:hidden mt-4">
              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-gray-900 dark:text-gray-100">{selectedPrefecture}</h3>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedPrefecture(null)}>
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                </div>
                {prefectureStats?.find(s => s.prefecture === selectedPrefecture) && (
                  <div>
                    <div className="flex items-center gap-4 mb-2">
                      <div>
                        <div className="text-2xl font-bold text-orange-600">
                          {prefectureStats.find(s => s.prefecture === selectedPrefecture)?.count}件
                        </div>
                        <div className="text-xs text-gray-500">出没件数</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                          {prefectureStats.find(s => s.prefecture === selectedPrefecture)?.percentage}%
                        </div>
                        <div className="text-xs text-gray-500">全体比率</div>
                      </div>
                    </div>
                    {PREFECTURE_MAP_URLS[selectedPrefecture] && (
                      <a
                        href={PREFECTURE_MAP_URLS[selectedPrefecture]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink className="h-4 w-4" />
                        公式マップを開く
                      </a>
                    )}
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
