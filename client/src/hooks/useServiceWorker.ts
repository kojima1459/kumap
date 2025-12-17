/**
 * Custom hook for Service Worker management
 * Handles registration, updates, and cache management
 */

import { useState, useEffect, useCallback } from "react";

export interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isOnline: boolean;
  updateAvailable: boolean;
  cacheStatus: CacheStatus | null;
}

export interface CacheStatus {
  version: string;
  caches: Array<{ name: string; entries: number }>;
  lastUpdated: string | null;
}

/**
 * Register Service Worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) {
    console.log("[SW] Service Worker not supported");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });

    console.log("[SW] Service Worker registered:", registration.scope);

    // Check for updates
    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            console.log("[SW] New content available");
            // Dispatch custom event for UI notification
            window.dispatchEvent(new CustomEvent("swUpdate"));
          }
        });
      }
    });

    return registration;
  } catch (error) {
    console.error("[SW] Registration failed:", error);
    return null;
  }
}

/**
 * Send message to Service Worker
 */
export function sendMessageToSW(message: { type: string; payload?: unknown }): void {
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage(message);
  }
}

/**
 * Cache sighting data for offline use
 */
export function cacheSightingData(data: unknown): void {
  sendMessageToSW({ type: "CACHE_SIGHTINGS", payload: { data } });
}

/**
 * Clear all caches
 */
export function clearCache(): void {
  sendMessageToSW({ type: "CLEAR_CACHE" });
}

/**
 * Skip waiting and activate new Service Worker
 */
export function skipWaiting(): void {
  sendMessageToSW({ type: "SKIP_WAITING" });
  window.location.reload();
}

/**
 * Custom hook for Service Worker state management
 */
export function useServiceWorker(): ServiceWorkerState & {
  refresh: () => void;
  clearCache: () => void;
  skipWaiting: () => void;
} {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: typeof navigator !== "undefined" && "serviceWorker" in navigator,
    isRegistered: false,
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    updateAvailable: false,
    cacheStatus: null,
  });

  // Register Service Worker on mount
  useEffect(() => {
    if (!state.isSupported) return;

    registerServiceWorker().then((registration) => {
      setState((prev) => ({ ...prev, isRegistered: !!registration }));
    });

    // Listen for update events
    const handleUpdate = () => {
      setState((prev) => ({ ...prev, updateAvailable: true }));
    };
    window.addEventListener("swUpdate", handleUpdate);

    // Listen for online/offline events
    const handleOnline = () => {
      setState((prev) => ({ ...prev, isOnline: true }));
    };
    const handleOffline = () => {
      setState((prev) => ({ ...prev, isOnline: false }));
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Listen for cache status messages
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "CACHE_STATUS") {
        setState((prev) => ({
          ...prev,
          cacheStatus: {
            ...event.data.payload,
            lastUpdated: new Date().toISOString(),
          },
        }));
      }
    };
    navigator.serviceWorker.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("swUpdate", handleUpdate);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      navigator.serviceWorker.removeEventListener("message", handleMessage);
    };
  }, [state.isSupported]);

  const refresh = useCallback(() => {
    sendMessageToSW({ type: "GET_CACHE_STATUS" });
  }, []);

  const handleClearCache = useCallback(() => {
    clearCache();
    setState((prev) => ({ ...prev, cacheStatus: null }));
  }, []);

  const handleSkipWaiting = useCallback(() => {
    skipWaiting();
  }, []);

  return {
    ...state,
    refresh,
    clearCache: handleClearCache,
    skipWaiting: handleSkipWaiting,
  };
}

/**
 * Hook for offline detection with data freshness
 */
export function useOfflineStatus(): {
  isOnline: boolean;
  dataFreshness: "fresh" | "stale" | "offline";
  lastOnline: Date | null;
} {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [lastOnline, setLastOnline] = useState<Date | null>(
    typeof navigator !== "undefined" && navigator.onLine ? new Date() : null
  );

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastOnline(new Date());
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Calculate data freshness
  let dataFreshness: "fresh" | "stale" | "offline" = "fresh";
  if (!isOnline) {
    if (lastOnline) {
      const hoursSinceOnline = (Date.now() - lastOnline.getTime()) / (1000 * 60 * 60);
      dataFreshness = hoursSinceOnline > 24 ? "stale" : "offline";
    } else {
      dataFreshness = "stale";
    }
  }

  return { isOnline, dataFreshness, lastOnline };
}
