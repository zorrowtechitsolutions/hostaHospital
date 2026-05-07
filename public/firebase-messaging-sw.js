// firebase-messaging-sw.js

importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js");

// 🔐 SAME CONFIG HERE (IMPORTANT)
firebase.initializeApp({
  apiKey: "AIzaSyCdDQAZSaahh4STtBfEJfP1gPlRlD5OKzc",
  authDomain: "push-notification-d6a4c.firebaseapp.com",
  projectId: "push-notification-d6a4c",
  storageBucket: "push-notification-d6a4c.firebasestorage.app",
  messagingSenderId: "352069839114",
  appId: "1:352069839114:web:1e50cfab5c15138630f2f3",
  measurementId: "G-VPZX6RY7W6",
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