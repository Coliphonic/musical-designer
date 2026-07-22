// Service worker for Song Plot (Musical Designer).
//
// Update model (v223+): the app shell (HTML/CSS/JS) is served
// stale-while-revalidate — every launch returns the cached copy instantly AND
// fetches a fresh copy in the background, so a new deploy is picked up on its
// own. Paired with the auto-reload wiring in index.html (which reloads open
// clients when a newly deployed worker takes control), this removes the need to
// cache-bust by hand or reinstall the iOS PWA after a deploy. Immutable assets
// (fonts, dictionaries, icons) stay cache-first.
//
// CACHE no longer needs bumping every deploy for correctness. Bump it only to
//   (a) force an immediate reload-to-latest THIS launch rather than the next, or
//   (b) hard-invalidate every cached asset at once.
const CACHE = 'songplot-v231';

// Precached on install so the very first (offline) launch works. cmudict.txt
// (2MB) and thesaurus.txt (9MB) are cached lazily at runtime instead.
const SHELL = [
  '/index.html',
  '/styles.css',
  '/app.js',
  '/data.js',
  '/lyric.js',
  '/thesaurus.js',
  '/defs.js',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/fonts/CourierPrimeSans-Regular.ttf',
  '/fonts/CourierPrimeSans-Bold.ttf',
  '/fonts/CourierPrimeSans-Italic.ttf',
  '/fonts/CourierPrimeSans-BoldItalic.ttf',
  '/fonts/iAWriterDuo-Regular.woff2',
  '/fonts/iAWriterDuo-Bold.woff2',
  '/fonts/iAWriterDuo-Italic.woff2',
  '/fonts/iAWriterDuo-BoldItalic.woff2',
  // Board card notes. Only the regular cut is precached — the board never sets
  // bold or italic on a note, so those cuts stay on-demand like the book faces.
  '/fonts/AtkinsonHyperlegible-Regular.woff2',
  '/fonts/AtkinsonHyperlegible-Regular-ext.woff2',
];

// Shell code that changes on deploy — served stale-while-revalidate so it keeps
// itself current. Everything else static (fonts, icons, dictionaries) is
// immutable and served cache-first.
const isShellCode = (pathname) => /\.(?:js|css|html|webmanifest)$/.test(pathname);

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

// Stale-while-revalidate: return the cached copy immediately (if any) while
// refreshing the cache in the background; offline, fall back to the cached copy.
const staleWhileRevalidate = (req) =>
  caches.open(CACHE).then((cache) =>
    cache.match(req).then((hit) => {
      const network = fetch(req).then((res) => {
        if (res && res.ok && res.type === 'basic') cache.put(req, res.clone());
        return res;
      }).catch(() => hit);
      return hit || network;
    })
  );

// Cache-first for immutable assets: serve from cache, else fetch and store.
const cacheFirst = (req) =>
  caches.match(req).then((hit) => hit || fetch(req).then((res) => {
    if (res && res.ok && res.type === 'basic') {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy));
    }
    return res;
  }));

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return; // let writes pass through

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // third-party: ignore
  if (url.pathname.startsWith('/api/')) return;     // data must always be fresh

  // Navigations: network-first so login/redirects work, falling back to the
  // cached shell when offline.
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match('/index.html')));
    return;
  }

  // App-shell code: stale-while-revalidate. Everything else static: cache-first.
  e.respondWith(isShellCode(url.pathname) ? staleWhileRevalidate(req) : cacheFirst(req));
});
