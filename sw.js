// Service worker for the CBT Technical Library — makes the dashboard and
// any quiz you've already opened once available offline.
//
// Bump this version string whenever index.html/CBT_Player.html change in a
// way you want users to pick up immediately (it forces old caches to clear).
const CACHE_VERSION = 'cbt-cache-v1';
const APP_SHELL = [
  'index.html',
  'CBT_Player.html',
  'manifest.json',
  'hero-aircraft.jpg',
  'footer-aircraft.jpg',
  'icons/icon-192.png',
  'icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL)).catch(()=>{})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_VERSION).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // don't touch cross-origin requests

  // Quiz data files (data/*.js): stale-while-revalidate — serve the cached
  // copy instantly if we have one (so a quiz you've opened before still
  // opens offline), while quietly fetching a fresh copy in the background
  // for next time.
  if (url.pathname.includes('/data/') && url.pathname.endsWith('.js')) {
    event.respondWith(
      caches.open(CACHE_VERSION).then(async (cache) => {
        const cached = await cache.match(req);
        const network = fetch(req).then((res) => {
          if (res && res.ok) cache.put(req, res.clone());
          return res;
        }).catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  // Everything else (the dashboard, the player, images): network-first so
  // you always get the latest version when online, falling back to the
  // cached copy when you don't have a connection.
  event.respondWith(
    fetch(req).then((res) => {
      if (res && res.ok) {
        const copy = res.clone();
        caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy));
      }
      return res;
    }).catch(() => caches.match(req))
  );
});
