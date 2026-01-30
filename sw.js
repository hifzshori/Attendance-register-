const CACHE_NAME = 'class-register-v1';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/index.tsx',
  '/manifest.json',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
  'https://cdn.tailwindcss.com'
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(URLS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - Cache First strategy for static, Network Only for API
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. API Calls (Netlify Functions) -> Network Only
  // We do not want to cache dynamic data like attendance or chat messages.
  if (url.pathname.startsWith('/.netlify/functions/')) {
    return; // Fallback to browser default (network)
  }

  // 2. Static Assets -> Cache First, Fallback to Network
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        // Check if we received a valid response
        if (
          !networkResponse ||
          networkResponse.status !== 200 ||
          networkResponse.type !== 'basic' && networkResponse.type !== 'cors'
        ) {
          return networkResponse;
        }

        // Clone the response to put it in the cache
        const responseToCache = networkResponse.clone();

        caches.open(CACHE_NAME).then((cache) => {
          // Only cache http/https requests (skip chrome-extension:// etc)
          if (event.request.url.startsWith('http')) {
             cache.put(event.request, responseToCache);
          }
        });

        return networkResponse;
      }).catch(() => {
        // Optional: Return a specific offline fallback page here if desired
        // For this app, the UI might load from cache but show API errors, which is handled in components.
      });
    })
  );
});