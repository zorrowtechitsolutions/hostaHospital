// firebase.js - Updated version

// 🔥 Firebase setup
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// 🔊 Sound
const notificationSound = new Audio("/notification.mp3");

// 🔐 Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCdDQAZSaahh4STtBfEJfP1gPlRlD5OKzc",
  authDomain: "push-notification-d6a4c.firebaseapp.com",
  projectId: "push-notification-d6a4c",
  storageBucket: "push-notification-d6a4c.firebasestorage.app",
  messagingSenderId: "352069839114",
  appId: "1:352069839114:web:1e50cfab5c15138630f2f3",
  measurementId: "G-VPZX6RY7W6",
};

// 🚀 Initialize Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// 🔑 Request Permission
export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) return "unsupported";

  const permission = await Notification.requestPermission();
  console.log("Permission:", permission);
  return permission;
};

// 🔑 Generate Token
export const generateToken = async () => {
  const permission = await Notification.requestPermission();

  if (permission === "granted") {
    const token = await getToken(messaging, {
      vapidKey:
        "BHrLuvLXdesM0T4-Uc7xlChllzdQZuN5utfCZ2Lh1j__II3qC2RCXFsI5pdxSipLvHYt3yMgo6En1GqwQe8U97I",
    });

    console.log("🔥 TOKEN:", token);
    localStorage.setItem("fcm_token", token);
    return token;
  } else {
    console.log("❌ Permission denied");
    return null;
  }
};

// 🔔 Foreground listener (FIXED ✅ - removed Chrome notification)
export const listenMessages = (callback) => {
  const unsubscribe = onMessage(messaging, (payload) => {
    console.log("📩 Foreground message:", payload);

    const title =
      payload?.notification?.title || payload?.data?.title;

    const body =
      payload?.notification?.body || payload?.data?.body;

    // ❌ REMOVED the Chrome notification from foreground
    // Only play sound and trigger the custom modal
    // if (Notification.permission === "granted") {
    //   new Notification(title, {
    //     body,
    //     icon: "/favicon.ico",
    //     requireInteraction: true,
    //   });
    // }

    // 🔊 Play sound only
    try {
      notificationSound.pause();
      notificationSound.currentTime = 0;
      notificationSound.play().catch(() => {});
    } catch (err) {
      console.log("Sound error:", err);
    }

    // This will still show your custom modal in App.jsx
    if (callback) callback(payload);
  });

  return unsubscribe;
};