/* VIDYORA Progressive Web App Service Worker
 * Safe cache versioning + static app-shell caching + offline fallback.
 * SECURITY: Never caches /api/*, Firebase Auth, Firestore, or private student data.
 */

const CACHE_VERSION = 'vidyora-v1-dev';
const STATIC_CACHE = `vidyora-static-${CACHE_VERSION}`;
const FONT_CACHE = `vidyora-fonts-${CACHE_VERSION}`;

const CORE_PRECACHE_URLS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.webmanifest',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-192.png',
  '/icon-maskable-512.png',
  '/apple-touch-icon.png',
  '/favicon-32x32.png',
];

// Build pipeline injects hashed production JS/CSS assets here during `vite build`.
const BUILD_PRECACHE_URLS = /* __VIDYORA_BUILD_ASSETS__ */ [];

const NEVER_CACHE_HOST_PATTERNS = [
  /firestore\.googleapis\.com$/i,
  /identitytoolkit\.googleapis\.com$/i,
  /securetoken\.googleapis\.com$/i,
  /firebaseinstallations\.googleapis\.com$/i,
  /firebase\.googleapis\.com$/i,
  /\.firebaseapp\.com$/i,
  /generativelanguage\.googleapis\.com$/i,
  /youtube\.com$/i,
  /youtu\.be$/i,
  /googlevideo\.com$/i,
];

const NEVER_CACHE_PATH_PATTERNS = [
  /^\/api(\/|$)/i,
  /^\/__\//i,
  /^\/auth(\/|$)/i,
  /^\/admin(\/|$)/i,
];

const FONT_HOSTS = new Set(['fonts.googleapis.com', 'fonts.gstatic.com']);

const STATIC_ASSET_EXTENSIONS = /\.(?:js|mjs|css|png|jpg|jpeg|webp|svg|ico|woff|woff2|webmanifest)$/i;

function shouldNeverCache(request, url) {
  if (request.method !== 'GET') return true;
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return true;
  if (request.headers && request.headers.has('Authorization')) return true;

  if (NEVER_CACHE_HOST_PATTERNS.some((pattern) => pattern.test(url.hostname))) {
    return true;
  }

  if (
    url.origin === self.location.origin &&
    NEVER_CACHE_PATH_PATTERNS.some((pattern) => pattern.test(url.pathname))
  ) {
    return true;
  }

  return false;
}

self.addEventListener('install', (event) => {
  const allUrls = Array.from(
    new Set([
      ...CORE_PRECACHE_URLS,
      ...(Array.isArray(BUILD_PRECACHE_URLS) ? BUILD_PRECACHE_URLS : []),
    ])
  );

  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) =>
        Promise.allSettled(
          allUrls.map((url) =>
            cache.add(new Request(url, { cache: 'reload' })).catch(() => undefined)
          )
        )
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  const allowedCaches = new Set([STATIC_CACHE, FONT_CACHE]);
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('vidyora-') && !allowedCaches.has(key))
            .map((key) => caches.delete(key))
        )
      )
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
  const url = new URL(request.url);

  // Strict security guard: pass sensitive/API/Firebase/auth requests straight to network.
  if (shouldNeverCache(request, url)) {
    return;
  }

  // 1. Google Fonts: Cache-First with safe opaque/ok check
  if (FONT_HOSTS.has(url.hostname)) {
    event.respondWith(
      caches.open(FONT_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const response = await fetch(request);
          if (response && (response.ok || response.type === 'opaque')) {
            cache.put(request, response.clone()).catch(() => undefined);
          }
          return response;
        } catch {
          return new Response('', { status: 503, statusText: 'Offline' });
        }
      })
    );
    return;
  }

  // Only cache same-origin resources beyond fonts
  if (url.origin !== self.location.origin) {
    return;
  }

  // Explicit offline page route
  if (url.pathname === '/offline.html') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(STATIC_CACHE);
        return (await cache.match('/offline.html')) || new Response('Offline', { status: 503 });
      })
    );
    return;
  }

  // 2. Navigation requests: Network-First so fresh updates load immediately,
  // falling back to cached SPA shell (/index.html) or /offline.html when offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(async (response) => {
          if (response && response.ok && response.type === 'basic') {
            const cache = await caches.open(STATIC_CACHE);
            cache.put('/index.html', response.clone()).catch(() => undefined);
          }
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(STATIC_CACHE);
          const cachedShell = (await cache.match('/index.html')) || (await cache.match('/'));
          if (cachedShell) return cachedShell;
          const offlineFallback = await cache.match('/offline.html');
          if (offlineFallback) return offlineFallback;
          return new Response('VIDYORA is currently offline.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          });
        })
    );
    return;
  }

  // 3. Same-origin static assets: Stale-While-Revalidate
  if (
    STATIC_ASSET_EXTENSIONS.test(url.pathname) ||
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/src/assets/')
  ) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const networkPromise = fetch(request)
          .then((response) => {
            if (response && response.ok && response.type === 'basic') {
              cache.put(request, response.clone()).catch(() => undefined);
            }
            return response;
          })
          .catch(() => undefined);

        if (cached) {
          event.waitUntil(networkPromise);
          return cached;
        }

        const networkResponse = await networkPromise;
        if (networkResponse) return networkResponse;
        return new Response('', { status: 503, statusText: 'Offline' });
      })
    );
  }
});
