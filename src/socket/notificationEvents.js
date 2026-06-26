import { socket } from "./socket";

// Notification Events Listener - EXACT MATCH with backend
export const registerNotificationEvents = (handlers = {}) => {
  // ✅ NOTIFICATION CREATED EVENT
  socket.on("NOTIFICATION_CREATED", (data) => {
    console.log("🔔 Notification Created Event Received:", data);
    handlers.onNotificationCreated?.(data);
  });

  // ✅ NOTIFICATION READ EVENT
  socket.on("NOTIFICATION_READ", (data) => {
    console.log("📖 Notification Read Event Received:", data);
    handlers.onNotificationRead?.(data);
  });

  console.log("✅ Notification events registered successfully");
};

// Unregister notification events (cleanup)
export const unregisterNotificationEvents = () => {
  socket.off("NOTIFICATION_CREATED");
  socket.off("NOTIFICATION_READ");
  console.log("🧹 Notification events unregistered");
};