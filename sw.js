const CACHE_NAME = 'water-quest-v5';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './src/water-core.js',
  './src/day-session.js',
  './src/reminder-rules.js',
  './src/invite-core.js',
  './src/push-client.js',
  './src/push-config.js',
  './manifest.webmanifest',
  './icons/icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

self.addEventListener('push', (event) => {
  event.waitUntil(
    self.registration.showNotification('Water Quest', {
      body: 'Время воды. Добавь стакан и продолжай квест дня.',
      icon: './icons/icon.svg',
      badge: './icons/icon.svg',
      tag: 'water-quest-hourly-reminder',
      renotify: true
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((client) => client.url.includes(self.location.origin));
      return existing ? existing.focus() : self.clients.openWindow('./');
    })
  );
});
