/*
 * Cedar Hall service worker.
 *
 * What this buys the dormitory: the app opens from the Android home screen like
 * an installed app, and it opens *fast* — the shell comes off the device rather
 * than off the network, which matters on a dorm phone walking the corridors.
 *
 * What it deliberately does not do: cache records. Every check, roll call and
 * pass lives behind `/api/state`, shared between the Dean's laptop and every
 * phone. A stale roll call read out of a cache would be worse than no roll call
 * at all, so API traffic always goes to the network and the app's own sync
 * handles being offline.
 */

// Bump this to retire every cache the last version left behind.
const VERSION = 'v2';
const SHELL_CACHE = `cedar-hall-shell-${VERSION}`;
const ASSET_CACHE = `cedar-hall-assets-${VERSION}`;
const CURRENT_CACHES = [SHELL_CACHE, ASSET_CACHE];

/** Enough to paint the app with the network switched off. */
const SHELL_URLS = [
  '/',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(cache =>
      // One missing file should not fail the whole install.
      Promise.all(SHELL_URLS.map(url => cache.add(url).catch(() => undefined)))
    )
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys => Promise.all(keys.filter(k => !CURRENT_CACHES.includes(k)).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// The page asks for the update when the user accepts it, never on its own —
// swapping the worker mid-roll-call would reload the form out from under them.
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

/** The built JS/CSS/fonts/images — hashed filenames, so a hit is always current. */
const isStaticAsset = request =>
  ['script', 'style', 'font', 'image'].includes(request.destination);

/**
 * Network first, cache second: a device with signal always gets the deployed
 * shell, and one without falls back to the last one it saw.
 */
async function handleNavigation(request) {
  try {
    const response = await fetch(request);
    // Keep '/' fresh — it is what an offline launch is served.
    if (response.ok) {
      const cache = await caches.open(SHELL_CACHE);
      cache.put('/', response.clone());
    }
    return response;
  } catch {
    const cached = (await caches.match('/')) || (await caches.match(request));
    if (cached) return cached;
    return new Response(
      '<!doctype html><meta charset="utf-8"><title>Cedar Hall — offline</title>' +
        '<body style="font-family:system-ui;background:#020617;color:#e2e8f0;display:grid;place-items:center;height:100vh;margin:0">' +
        '<p>Cedar Hall is offline. Reconnect and try again.</p>',
      { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 503 }
    );
  }
}

/**
 * Serve the cached copy at once and refresh it in the background, so a second
 * launch is instant and the next one is up to date.
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(ASSET_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then(response => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => undefined);
  return cached || (await network) || Response.error();
}

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Records are never cached — see the note at the top of this file.
  if (url.pathname.startsWith('/api/')) return;

  // Google Identity, and anything else off-origin, is left to the browser.
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }

  if (isStaticAsset(request)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});
