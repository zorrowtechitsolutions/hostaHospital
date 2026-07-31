// src/notification/firebase.js
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

// VAPID Key
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

// Request Permission
export const requestNotificationPermission = async () => {
  try {
    if (!("Notification" in window)) {
      return "unsupported";
    }

    if (Notification.permission === "granted") {
      return "granted";
    }

    if (Notification.permission === "denied") {
      return "denied";
    }

    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('❌ Permission request error:', error);
    return "error";
  }
};

// Generate Token
export const generateToken = async () => {
  try {
    
    // 1. Check permission
    if (Notification.permission !== "granted") {
      return null;
    }

    // 2. Check VAPID key
    if (!VAPID_KEY) {
      return null;
    }

    // 3. Check service worker
    if (!("serviceWorker" in navigator)) {
      return null;
    }

    // 4. Wait for service worker
    let registration;
    try {
      registration = await navigator.serviceWorker.ready;
    } catch (swError) {
      return null;
    }

    if (!registration) {
      return null;
    }

    // 5. Get token
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      return token;
    } else {
      return null;
    }
  } catch (err) {
    console.error('❌ FCM Token generation error:', err.message);
    return null;
  }
};

// Generate token with timeout
export const generateTokenWithTimeout = async (timeoutMs = 10000) => {
  
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error(`FCM token generation timeout (${timeoutMs}ms)`)), timeoutMs)
  );

  try {
    const result = await Promise.race([
      generateToken(),
      timeoutPromise
    ]);
    return result;
  } catch (error) {
    console.warn('⚠️ FCM token generation failed:', error.message);
    return null;
  }
};

// Check if FCM is available
export const isFCMAvailable = () => {
  const hasVapid = !!VAPID_KEY;
  const hasNotification = "Notification" in window;
  const hasServiceWorker = "serviceWorker" in navigator;
  const permissionGranted = Notification.permission === "granted";
  
  
  if (!hasVapid) {
    return false;
  }
  
  return hasNotification && hasServiceWorker && permissionGranted;
};

// Foreground listener
// Foreground listener
export const listenMessages = (callback) => {
  return onMessage(messaging, async (payload) => {
    console.log("FCM Payload:", payload);

    try {
      notificationSound.currentTime = 0;
      await notificationSound.play();
      console.log("✅ Custom notification sound played");
    } catch (err) {
      console.error("❌ Audio play failed:", err);
    }

    if (callback) callback(payload);
  });
};