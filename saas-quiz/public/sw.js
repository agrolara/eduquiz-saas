self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, icon, data } = event.data.payload;
    
    event.waitUntil(
      self.registration.showNotification(title, {
        body,
        icon: icon || '/favicon.svg',
        data: data || {},
        vibrate: [200, 100, 200],
        badge: '/favicon.svg',
        tag: 'eduquiz-session-start'
      })
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const clickAction = event.notification.data?.clickAction || '/';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus if tab is open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            payload: event.notification.data
          });
          return client.focus();
        }
      }
      // Otherwise open a new tab
      if (self.clients.openWindow) {
        return self.clients.openWindow(clickAction);
      }
    })
  );
});
