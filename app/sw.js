// Service worker for Song Plot (Musical Designer).
// App-shell cache for offline launch + fast loads. Bump CACHE on each deploy
// so clients pick up new HTML/CSS/JS.
const CACHE = 'songplot-v36';

// Core static assets. cmudict.txt (2MB) is intentionally left out of precache
// and cached lazily at runtime when the rhyme tools first fetch it.
const SHELL = [
  '/index.html',
  '/styles.css',
  '/app.js',
  '/data.js',
  '/lyric.js',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return; // let writes pass through

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // third-party: ignore

  // Never cache the API or auth — data must be fresh.
  if (url.pathname.startsWith('/api/')) return;

  // Navigations: network-first so login/redirects work, fall back to the
  // cached shell when offline.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Static assets: cache-first, then network (and cache the result).
  e.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        if (res && res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      });
    })
  );
});
