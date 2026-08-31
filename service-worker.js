/* Lotus service worker — single source of truth for offline behaviour.
 *
 * Strategy:
 *   - Precache the app shell + vendored libraries on install.
 *   - Navigation requests: network-first, falling back to the cached shell
 *     so the app opens offline and picks up new deploys when online.
 *   - Other same-origin GET requests: stale-while-revalidate.
 *   - Cross-origin requests are left to the network (never cached here).
 *   - The page is told when a new worker is waiting; it shows a Refresh
 *     prompt and posts SKIP_WAITING when the user accepts.
 *
 * Bump CACHE whenever the precached asset list changes.
 */
const CACHE = 'lotus-2026-08-31b';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './vendor/marked.min.js',
  './vendor/jszip.min.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => Promise.all(
      // Bypass the HTTP cache so a precache never stores a stale response.
      ASSETS.map((url) => cache.add(new Request(url, { cache: 'reload' })))
    ))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // App navigations: try the network, fall back to the cached shell.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put('./index.html', copy));
          return response;
        })
        .catch(() => caches.match('./index.html', { ignoreSearch: true })
          .then((cached) => cached || caches.match('./')))
    );
    return;
  }

  // Everything else same-origin: serve from cache, refresh in the background.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
