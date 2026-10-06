const CACHE_NAME = 'citizenshipai-shell-v5';
const APP_SHELL = [
  '/', '/index.html', '/manifest.webmanifest', '/app-icon-192.png', '/app-icon-512.png', '/favicon.svg',
  '/fonts/public-sans/PublicSans-Regular.woff2',
  '/fonts/public-sans/PublicSans-SemiBold.woff2',
  '/fonts/public-sans/PublicSans-Bold.woff2',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key.startsWith('citizenshipai-shell-') && key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) {
    return;
  }

  // Audio and video players use byte-range (206) responses. Cache Storage only
  // accepts complete responses, so let the browser stream media directly.
  if (request.headers.has('range') || request.destination === 'audio' || request.destination === 'video') {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', copy));
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const validType = (response) => request.destination === 'style' ? (response.headers.get('content-type') || '').includes('text/css') : request.destination === 'script' ? /javascript/.test(response.headers.get('content-type') || '') : true;
      if (cached && validType(cached)) return cached;
      return fetch(request).then((response) => {
        if (response.ok && response.status === 200 && validType(response)) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});
