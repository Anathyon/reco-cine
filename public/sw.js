const CACHE_NAME = 'reco-cine-v1';
const STATIC_CACHE = 'reco-cine-static-v1';
const DYNAMIC_CACHE = 'reco-cine-dynamic-v1';

const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/favicon.ico'
];

const API_CACHE_DURATION = 1000 * 60 * 30; // 30 minutos

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests
  if (url.hostname === 'api.themoviedb.org') {
    event.respondWith(
      caches.open(DYNAMIC_CACHE)
        .then((cache) => {
          return cache.match(request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                const cachedDate = new Date(cachedResponse.headers.get('sw-cached-date'));
                const now = new Date();
                
                if (now - cachedDate < API_CACHE_DURATION) {
                  return cachedResponse;
                }
              }

              return fetch(request)
                .then((response) => {
                  if (response.ok) {
                    const responseClone = response.clone();
                    const headers = new Headers(responseClone.headers);
                    headers.set('sw-cached-date', new Date().toISOString());
                    
                    const modifiedResponse = new Response(responseClone.body, {
                      status: responseClone.status,
                      statusText: responseClone.statusText,
                      headers: headers
                    });
                    
                    cache.put(request, modifiedResponse);
                  }
                  return response;
                })
                .catch(() => {
                  return cachedResponse || new Response('Offline', { status: 503 });
                });
            });
        })
    );
    return;
  }

  // Handle image requests
  if (url.hostname === 'image.tmdb.org') {
    event.respondWith(
      caches.open(DYNAMIC_CACHE)
        .then((cache) => {
          return cache.match(request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }

              return fetch(request)
                .then((response) => {
                  if (response.ok) {
                    cache.put(request, response.clone());
                  }
                  return response;
                })
                .catch(() => {
                  return new Response('Image not available offline', { status: 503 });
                });
            });
        })
    );
    return;
  }

  // Handle static assets
  if (request.destination === 'document' || 
      request.destination === 'script' || 
      request.destination === 'style' ||
      request.url.includes('_next/static')) {
    
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          return fetch(request)
            .then((response) => {
              if (response.ok) {
                const cache = request.url.includes('_next/static') ? STATIC_CACHE : DYNAMIC_CACHE;
                caches.open(cache)
                  .then((cache) => {
                    cache.put(request, response.clone());
                  });
              }
              return response;
            })
            .catch(() => {
              if (request.destination === 'document') {
                return caches.match('/');
              }
              return new Response('Resource not available offline', { status: 503 });
            });
        })
    );
    return;
  }

  // Default: network first, fallback to cache
  event.respondWith(
    fetch(request)
      .catch(() => {
        return caches.match(request);
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle offline actions when back online
      console.log('Background sync triggered')
    );
  }
});

// Push notifications (for future use)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey
      }
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});