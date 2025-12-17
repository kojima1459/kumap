/**
 * NearbyDangerIndicator Component
 * 
 * Displays bear sighting danger level based on user's current location.
 * All location processing is done client-side for privacy protection.
 * 
 * Features:
 * - GPS-based danger assessment
 * - Offline support with cached data
 * - Privacy-first design (no server-side location tracking)
 */

import { useState, useEffect, useMemo } from "react";
import { useGeolocation, hasLocationConsent, setLocationConsent } from "../hooks/useGeolocation";
import { useOfflineStatus } from "../hooks/useServiceWorker";
import {
  calculateDistance,
  filterSightingsWithinRadius,
  calculateDangerLevel,
  getDangerLevelInfo,
  getPrefectureFromCoordinates,
} from "../lib/geoUtils";
import { LocationConsentModal } from "./LocationConsentModal";

interface BearSighting {
  id: number;
  latitude: string | number;
  longitude: string | number;
  sightedAt: Date | string;
  prefecture: string;
  city?: string | null;
}

interface NearbyDangerIndicatorProps {
  sightings: BearSighting[];
  radiusKm?: number;
  daysBack?: number;
  compact?: boolean;
  className?: string;
}

export function NearbyDangerIndicator({
  sightings,
  radiusKm = 5,
  daysBack = 30,
  compact = false,
  className = "",
}: NearbyDangerIndicatorProps) {
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const { state: geoState, getCurrentPosition, isSupported, hasConsent } = useGeolocation();
  const { isOnline, dataFreshness } = useOfflineStatus();

  // Calculate nearby sightings when location is available
  const nearbyData = useMemo(() => {
    if (!geoState.latitude || !geoState.longitude || sightings.length === 0) {
      return null;
    }

    const now = new Date();
    const cutoffDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
    const recentCutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Filter sightings within radius
    const nearbySightings = filterSightingsWithinRadius(
      sightings,
      geoState.latitude,
      geoState.longitude,
      radiusKm
    );

    // Filter by date
    const recentNearbySightings = nearbySightings.filter((s) => {
      const sightedAt = new Date(s.sightedAt);
      return sightedAt >= cutoffDate;
    });

    // Count very recent (last 7 days)
    const veryRecentCount = recentNearbySightings.filter((s) => {
      const sightedAt = new Date(s.sightedAt);
      return sightedAt >= recentCutoff;
    }).length;

    // Get prefecture
    const prefecture = getPrefectureFromCoordinates(geoState.latitude, geoState.longitude);

    // Calculate danger level
    const dangerLevel = calculateDangerLevel(recentNearbySightings.length, veryRecentCount);

    // Find closest sighting
    let closestSighting: BearSighting | null = null;
    let closestDistance = Infinity;

    for (const sighting of recentNearbySightings) {
      const lat = typeof sighting.latitude === "string" ? parseFloat(sighting.latitude) : sighting.latitude;
      const lon = typeof sighting.longitude === "string" ? parseFloat(sighting.longitude) : sighting.longitude;
      const distance = calculateDistance(geoState.latitude, geoState.longitude, lat, lon);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestSighting = sighting;
      }
    }

    return {
      totalNearby: recentNearbySightings.length,
      veryRecentCount,
      dangerLevel,
      prefecture,
      closestSighting,
      closestDistance: closestDistance === Infinity ? null : closestDistance,
      accuracy: geoState.accuracy,
    };
  }, [geoState.latitude, geoState.longitude, geoState.accuracy, sightings, radiusKm, daysBack]);

  // Handle consent and get position
  const handleEnableLocation = () => {
    if (!hasConsent) {
      setShowConsentModal(true);
    } else {
      getCurrentPosition();
    }
  };

  const handleConsentGranted = () => {
    setLocationConsent(true);
    setShowConsentModal(false);
    getCurrentPosition();
  };

  // Auto-refresh location periodically when enabled
  useEffect(() => {
    if (hasConsent && geoState.latitude && isOnline) {
      const interval = setInterval(() => {
        getCurrentPosition();
      }, 5 * 60 * 1000); // Refresh every 5 minutes

      return () => clearInterval(interval);
    }
  }, [hasConsent, geoState.latitude, isOnline, getCurrentPosition]);

  // Render based on state
  if (!isSupported) {
    return null; // Don't show anything if geolocation not supported
  }

  // Compact version for header/sidebar
  if (compact) {
    return (
      <>
        <button
          onClick={handleEnableLocation}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
            nearbyData
              ? getDangerLevelInfo(nearbyData.dangerLevel).bgColor
              : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
          } ${className}`}
          title="現在地の危険度を確認"
        >
          <span className="text-lg">📍</span>
          {geoState.loading ? (
            <span className="text-sm text-gray-600 dark:text-gray-400">取得中...</span>
          ) : nearbyData ? (
            <span className={`text-sm font-medium ${getDangerLevelInfo(nearbyData.dangerLevel).color}`}>
              {getDangerLevelInfo(nearbyData.dangerLevel).icon} {nearbyData.totalNearby}件
            </span>
          ) : (
            <span className="text-sm text-gray-600 dark:text-gray-400">位置情報</span>
          )}
        </button>

        <LocationConsentModal
          isOpen={showConsentModal}
          onClose={() => setShowConsentModal(false)}
          onConsent={handleConsentGranted}
        />
      </>
    );
  }

  // Full version
  const dangerInfo = nearbyData ? getDangerLevelInfo(nearbyData.dangerLevel) : null;

  return (
    <>
      <div className={`rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
        {/* Header */}
        <div
          className={`px-4 py-3 flex items-center justify-between cursor-pointer ${
            dangerInfo ? dangerInfo.bgColor : "bg-gray-50 dark:bg-gray-800"
          }`}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">📍</span>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                現在地の危険度
              </h3>
              {nearbyData && (
                <p className={`text-sm ${dangerInfo?.color}`}>
                  {dangerInfo?.icon} {dangerInfo?.label}
                </p>
              )}
            </div>
          </div>
          <span className="text-gray-400">{isExpanded ? "▲" : "▼"}</span>
        </div>

        {/* Content */}
        {isExpanded && (
          <div className="px-4 py-4 bg-white dark:bg-gray-900">
            {!hasConsent ? (
              // Not consented yet
              <div className="text-center py-4">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  現在地周辺のクマ出没情報を確認できます
                </p>
                <button
                  onClick={handleEnableLocation}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors"
                >
                  位置情報を使用する
                </button>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-3">
                  ℹ️ 位置情報はサーバーに送信されません
                </p>
              </div>
            ) : geoState.loading ? (
              // Loading
              <div className="text-center py-4">
                <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                <p className="text-gray-600 dark:text-gray-400">位置情報を取得中...</p>
              </div>
            ) : geoState.error ? (
              // Error
              <div className="text-center py-4">
                <p className="text-red-500 mb-3">{geoState.error}</p>
                <button
                  onClick={getCurrentPosition}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  再試行
                </button>
              </div>
            ) : nearbyData ? (
              // Success - show danger info
              <div className="space-y-4">
                {/* Main stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {nearbyData.totalNearby}件
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {radiusKm}km以内・過去{daysBack}日
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {nearbyData.veryRecentCount}件
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      直近7日間
                    </p>
                  </div>
                </div>

                {/* Danger message */}
                <div className={`p-3 rounded-lg ${dangerInfo?.bgColor}`}>
                  <p className={`text-sm ${dangerInfo?.color}`}>
                    {dangerInfo?.message}
                  </p>
                </div>

                {/* Closest sighting */}
                {nearbyData.closestSighting && nearbyData.closestDistance !== null && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">最も近い出没地点:</span>{" "}
                      {nearbyData.closestSighting.city || nearbyData.closestSighting.prefecture}
                      （約{nearbyData.closestDistance.toFixed(1)}km）
                    </p>
                  </div>
                )}

                {/* Location info */}
                {nearbyData.prefecture && (
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    📍 {nearbyData.prefecture}付近
                    {geoState.accuracy && ` (精度: 約${Math.round(geoState.accuracy)}m)`}
                  </p>
                )}

                {/* Offline warning */}
                {!isOnline && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                    <p className="text-sm text-yellow-700 dark:text-yellow-400">
                      ⚠️ オフラインモード - キャッシュデータを使用中
                    </p>
                  </div>
                )}

                {/* Refresh button */}
                <button
                  onClick={getCurrentPosition}
                  className="w-full py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  🔄 位置情報を更新
                </button>

                {/* Privacy notice */}
                <p className="text-xs text-gray-400 dark:text-gray-600 text-center">
                  位置情報はお使いの端末内でのみ処理され、サーバーには送信されません
                </p>
              </div>
            ) : (
              // No data yet
              <div className="text-center py-4">
                <button
                  onClick={getCurrentPosition}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors"
                >
                  現在地を確認
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <LocationConsentModal
        isOpen={showConsentModal}
        onClose={() => setShowConsentModal(false)}
        onConsent={handleConsentGranted}
      />
    </>
  );
}
