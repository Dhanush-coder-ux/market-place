/**
 * inventQ Progressive Web App (PWA) Service Worker
 * Version: 1.0.1
 * Enables desktop/mobile installation, offline shell caching, and version updates.
 */

const CACHE_VERSION = 'v1.0.1';
const CACHE_NAME = `inventq-pwa-${CACHE_VERSION}`;

const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
  '/icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('[SW] Cache prefetch warning:', err);
      });
    })
  );
  // Waiting for client to confirm refresh via SKIP_WAITING message
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Listen for message from client (user clicks "Refresh / Update")
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Received SKIP_WAITING from client. Activating new worker...');
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Skip non-HTTP(S) schemes
  if (!url.protocol.startsWith('http')) return;

  // Never cache version.json so version polling is always 100% fresh
  if (url.pathname === '/version.json') {
    return;
  }

  // Skip API endpoints, websockets, and Vite hot-update modules
  if (
    url.pathname.startsWith('/api') ||
    url.pathname.includes('/ws') ||
    url.pathname.includes('hot-update') ||
    url.pathname.includes('@vite') ||
    url.pathname.includes('@react-refresh')
  ) {
    return;
  }

  // Network-first with cache fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
          return new Response('Offline', { status: 503, statusText: 'Offline' });
        });
      })
  );
});
