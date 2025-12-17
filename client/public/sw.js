/**
 * Service Worker for Kumap (クマップ)
 * Provides offline caching for bear sighting data
 * 
 * Cache Strategy:
 * - Static assets: Cache-first
 * - API data: Network-first with cache fallback
 * - Sighting data: Stale-while-revalidate
 */

const CACHE_VERSION = 'kumap-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DATA_CACHE = `${CACHE_VERSION}-data`;

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/kumap-logo.webp',
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/icon-192.png',
];

// API endpoints to cache
const CACHEABLE_API_PATTERNS = [
  /\/api\/trpc\/bearSightings\.list/,
  /\/api\/trpc\/bearSightings\.getStats/,
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('kumap-') && name !== STATIC_CACHE && name !== DATA_CACHE)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  // Take control of all clients
  self.clients.claim();
});

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests (except for API)
  if (url.origin !== self.location.origin && !url.pathname.includes('/api/')) {
    return;
  }

  // Check if this is a cacheable API request
  const isCacheableApi = CACHEABLE_API_PATTERNS.some((pattern) => pattern.test(url.pathname));

  if (isCacheableApi) {
    // Network-first with cache fallback for API data
    event.respondWith(networkFirstWithCache(request, DATA_CACHE));
  } else if (request.destination === 'document' || STATIC_ASSETS.includes(url.pathname)) {
    // Cache-first for static assets
    event.respondWith(cacheFirstWithNetwork(request, STATIC_CACHE));
  }
});

/**
 * Network-first strategy with cache fallback
 * Used for API data that should be fresh when possible
 */
async function networkFirstWithCache(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    // Clone response before caching
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // Add header to indicate cached response
      const headers = new Headers(cachedResponse.headers);
      headers.set('X-Cache-Status', 'offline');
      
      return new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers,
      });
    }
    
    // Return offline error response
    return new Response(
      JSON.stringify({
        error: 'オフラインです。インターネット接続を確認してください。',
        offline: true,
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Cache-first strategy with network fallback
 * Used for static assets that rarely change
 */
async function cacheFirstWithNetwork(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed for static asset:', request.url);
    
    // Return offline page for document requests
    if (request.destination === 'document') {
      return caches.match('/');
    }
    
    throw error;
  }
}

/**
 * Message handler for cache management
 */
self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CLEAR_CACHE':
      event.waitUntil(
        caches.keys().then((names) => {
          return Promise.all(names.map((name) => caches.delete(name)));
        })
      );
      break;
      
    case 'CACHE_SIGHTINGS':
      // Cache sighting data for offline use
      if (payload && payload.data) {
        event.waitUntil(cacheSightingData(payload.data));
      }
      break;
      
    case 'GET_CACHE_STATUS':
      event.waitUntil(
        getCacheStatus().then((status) => {
          event.source.postMessage({ type: 'CACHE_STATUS', payload: status });
        })
      );
      break;
  }
});

/**
 * Cache sighting data for offline use
 */
async function cacheSightingData(data) {
  const cache = await caches.open(DATA_CACHE);
  const response = new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'X-Cache-Time': new Date().toISOString(),
    },
  });
  await cache.put('/api/cached-sightings', response);
}

/**
 * Get cache status information
 */
async function getCacheStatus() {
  const cacheNames = await caches.keys();
  const status = {
    version: CACHE_VERSION,
    caches: [],
    totalSize: 0,
  };
  
  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    status.caches.push({
      name,
      entries: keys.length,
    });
  }
  
  return status;
}

/**
 * Push notification handler
 * Receives push events from the server and displays notifications
 */
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  let data = {
    title: 'クマップ',
    body: '新しいクマ出没情報があります',
    icon: '/kumap-logo.webp',
    badge: '/icon-192.png',
    url: '/',
    tag: 'kumap-notification',
  };
  
  try {
    if (event.data) {
      const payload = event.data.json();
      data = { ...data, ...payload };
    }
  } catch (error) {
    console.error('[SW] Failed to parse push data:', error);
  }
  
  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    data: {
      url: data.url,
    },
    vibrate: [200, 100, 200],
    requireInteraction: true,
    actions: [
      {
        action: 'open',
        title: '詳細を見る',
      },
      {
        action: 'close',
        title: '閉じる',
      },
    ],
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

/**
 * Notification click handler
 * Opens the app when user clicks on a notification
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }
  
  const url = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Open a new window if none exists
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

/**
 * Push subscription change handler
 * Re-subscribes when the subscription expires
 */
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('[SW] Push subscription changed');
  
  event.waitUntil(
    self.registration.pushManager.subscribe(event.oldSubscription.options).then((subscription) => {
      // Notify the main thread about the new subscription
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'PUSH_SUBSCRIPTION_CHANGED',
            payload: subscription.toJSON(),
          });
        });
      });
    })
  );
});
