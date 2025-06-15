const CACHE_NAME = 'agroconecta-cache-v1';
const urlsToCache = [
  '/', 
  '/index.html',
  '/style.css',
  '/main.js',
  '/login.html',
  '/login.js',
  '/cadastro.html',
  '/cadastro.js',
  '/cadastro-produtor.html',
  '/cadastro-produtor.js',
  '/carrinho.html',
  '/carrinho.js',
  '/conta.html',
  '/conta.js',
  '/produtor.html',
  '/produtor.js',
  '/icones/icon-192x192.png',
  '/icones/icon-512x512.png',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap', 
 
  'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css',
  'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js'

];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting(); 
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});


self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  if (urlsToCache.includes(requestUrl.pathname) || urlsToCache.includes(requestUrl.href) || requestUrl.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            return response;
          }
          return fetch(event.request).then(
            networkResponse => {
              if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && networkResponse.type !== 'cors') {
                return networkResponse;
              }
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
              return networkResponse;
            }
          ).catch(error => {
            console.error('Fetch failed; returning offline page instead.', error);
          });
        })
    );
  } else {
    return;
  }
});