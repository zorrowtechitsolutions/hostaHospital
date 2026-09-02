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

// ✅ Use Firebase's onBackgroundMessage instead of raw push listener
messaging.onBackgroundMessage((payload) => {

  const title = payload.data?.title || 
                payload.notification?.title || 
                "New Booking";
  
  const body = payload.data?.body || 
               payload.notification?.body || 
               "You have a new booking request";

  const options = {
    body: body,
    icon: "/logo192.png",
    badge: "/logo192.png",
    vibrate: [200, 100, 200],
    requireInteraction: true,
    data: payload.data || {},
    actions: [
      { action: "accept", title: "✅ Accept Booking" },
      { action: "reject", title: "❌ Cancel" },
    ],
  };

  return self.registration.showNotification(title, options);
});

// 🔘 Handle notification clicks
self.addEventListener("notificationclick", (event) => {
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
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});