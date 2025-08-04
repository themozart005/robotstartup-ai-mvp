// Service Worker for RoboStartup AI
// Simple implementation to avoid caching issues during development

const CACHE_NAME = 'robostartup-v1';

self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Install event');
  // Skip waiting to activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker: Activate event');
  // Clean up old caches
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control of all clients
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // For now, just let all requests go to the network
  // This prevents caching issues during development
  event.respondWith(
    fetch(event.request).catch(error => {
      console.error('Fetch failed:', error);
      throw error;
    })
  );
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});