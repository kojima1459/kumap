/**
 * Custom hook for geolocation with privacy-first design
 * - Requires explicit user consent
 * - Does not send location to server
 * - Supports offline mode
 */

import { useState, useCallback, useEffect } from "react";

export interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  loading: boolean;
  error: string | null;
  timestamp: number | null;
  permissionState: PermissionState | null;
}

export interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

const defaultOptions: UseGeolocationOptions = {
  enableHighAccuracy: false, // Use low accuracy by default for battery saving
  timeout: 10000, // 10 seconds
  maximumAge: 300000, // 5 minutes cache
};

// Local storage key for consent
const LOCATION_CONSENT_KEY = "kumap_location_consent";

/**
 * Check if user has given location consent
 */
export function hasLocationConsent(): boolean {
  try {
    return localStorage.getItem(LOCATION_CONSENT_KEY) === "granted";
  } catch {
    return false;
  }
}

/**
 * Set location consent
 */
export function setLocationConsent(granted: boolean): void {
  try {
    if (granted) {
      localStorage.setItem(LOCATION_CONSENT_KEY, "granted");
    } else {
      localStorage.removeItem(LOCATION_CONSENT_KEY);
    }
  } catch {
    // Ignore localStorage errors
  }
}

/**
 * Clear location consent
 */
export function clearLocationConsent(): void {
  try {
    localStorage.removeItem(LOCATION_CONSENT_KEY);
  } catch {
    // Ignore localStorage errors
  }
}

/**
 * Custom hook for geolocation
 */
export function useGeolocation(options: UseGeolocationOptions = {}): {
  state: GeolocationState;
  getCurrentPosition: () => void;
  clearPosition: () => void;
  isSupported: boolean;
  hasConsent: boolean;
} {
  const mergedOptions = { ...defaultOptions, ...options };

  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    loading: false,
    error: null,
    timestamp: null,
    permissionState: null,
  });

  const [hasConsent, setHasConsent] = useState<boolean>(hasLocationConsent());

  const isSupported = typeof navigator !== "undefined" && "geolocation" in navigator;

  // Check permission state on mount
  useEffect(() => {
    if (!isSupported) return;

    const checkPermission = async () => {
      try {
        if ("permissions" in navigator) {
          const result = await navigator.permissions.query({ name: "geolocation" });
          setState((prev) => ({ ...prev, permissionState: result.state }));

          result.addEventListener("change", () => {
            setState((prev) => ({ ...prev, permissionState: result.state }));
          });
        }
      } catch {
        // Permissions API not supported
      }
    };

    checkPermission();
  }, [isSupported]);

  // Update consent state when localStorage changes
  useEffect(() => {
    const handleStorage = () => {
      setHasConsent(hasLocationConsent());
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const getCurrentPosition = useCallback(() => {
    if (!isSupported) {
      setState((prev) => ({
        ...prev,
        error: "お使いのブラウザは位置情報に対応していません",
      }));
      return;
    }

    if (!hasLocationConsent()) {
      setState((prev) => ({
        ...prev,
        error: "位置情報の使用に同意が必要です",
      }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          loading: false,
          error: null,
          timestamp: position.timestamp,
          permissionState: "granted",
        });
      },
      (error) => {
        let errorMessage: string;
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "位置情報の使用が拒否されました";
            clearLocationConsent();
            setHasConsent(false);
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "位置情報を取得できませんでした";
            break;
          case error.TIMEOUT:
            errorMessage = "位置情報の取得がタイムアウトしました";
            break;
          default:
            errorMessage = "位置情報の取得中にエラーが発生しました";
        }
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
          permissionState: error.code === error.PERMISSION_DENIED ? "denied" : prev.permissionState,
        }));
      },
      {
        enableHighAccuracy: mergedOptions.enableHighAccuracy,
        timeout: mergedOptions.timeout,
        maximumAge: mergedOptions.maximumAge,
      }
    );
  }, [isSupported, mergedOptions.enableHighAccuracy, mergedOptions.timeout, mergedOptions.maximumAge]);

  const clearPosition = useCallback(() => {
    setState({
      latitude: null,
      longitude: null,
      accuracy: null,
      loading: false,
      error: null,
      timestamp: null,
      permissionState: state.permissionState,
    });
  }, [state.permissionState]);

  return {
    state,
    getCurrentPosition,
    clearPosition,
    isSupported,
    hasConsent,
  };
}
