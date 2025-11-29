// Versión básica de Service Worker para PWA
const CACHE_NAME = 'smartur-cache-v1';

// Archivos básicos a cachear (puedes ajustar esta lista según tu app)
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(URLS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      )
    )
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Si está en caché, responde con eso; si no, haz la petición normalmente
      return response || fetch(event.request);
    })
  );
});


