import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { MapView as GoogleMapView } from "@/components/Map";
import { PREFECTURE_MAP_URLS } from "../../../server/prefectureUrlMapping";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, Plus, Settings, Bell, BarChart3, MapPin, Calendar, Flame, Map as MapIcon, Info, Menu, X, Shield, Phone } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import Footer from "@/components/Footer";
import { MapFilter, type DateRange, type CustomDateRange } from "@/components/MapFilter";
import { createBearMarker, type BearSighting } from "@/components/BearMarker";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SeasonalWarningBanner } from "@/components/SeasonalWarningBanner";
import { NearbyDangerIndicator } from "@/components/NearbyDangerIndicator";

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
  const [selectedPrefectures, setSelectedPrefectures] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [customDateRange, setCustomDateRange] = useState<CustomDateRange>({ from: undefined, to: undefined });
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [infoWindow, setInfoWindow] = useState<google.maps.InfoWindow | null>(null);
  const [markers, setMarkers] = useState<{[key: string]: google.maps.Marker}>({});
  const [showHeatmap, setShowHeatmap] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const heatmapRef = useRef<google.maps.visualization.HeatmapLayer | null>(null);

  // Calculate date range
  const getDateRange = (): { startDate?: Date; endDate?: Date } => {
    if (dateRange === "all") return {};
    if (dateRange === "custom") {
      return {
        startDate: customDateRange.from,
        endDate: customDateRange.to,
      };
    }
    const now = new Date();
    const daysAgo = dateRange === "week" ? 7 : dateRange === "month" ? 30 : 90;
    return { startDate: new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000) };
  };

  // Fetch bear sightings with filters
  const { startDate, endDate } = getDateRange();
  const { data: sightings, isLoading } = trpc.bearSightings.list.useQuery({
    prefecture: selectedPrefectures.length === 0 ? undefined : selectedPrefectures.length === 1 ? selectedPrefectures[0] : undefined,
    prefectures: selectedPrefectures.length > 1 ? selectedPrefectures : undefined,
    startDate,
    endDate,
  });

  // Initialize map
  const handleMapReady = (mapInstance: google.maps.Map) => {
    setMap(mapInstance);
    setInfoWindow(new google.maps.InfoWindow());
  };

  // Initialize MarkerClusterer
  const clusterer = useMemo(() => {
    if (!map) return null;

    // Create custom renderer for cluster icons
    const renderer = {
      render: ({ count, position }: { count: number; position: google.maps.LatLng }) => {
        // Determine cluster color based on count
        const color = count > 50 ? "#dc2626" : count > 20 ? "#f97316" : "#fb923c";
        
        return new google.maps.Marker({
          position,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: Math.min(count / 2 + 15, 40), // Scale based on count, max 40
            fillColor: color,
            fillOpacity: 0.8,
            strokeColor: "#ffffff",
            strokeWeight: 3,
          },
          label: {
            text: String(count),
            color: "#ffffff",
            fontSize: "14px",
            fontWeight: "bold",
          },
          zIndex: Number(google.maps.Marker.MAX_ZINDEX) + count,
        });
      },
    };

    const newClusterer = new MarkerClusterer({
      map,
      renderer,
    });

    clustererRef.current = newClusterer;
    return newClusterer;
  }, [map]);

  // Create/Update Heatmap
  useEffect(() => {
    if (!map || !sightings) return;

    // Remove existing heatmap
    if (heatmapRef.current) {
      heatmapRef.current.setMap(null);
    }

    if (showHeatmap && sightings.length > 0) {
      // Create heatmap data points with weights
      const heatmapData = sightings.map((sighting) => {
        const lat = parseFloat(sighting.latitude);
        const lng = parseFloat(sighting.longitude);
        if (isNaN(lat) || isNaN(lng)) return null;
        
        // Weight based on recency (more recent = higher weight)
        const sightedAt = new Date(sighting.sightedAt);
        const daysSince = Math.max(1, Math.floor((Date.now() - sightedAt.getTime()) / (1000 * 60 * 60 * 24)));
        const weight = Math.max(1, 30 / daysSince); // More recent sightings have higher weight
        
        return {
          location: new google.maps.LatLng(lat, lng),
          weight: weight,
        };
      }).filter(Boolean) as google.maps.visualization.WeightedLocation[];

      // Create heatmap layer
      const heatmap = new google.maps.visualization.HeatmapLayer({
        data: heatmapData,
        map: map,
        radius: 30,
        opacity: 0.7,
        gradient: [
          'rgba(0, 255, 0, 0)',      // Transparent
          'rgba(255, 255, 0, 0.5)',  // Yellow (low danger)
          'rgba(255, 165, 0, 0.7)',  // Orange (medium danger)
          'rgba(255, 69, 0, 0.8)',   // Red-Orange (high danger)
          'rgba(255, 0, 0, 1)',      // Red (very high danger)
          'rgba(139, 0, 0, 1)',      // Dark Red (extreme danger)
        ],
      });

      heatmapRef.current = heatmap;
    }

    return () => {
      if (heatmapRef.current) {
        heatmapRef.current.setMap(null);
      }
    };
  }, [map, sightings, showHeatmap]);

  // Toggle marker visibility based on heatmap mode
  useEffect(() => {
    if (!clusterer) return;
    
    if (showHeatmap) {
      // Hide markers when heatmap is shown
      clusterer.clearMarkers();
    } else if (sightings && map && infoWindow) {
      // Show markers when heatmap is hidden
      const newMarkers: {[key: string]: google.maps.Marker} = {};
      sightings.forEach((sighting) => {
        const marker = createBearMarker(sighting as BearSighting, map, infoWindow);
        if (marker) {
          newMarkers[sighting.id.toString()] = marker;
        }
      });
      clusterer.addMarkers(Object.values(newMarkers));
      setMarkers(newMarkers);
    }
  }, [showHeatmap, clusterer, sightings, map, infoWindow]);

  // Update markers when sightings change (only when not in heatmap mode)
  useEffect(() => {
    if (!map || !sightings || !infoWindow || !clusterer || showHeatmap) return;

    // Clear existing markers
    clusterer.clearMarkers();
    Object.values(markers).forEach(marker => marker.setMap(null));
    setMarkers({});

    // Create new markers
    const newMarkers: {[key: string]: google.maps.Marker} = {};
    sightings.forEach((sighting) => {
      const marker = createBearMarker(sighting as BearSighting, map, infoWindow);
      if (marker) {
        newMarkers[sighting.id.toString()] = marker;
      }
    });

    // Add markers to clusterer
    clusterer.addMarkers(Object.values(newMarkers));
    setMarkers(newMarkers);

    // Fit bounds to show all markers
    if (Object.keys(newMarkers).length > 0) {
      const bounds = new google.maps.LatLngBounds();
      Object.values(newMarkers).forEach(marker => {
        const position = marker.getPosition();
        if (position) bounds.extend(position);
      });
      map.fitBounds(bounds);
    }
  }, [map, sightings, infoWindow, clusterer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (clustererRef.current) {
        clustererRef.current.clearMarkers();
      }
      if (heatmapRef.current) {
        heatmapRef.current.setMap(null);
      }
      Object.values(markers).forEach(marker => marker.setMap(null));
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Seasonal Warning Banner */}
      <SeasonalWarningBanner />
      
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-orange-100 dark:border-gray-700 sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 sm:gap-3">
            <img src="/kumap-logo.webp" alt="クマップ" className="h-8 w-8 sm:h-10 sm:w-10" />
            <h1 className="text-xl sm:text-2xl font-bold text-orange-600 whitespace-nowrap">クマップ</h1>
            <span className="text-sm text-gray-600 dark:text-gray-400 hidden lg:inline whitespace-nowrap">Bear Sighting Information Map</span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                ホーム
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <MapPin className="h-4 w-4 mr-1" />
                マップ
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/stats">
                <BarChart3 className="h-4 w-4 mr-1" />
                統計
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/about">
                <Info className="h-4 w-4 mr-1" />
                このサイトについて
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/emergency-guide">
                <Shield className="h-4 w-4 mr-1" />
                緊急対策
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/contacts">
                <Phone className="h-4 w-4 mr-1" />
                連絡先
              </Link>
            </Button>
            {user && (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/submit">
                    <Plus className="h-4 w-4 mr-1" />
                    目撃情報を投稿
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/notifications">
                    <Bell className="h-4 w-4 mr-1" />
                    通知設定
                  </Link>
                </Button>
              </>
            )}
            {user?.openId === import.meta.env.VITE_OWNER_OPEN_ID && (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/scraper">
                  <Settings className="h-4 w-4 mr-1" />
                  管理
                </Link>
              </Button>
            )}
            <ThemeToggle />
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700 py-2 px-3">
            <nav className="flex flex-col gap-1">
              <Button variant="ghost" size="sm" className="justify-start" asChild onClick={() => setMobileMenuOpen(false)}>
                <Link href="/">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                  ホーム
                </Link>
              </Button>
              <Button variant="ghost" size="sm" className="justify-start" asChild onClick={() => setMobileMenuOpen(false)}>
                <Link href="/">
                  <MapPin className="h-4 w-4 mr-2" />
                  マップ
                </Link>
              </Button>
              <Button variant="ghost" size="sm" className="justify-start" asChild onClick={() => setMobileMenuOpen(false)}>
                <Link href="/stats">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  統計
                </Link>
              </Button>
              <Button variant="ghost" size="sm" className="justify-start" asChild onClick={() => setMobileMenuOpen(false)}>
                <Link href="/about">
                  <Info className="h-4 w-4 mr-2" />
                  このサイトについて
                </Link>
              </Button>
              <Button variant="ghost" size="sm" className="justify-start" asChild onClick={() => setMobileMenuOpen(false)}>
                <Link href="/emergency-guide">
                  <Shield className="h-4 w-4 mr-2" />
                  緊急対策ガイド
                </Link>
              </Button>
              <Button variant="ghost" size="sm" className="justify-start" asChild onClick={() => setMobileMenuOpen(false)}>
                <Link href="/contacts">
                  <Phone className="h-4 w-4 mr-2" />
                  緊急連絡先
                </Link>
              </Button>
              {user && (
                <>
                  <Button variant="ghost" size="sm" className="justify-start" asChild onClick={() => setMobileMenuOpen(false)}>
                    <Link href="/submit">
                      <Plus className="h-4 w-4 mr-2" />
                      目撃情報を投稿
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" className="justify-start" asChild onClick={() => setMobileMenuOpen(false)}>
                    <Link href="/notifications">
                      <Bell className="h-4 w-4 mr-2" />
                      通知設定
                    </Link>
                  </Button>
                </>
              )}
              {user?.openId === import.meta.env.VITE_OWNER_OPEN_ID && (
                <Button variant="ghost" size="sm" className="justify-start" asChild onClick={() => setMobileMenuOpen(false)}>
                  <Link href="/admin/scraper">
                    <Settings className="h-4 w-4 mr-2" />
                    管理
                  </Link>
                </Button>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-6">
        {/* Legend and View Toggle */}
        <div className="mb-3 sm:mb-4 flex flex-wrap items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-6 text-xs sm:text-sm">
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-red-500"></div>
              <span className="text-gray-700 dark:text-gray-300">公式情報</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-orange-500"></div>
              <span className="text-gray-700 dark:text-gray-300">ユーザー投稿</span>
            </div>
          </div>
          
          {/* Heatmap Toggle */}
          <div className="flex items-center gap-2 sm:gap-3 bg-white dark:bg-gray-800 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg shadow-sm border border-orange-100 dark:border-gray-700">
            <MapIcon className={`h-4 w-4 ${!showHeatmap ? 'text-orange-600' : 'text-gray-400'}`} />
            <Switch
              id="heatmap-toggle"
              checked={showHeatmap}
              onCheckedChange={setShowHeatmap}
            />
            <Flame className={`h-4 w-4 ${showHeatmap ? 'text-red-600' : 'text-gray-400'}`} />
            <Label htmlFor="heatmap-toggle" className="text-xs sm:text-sm font-medium cursor-pointer hidden sm:inline">
              {showHeatmap ? '危険度ヒートマップ' : 'マーカー表示'}
            </Label>
          </div>
        </div>

        {/* Heatmap Legend (shown when heatmap is active) */}
        {showHeatmap && (
          <div className="mb-4 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-orange-100 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">危険度ヒートマップ</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-3 rounded-full" style={{
                background: 'linear-gradient(to right, rgba(255,255,0,0.5), rgba(255,165,0,0.7), rgba(255,69,0,0.8), rgba(255,0,0,1), rgba(139,0,0,1))'
              }}></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>低</span>
              <span>中</span>
              <span>高</span>
              <span>非常に高</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              ※ 出没頻度と最近の目撃情報に基づいて危険度を算出しています
            </p>
          </div>
        )}

        {/* GPS-based Nearby Danger Indicator */}
        <div className="mb-4">
          <NearbyDangerIndicator
            sightings={sightings || []}
            radiusKm={5}
            daysBack={30}
            className=""
          />
        </div>

        {/* Filter Component */}
        <MapFilter
          selectedPrefectures={selectedPrefectures}
          onPrefecturesChange={setSelectedPrefectures}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          customDateRange={customDateRange}
          onCustomDateRangeChange={setCustomDateRange}
          sightingsCount={sightings?.length || 0}
        />

        {/* Map */}
        <Card className="overflow-hidden shadow-lg">
          {isLoading && (
            <div className="h-[50vh] sm:h-[600px] flex items-center justify-center bg-gray-50 dark:bg-gray-800">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
          )}
          {!isLoading && (!sightings || sightings.length === 0) && (
            <div className="h-[50vh] sm:h-[600px] flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 p-4">
              <AlertTriangle className="h-10 w-10 sm:h-12 sm:w-12 text-orange-400 mb-3 sm:mb-4" />
              <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-lg text-center">選択された条件に一致する出没情報がありません</p>
            </div>
          )}
          <div className="h-[50vh] sm:h-[600px]">
            <GoogleMapView
              onMapReady={handleMapReady}
              initialCenter={{ lat: 37.5, lng: 137.5 }}
              initialZoom={5.5}
            />
          </div>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
