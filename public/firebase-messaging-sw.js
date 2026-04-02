/* eslint-disable no-undef */
// Firebase Messaging Service Worker
// Handles background push notifications for new lead assignments

importScripts('https://www.gstatic.com/firebasejs/11.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.8.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyDV5CvifeD3tV4tkfKidYJHlVAYiS39GxM',
  authDomain: 'gen-lang-client-0949561148.firebaseapp.com',
  projectId: 'gen-lang-client-0949561148',
  storageBucket: 'gen-lang-client-0949561148.firebasestorage.app',
  messagingSenderId: '408821277977',
  appId: '1:408821277977:web:152cc94cc7686c3e4b1188',
});

const messaging = firebase.messaging();

// Handle background messages (when tab is not focused / closed)
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw] Background message received:', payload);

  const data = payload.data || {};
  const notification = payload.notification || {};

  const title = notification.title || data.title || '🔔 New Lead Assigned';
  const body =
    notification.body ||
    data.body ||
    'A new lead has been assigned to you.';

  const options = {
    body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: `lead-${data.leadId || 'new'}`, // Prevents duplicate notifications
    data: {
      url: data.url || '/',
      leadId: data.leadId,
    },
    actions: [
      { action: 'view', title: 'View Lead' },
    ],
    vibrate: [200, 100, 200],
    requireInteraction: true, // Keep notification visible until user interacts
  };

  self.registration.showNotification(title, options);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus existing tab if one is open
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new tab
      return clients.openWindow(url);
    })
  );
});
