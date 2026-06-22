// firebase.js - Updated version

// 🔥 Firebase setup
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// 🔊 Sound
const notificationSound = new Audio("/notification.mp3");

// 🔐 Firebase config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
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
// export const generateToken = async () => {
//   const permission = await Notification.requestPermission();

//   if (permission === "granted") {
//     const token = await getToken(messaging, {
//       vapidKey:
//         "BIUpc79TBbZ1nrhuhK6oke6LoSgrcUFsowuF7_8pKzR2Yj4J7A5zx-N4rRX71iFXXP3x8927WZQ-EK_byU4FGAw",
//     });

//     console.log("🔥 TOKEN:", token);
//     localStorage.setItem("fcm_token", token);
//     return token;
//   } else {
//     console.log("❌ Permission denied");
//     return null;
//   }
// };

export const generateToken = async () => {
  try {
    console.log("🚀 generateToken started");

    const permission = await Notification.requestPermission();
    console.log("Permission:", permission);

    const registration = await navigator.serviceWorker.ready;

    console.log("SW Ready:", registration);

    const token = await getToken(messaging, {
      vapidKey:
        import.meta.env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    console.log("🔥 TOKEN:", token);

    return token;
  } catch (err) {
    console.error("❌ FCM ERROR:", err);
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