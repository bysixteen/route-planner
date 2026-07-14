/* Route Planner service worker — runtime caching for offline road use.
 * Bump VERSION to invalidate old caches on deploy. */
const VERSION = "v1";
const RUNTIME = `runtime-${VERSION}`;

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => !k.endsWith(VERSION)).map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

const isMapbox = (u) =>
  u.hostname.endsWith("mapbox.com") || u.hostname.endsWith("tiles.mapbox.com");
const isWeather = (u) =>
  u.hostname.endsWith("open-meteo.com");
const isSupabase = (u) => u.hostname.endsWith("supabase.co");

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Navigations → network-first, fall back to cached page then the app shell.
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(req);
          (await caches.open(RUNTIME)).put(req, res.clone());
          return res;
        } catch {
          return (
            (await caches.match(req)) ||
            (await caches.match("/")) ||
            Response.error()
          );
        }
      })(),
    );
    return;
  }

  // Cross-origin: map tiles/styles + weather → stale-while-revalidate;
  // Supabase trip data → network-first so the itinerary loads offline.
  if (url.origin !== self.location.origin) {
    if (isMapbox(url) || isWeather(url)) {
      event.respondWith(staleWhileRevalidate(req));
    } else if (isSupabase(url)) {
      event.respondWith(networkFirst(req));
    }
    return;
  }

  // Same-origin static assets → cache-first.
  if (
    url.pathname.startsWith("/_next/static") ||
    url.pathname.startsWith("/icons") ||
    /\.(?:js|css|woff2?|png|svg|ico|jpe?g|webp)$/.test(url.pathname)
  ) {
    event.respondWith(cacheFirst(req));
    return;
  }

  // Everything else same-origin → network-first with cache fallback.
  event.respondWith(networkFirst(req));
});

async function cacheFirst(req) {
  const cached = await caches.match(req);
  if (cached) return cached;
  const res = await fetch(req);
  if (res.ok) (await caches.open(RUNTIME)).put(req, res.clone());
  return res;
}

async function networkFirst(req) {
  try {
    const res = await fetch(req);
    if (res.ok) (await caches.open(RUNTIME)).put(req, res.clone());
    return res;
  } catch {
    return (await caches.match(req)) || Response.error();
  }
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(RUNTIME);
  const cached = await cache.match(req);
  const network = fetch(req)
    .then((res) => {
      if (res.ok) cache.put(req, res.clone());
      return res;
    })
    .catch(() => cached);
  return cached || network;
}
