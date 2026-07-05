// firebase.js - Cleaned version
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// Sound
const notificationSound = new Audio("/notification.mp3");

// Firebase config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Request Permission
export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) return "unsupported";

  const permission = await Notification.requestPermission();
  return permission;
};

// Generate Token
export const generateToken = async () => {
  try {
    const permission = await Notification.requestPermission();

    if (permission !== "granted") return null;

    const registration = await navigator.serviceWorker.ready;

    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    return token;
  } catch (err) {
    return null;
  }
};

// Foreground listener
export const listenMessages = (callback) => {
  const unsubscribe = onMessage(messaging, (payload) => {
    // Play sound
    try {
      notificationSound.pause();
      notificationSound.currentTime = 0;
      notificationSound.play().catch(() => {});
    } catch (err) {
      // Silently handle sound error
    }

    // Trigger custom modal callback
    if (callback) callback(payload);
  });

  return unsubscribe;
};