// CinVerse Service Worker
// Automatically unregisters legacy Monetag ad push notification worker to ensure clean browsing
self.addEventListener('install', function () {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    self.registration.unregister().then(function () {
      return self.clients.claim();
    })
  );
});
