const CACHE_NAME = 'smartur-v1';
const RUNTIME_CACHE = 'smartur-runtime-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.png'
];

// Instalar
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activar
self.addEventListener('activate', (event) => {
  console.log('[SW] Activando...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map((name) => {
            console.log('[SW] Eliminando caché:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});


self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);


  const isAPI =
    url.pathname.includes('/api/v2/') ||
    url.port === '5000' ||
    url.port === '3000' ||
    url.hostname !== self.location.hostname;

  if (isAPI) {
    return; // no llamar respondWith = el navegador usa la red sin SW
  }

  // Cache First para estáticos
  event.respondWith(
    caches.match(request)
      .then((cached) => {
        if (cached) {
          console.log('[SW] Desde caché:', request.url);
          return cached;
        }

        return fetch(request).then((response) => {
          if (!response || response.status !== 200) {
            return response;
          }

          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });

          return response;
        });
      })
      .catch(() => caches.match('/index.html'))
  );
});

// Mensajes
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});