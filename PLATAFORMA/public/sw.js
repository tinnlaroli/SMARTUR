// SMARTUR Empresa — Service Worker
// Strategy:
//   - API calls          → network-first
//   - Hashed assets      → cache-first  (safe: hash changes with content)
//   - HTML routes        → network-first (prevents stale shell after deploy)
const CACHE_NAME = 'smartur-empresa-v2';

self.addEventListener('install', (event) => {
    // Do not pre-cache HTML — network-first strategy handles freshness
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (request.method !== 'GET') return;

    const url = new URL(request.url);

    // Network-first for API calls
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(request).catch(() => caches.match(request))
        );
        return;
    }

    // Cache-first for Vite hashed assets (/assets/*.js, /assets/*.css, etc.)
    // These are content-addressed so a cached hit is always correct.
    if (url.pathname.startsWith('/assets/')) {
        event.respondWith(
            caches.match(request).then((cached) => {
                if (cached) return cached;
                return fetch(request)
                    .then((response) => {
                        if (response.ok) {
                            const clone = response.clone();
                            caches.open(CACHE_NAME).then((c) => c.put(request, clone));
                        }
                        return response;
                    })
                    .catch(() => new Response('asset not found', { status: 404 }));
            })
        );
        return;
    }

    // Network-first for HTML routes (/, /empresa/dashboard, etc.)
    // Always fetches fresh HTML so new deploys take effect immediately.
    // Falls back to cached shell only when fully offline.
    event.respondWith(
        fetch(request)
            .then((response) => {
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((c) => c.put(request, clone));
                }
                return response;
            })
            .catch(() =>
                caches.match(request).then((cached) => cached ?? caches.match('/'))
            )
    );
});
