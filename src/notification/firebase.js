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
      console.log('⚠️ Notifications not supported in this browser');
      return "unsupported";
    }

    if (Notification.permission === "granted") {
      console.log('✅ Notification permission already granted');
      return "granted";
    }

    if (Notification.permission === "denied") {
      console.log('⚠️ Notification permission denied');
      return "denied";
    }

    const permission = await Notification.requestPermission();
    console.log(`📢 Notification permission: ${permission}`);
    return permission;
  } catch (error) {
    console.error('❌ Permission request error:', error);
    return "error";
  }
};

// Generate Token
export const generateToken = async () => {
  try {
    console.log('🔑 Starting FCM token generation...');
    
    // 1. Check permission
    if (Notification.permission !== "granted") {
      console.log('⚠️ Cannot generate token: permission not granted (status:', Notification.permission, ')');
      return null;
    }
    console.log('✅ Notification permission granted');

    // 2. Check VAPID key
    if (!VAPID_KEY) {
      console.log('⚠️ VAPID key not configured');
      return null;
    }
    console.log('✅ VAPID key present');

    // 3. Check service worker
    if (!("serviceWorker" in navigator)) {
      console.log('⚠️ Service Workers not supported');
      return null;
    }
    console.log('✅ Service Workers supported');

    // 4. Wait for service worker
    let registration;
    try {
      registration = await navigator.serviceWorker.ready;
      console.log('✅ Service Worker ready:', registration);
    } catch (swError) {
      console.log('⚠️ Service worker not ready:', swError.message);
      return null;
    }

    if (!registration) {
      console.log('⚠️ No service worker registration found');
      return null;
    }

    // 5. Get token
    console.log('🔑 Getting FCM token with VAPID key...');
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      console.log('✅ FCM Token generated successfully:', token);
      return token;
    } else {
      console.log('⚠️ No FCM token received (token is null)');
      return null;
    }
  } catch (err) {
    console.error('❌ FCM Token generation error:', err.message);
    return null;
  }
};

// Generate token with timeout
export const generateTokenWithTimeout = async (timeoutMs = 10000) => {
  console.log(`⏱️ Generating FCM token with ${timeoutMs}ms timeout...`);
  
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error(`FCM token generation timeout (${timeoutMs}ms)`)), timeoutMs)
  );

  try {
    const result = await Promise.race([
      generateToken(),
      timeoutPromise
    ]);
    console.log('✅ FCM token result:', result || 'No token received');
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
  
  console.log('🔍 FCM Availability Check:', {
    hasVapid,
    hasNotification,
    hasServiceWorker,
    permissionGranted,
    vapidKey: VAPID_KEY ? '✅ Present' : '❌ Missing'
  });
  
  if (!hasVapid) {
    console.log('ℹ️ FCM is disabled (VAPID key not configured)');
    return false;
  }
  
  return hasNotification && hasServiceWorker && permissionGranted;
};

// Foreground listener
export const listenMessages = (callback) => {
  const unsubscribe = onMessage(messaging, (payload) => {
    console.log('📨 Foreground message received:', payload);
    
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