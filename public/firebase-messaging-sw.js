// firebase-messaging-sw.js

importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js");

// 🔐 SAME CONFIG HERE (IMPORTANT)
firebase.initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
});

const messaging = firebase.messaging();

// 🔔 Background notification
self.addEventListener("push", (event) => {
  const payload = event.data.json();

  const title =
    payload.notification?.title || payload.data?.title || "New Booking";

  const options = {
    body: payload.notification?.body || payload.data?.body || "",
    icon: "/favicon.ico",
    badge: "/badge.png",
    requireInteraction: true,
    actions: [
      { action: "accept", title: "✅ Accept Booking" },
      { action: "reject", title: "❌ Cancel" },
    ],
    data: payload.data,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// 🔘 Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "accept") {
    // Open the ApproveRequestModal
    event.waitUntil(
      clients.matchAll({ type: "window", includeUncontrolled: true })
        .then(windowClients => {
          // Check if there's already a tab open with our app
          for (let client of windowClients) {
            if (client.url.includes(self.location.origin) && "focus" in client) {
              // Found existing tab, focus it and send message to open ApproveRequestModal
              client.focus();
              client.postMessage({
                action: "openApproveModal",
                bookingData: event.notification.data
              });
              return;
            }
          }
          // No existing tab, open a new one with a special query param
          if (clients.openWindow) {
            return clients.openWindow("/?action=approve&modal=approve");
          }
        })
    );
  } else if (event.action === "reject") {
    // Open the RejectRequestModal
    event.waitUntil(
      clients.matchAll({ type: "window", includeUncontrolled: true })
        .then(windowClients => {
          // Check if there's already a tab open with our app
          for (let client of windowClients) {
            if (client.url.includes(self.location.origin) && "focus" in client) {
              // Found existing tab, focus it and send message to open RejectRequestModal
              client.focus();
              client.postMessage({
                action: "openRejectModal",
                bookingData: event.notification.data
              });
              return;
            }
          }
          // No existing tab, open a new one with a special query param
          if (clients.openWindow) {
            return clients.openWindow("/?action=reject&modal=reject");
          }
        })
    );
  }
});