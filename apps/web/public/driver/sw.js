const CACHE_NAME = 'routeplan-driver-v1';
const STATIC_ASSETS = [
  '/driver',
  '/driver/manifest.json',
  '/driver/icon-192.png',
];

const API_CACHE_NAME = 'routeplan-driver-api-v1';
const API_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' })));
    }).then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== API_CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - network first for API, cache first for static
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) return;

  // API requests - network first with cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstWithCache(request, API_CACHE_NAME));
    return;
  }

  // Static assets - cache first
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/driver/') ||
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff|woff2)$/)
  ) {
    event.respondWith(cacheFirst(request, CACHE_NAME));
    return;
  }

  // HTML pages - network first with cache fallback
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirstWithCache(request, CACHE_NAME));
    return;
  }

  // Default - network first
  event.respondWith(networkFirstWithCache(request, CACHE_NAME));
});

// Cache first strategy
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (cached) {
    // Return cached version, update in background
    fetchAndCache(request, cache);
    return cached;
  }
  
  return fetchAndCache(request, cache);
}

// Network first with cache fallback
async function networkFirstWithCache(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      // Clone response for cache
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Network failed, try cache
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    
    // Return offline page for HTML requests
    if (request.headers.get('accept')?.includes('text/html')) {
      return caches.match('/driver');
    }
    
    throw error;
  }
}

// Fetch and cache helper
async function fetchAndCache(request, cache) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    throw error;
  }
}

// Background sync for pending actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-orders') {
    event.waitUntil(syncPendingOrders());
  }
  if (event.tag === 'sync-location') {
    event.waitUntil(syncLocation());
  }
});

async function syncPendingOrders() {
  // Get pending order actions from IndexedDB
  // Send to server when online
  console.log('Syncing pending orders...');
}

async function syncLocation() {
  // Send cached location updates
  console.log('Syncing location...');
}

// Push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/driver/icon-192.png',
    badge: '/driver/icon-72.png',
    vibrate: [200, 100, 200],
    data: data.data || {},
    actions: data.actions || [],
    requireInteraction: true,
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action) {
    // Handle action buttons
    clients.openWindow(event.action);
  } else {
    // Default click - open app
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes('/driver') && 'focus' in client) {
            return client.focus();
          }
        }
        return clients.openWindow('/driver');
      })
    );
  }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'periodic-sync') {
    event.waitUntil(
      Promise.all([
        syncPendingOrders(),
        syncLocation(),
      ])
    );
  }
});