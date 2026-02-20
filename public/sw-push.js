// Custom Service Worker for Push Notifications
// This file must be in the public directory

self.addEventListener('push', function(event) {
  let data = { title: 'DATAPONTO', body: 'Nova notificação' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/pwa-icon-192.png',
    badge: '/pwa-icon-192.png',
    vibrate: [200, 100, 200],
    tag: data.type || 'default',
    renotify: true,
    data: {
      type: data.type,
      url: data.type === 'message' ? '/chat' : '/agenda',
    },
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const url = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(windowClients) {
      // Check if there is already a window open
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // If no window is open, open one
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
