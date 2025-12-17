/**
 * Push Notification Hook
 * Manages Web Push API subscription for PWA notifications
 */

import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";

export interface PushNotificationState {
  isSupported: boolean;
  permission: NotificationPermission | "default";
  isSubscribed: boolean;
  isLoading: boolean;
  error: string | null;
}

export function usePushNotification() {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    permission: "default",
    isSubscribed: false,
    isLoading: false,
    error: null,
  });

  const { data: vapidData } = trpc.pushNotification.getVapidPublicKey.useQuery();
  const subscribeMutation = trpc.pushNotification.subscribe.useMutation();
  const unsubscribeMutation = trpc.pushNotification.unsubscribe.useMutation();

  // Check if push notifications are supported
  useEffect(() => {
    const checkSupport = async () => {
      const isSupported = 
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window;

      if (!isSupported) {
        setState((prev) => ({ ...prev, isSupported: false }));
        return;
      }

      const permission = Notification.permission;

      // Check if already subscribed
      let isSubscribed = false;
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        isSubscribed = subscription !== null;
      } catch (error) {
        console.error("Failed to check subscription:", error);
      }

      setState((prev) => ({
        ...prev,
        isSupported: true,
        permission,
        isSubscribed,
      }));
    };

    checkSupport();
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) {
      setState((prev) => ({ ...prev, error: "プッシュ通知はこのブラウザでサポートされていません" }));
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setState((prev) => ({ ...prev, permission }));
      return permission === "granted";
    } catch (error) {
      console.error("Failed to request permission:", error);
      setState((prev) => ({ ...prev, error: "通知の許可を取得できませんでした" }));
      return false;
    }
  }, [state.isSupported]);

  // Subscribe to push notifications
  const subscribe = useCallback(
    async (prefecture: string): Promise<boolean> => {
      if (!state.isSupported || !vapidData?.publicKey) {
        setState((prev) => ({ ...prev, error: "プッシュ通知を設定できません" }));
        return false;
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        // Request permission if not granted
        if (state.permission !== "granted") {
          const granted = await requestPermission();
          if (!granted) {
            setState((prev) => ({ ...prev, isLoading: false }));
            return false;
          }
        }

        // Get service worker registration
        const registration = await navigator.serviceWorker.ready;

        // Convert VAPID key to Uint8Array
        const vapidPublicKey = urlBase64ToUint8Array(vapidData.publicKey);

        // Subscribe to push manager
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidPublicKey as BufferSource,
        });

        // Get subscription data
        const subscriptionJson = subscription.toJSON();
        if (!subscriptionJson.endpoint || !subscriptionJson.keys) {
          throw new Error("Invalid subscription data");
        }

        // Send subscription to server
        const result = await subscribeMutation.mutateAsync({
          subscription: {
            endpoint: subscriptionJson.endpoint,
            keys: {
              p256dh: subscriptionJson.keys.p256dh!,
              auth: subscriptionJson.keys.auth!,
            },
          },
          prefecture,
          userAgent: navigator.userAgent,
        });

        if (result.success) {
          setState((prev) => ({
            ...prev,
            isSubscribed: true,
            isLoading: false,
          }));
          return true;
        } else {
          throw new Error(result.error || "登録に失敗しました");
        }
      } catch (error) {
        console.error("Failed to subscribe:", error);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : "登録に失敗しました",
        }));
        return false;
      }
    },
    [state.isSupported, state.permission, vapidData, requestPermission, subscribeMutation]
  );

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Unsubscribe from push manager
        await subscription.unsubscribe();

        // Remove from server
        await unsubscribeMutation.mutateAsync({
          endpoint: subscription.endpoint,
        });
      }

      setState((prev) => ({
        ...prev,
        isSubscribed: false,
        isLoading: false,
      }));
      return true;
    } catch (error) {
      console.error("Failed to unsubscribe:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "解除に失敗しました",
      }));
      return false;
    }
  }, [unsubscribeMutation]);

  return {
    ...state,
    requestPermission,
    subscribe,
    unsubscribe,
  };
}

/**
 * Convert a base64 string to Uint8Array
 * Required for applicationServerKey in push subscription
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}
