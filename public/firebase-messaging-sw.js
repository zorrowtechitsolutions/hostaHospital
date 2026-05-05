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

// 🔔 Background notification (WhatsApp style)
self.addEventListener("push", (event) => {
  const payload = event.data.json();

  const title =
    payload.notification?.title || payload.data?.title || "New Booking";

  const options = {
    body: payload.notification?.body || payload.data?.body || "",
    icon: "/favicon.ico",
    badge: "/badge.png",

    requireInteraction: true, // 🔥 stays until click

    actions: [
      { action: "accept", title: "Accept Booking" },
      { action: "cancel", title: "Cancel" },
    ],

    data: payload.data,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// 🔘 Handle click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  let url = "/";

  if (event.action === "accept") {
    url = "/?action=accept";
  } else if (event.action === "cancel") {
    url = "/?action=cancel";
  }

  event.waitUntil(clients.openWindow(url));
});