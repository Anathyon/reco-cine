/* Service worker do Reco Cine: cache de imagens e de respostas de API para uso offline. */
const CACHE_VERSION = 'v7';
const API_CACHE = `reco-cine-api-${CACHE_VERSION}`;
const IMAGE_CACHE = `reco-cine-images-${CACHE_VERSION}`;
const MAX_IMAGES = 400;

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((n) => !n.endsWith(CACHE_VERSION)).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

async function trimCache(name, max) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  if (keys.length > max) await Promise.all(keys.slice(0, keys.length - max).map((k) => cache.delete(k)));
}

// API: rede primeiro, cache como reserva offline.
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw err;
  }
}

// Imagens: cache primeiro (não mudam), rede como reserva.
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok || response.type === 'opaque') {
    const cache = await caches.open(IMAGE_CACHE);
    await cache.put(request, response.clone());
    trimCache(IMAGE_CACHE, MAX_IMAGES);
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  const API_PREFIXES = ['/api/tmdb/', '/api/anime/', '/api/search/', '/api/translate/'];
  if (url.origin === self.location.origin && API_PREFIXES.some((p) => url.pathname.startsWith(p))) {
    event.respondWith(networkFirst(request));
  } else if (url.hostname === 'image.tmdb.org' || url.hostname === 'cdn.myanimelist.net') {
    event.respondWith(cacheFirst(request));
  }
});
