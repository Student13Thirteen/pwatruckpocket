const CACHE_NAME = 'autisti-app-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png?v=2',
  './icons/icon-512.png?v=2'
];

// Installazione e cache dei file
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS_TO_CACHE))
  );
});

// Attivazione e pulizia vecchie cache
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    })
  );
});

// Intercetta le richieste e serve dalla cache se offline
self.addEventListener('fetch', event => {
  // Ignoriamo le richieste API verso PocketBase per la cache statica
  if (event.request.url.includes('/api/')) {
    return; 
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        return cachedResponse || fetch(event.request);
      })
  );
});