const CACHE_NAME = 'cat-food-reminder-v1';
const BASE_PATH = self.location.pathname.replace('/service-worker.js', '');

const urlsToCache = [
  BASE_PATH + '/',
  BASE_PATH + '/index.html',
  BASE_PATH + '/styles.css',
  BASE_PATH + '/app.js',
  BASE_PATH + '/manifest.json',
  BASE_PATH + '/icon-192.png',
  BASE_PATH + '/icon-512.png'
];

// نصب Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// فعال‌سازی Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// مدیریت درخواست‌ها
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // بازگرداندن از cache یا fetch از شبکه
        return response || fetch(event.request);
      })
  );
});

// مدیریت نوتیفیکیشن
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // اگر پنجره باز است، focus کن
        const basePath = self.location.pathname.replace('/service-worker.js', '');
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          const url = new URL(client.url);
          if (url.pathname === basePath + '/' || url.pathname === basePath + '/index.html' || url.pathname.endsWith('/index.html')) {
            if ('focus' in client) {
              return client.focus();
            }
          }
        }
        // در غیر این صورت، پنجره جدید باز کن
        if (clients.openWindow) {
          return clients.openWindow(basePath + '/');
        }
      })
  );
});

// مدیریت push notifications (برای آینده)
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'یادآور غذای گربه';
  const basePath = self.location.pathname.replace('/service-worker.js', '');
  const options = {
    body: data.body || 'زمان غذا دادن به گربه شما!',
    icon: basePath + '/icon-192.png',
    badge: basePath + '/icon-192.png',
    vibrate: [200, 100, 200],
    data: data
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

