// public/firebase-messaging-sw.js
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js");

// 🔐 HARDCODE CONFIG HERE (import.meta.env DOES NOT WORK IN SW)
firebase.initializeApp({
  apiKey: "AIzaSyBiEVMf5QSHICm448m-n67-15KZ6wgVBew",
  authDomain: "hosta-7d497.firebaseapp.com",
  projectId: "hosta-7d497",
  storageBucket: "hosta-7d497.firebasestorage.app",
  messagingSenderId: "951235379752",
  appId: "1:951235379752:web:2e67b2b522d65f3dafab1d",
  measurementId: "G-NTYMKX72ZE",
});

const messaging = firebase.messaging();

// 🔔 Background notification
self.addEventListener("push", (event) => {
  
  let payload = {};
  try {
    payload = event.data.json();
    console.log('📨 Payload:', payload);
  } catch (error) {
    console.error('❌ Failed to parse push payload:', error);
    return;
  }

  const title = payload.notification?.title || payload.data?.title || "New Booking";
  const body = payload.notification?.body || payload.data?.body || "You have a new booking request";

  console.log('📨 Notification title:', payload);

  const options = {
    body: body,
    vibrate: [200, 100, 200],
    requireInteraction: true,
    data: payload.data || {},
    actions: [
      { action: "accept", title: "✅ Accept Booking" },
      { action: "reject", title: "❌ Cancel" },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// 🔘 Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  console.log('🔘 Notification clicked:', event.action);
  event.notification.close();

  const bookingData = event.notification.data || {};

  if (event.action === "accept") {
    event.waitUntil(
      clients.matchAll({ type: "window", includeUncontrolled: true })
        .then(windowClients => {
          for (let client of windowClients) {
            if (client.url.includes(self.location.origin) && "focus" in client) {
              client.focus();
              client.postMessage({
                action: "openApproveModal",
                bookingData: bookingData
              });
              return;
            }
          }
          if (clients.openWindow) {
            return clients.openWindow("/?action=approve&modal=approve");
          }
        })
    );
  } else if (event.action === "reject") {
    event.waitUntil(
      clients.matchAll({ type: "window", includeUncontrolled: true })
        .then(windowClients => {
          for (let client of windowClients) {
            if (client.url.includes(self.location.origin) && "focus" in client) {
              client.focus();
              client.postMessage({
                action: "openRejectModal",
                bookingData: bookingData
              });
              return;
            }
          }
          if (clients.openWindow) {
            return clients.openWindow("/?action=reject&modal=reject");
          }
        })
    );
  } else {
    // Default: open the app
    event.waitUntil(
      clients.matchAll({ type: "window", includeUncontrolled: true })
        .then(windowClients => {
          for (let client of windowClients) {
            if (client.url.includes(self.location.origin) && "focus" in client) {
              client.focus();
              return;
            }
          }
          if (clients.openWindow) {
            return clients.openWindow("/");
          }
        })
    );
  }
});

// 🚀 Service Worker Install/Activate events
self.addEventListener("install", (event) => {
  console.log("📦 Service Worker installed");
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  console.log("⚡ Service Worker activated");
  event.waitUntil(self.clients.claim());
});