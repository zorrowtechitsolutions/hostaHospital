// src/socket/notificationEvents.js
import { socket } from "./socket";

// Notification Events Listener
export const registerNotificationEvents = (handlers = {}) => {
  socket.on("NOTIFICATION_CREATED", (data) => {
    handlers.onNotificationCreated?.(data);
  });

  socket.on("NOTIFICATION_READ", (data) => {
    handlers.onNotificationRead?.(data);
  });
};

// Unregister notification events
export const unregisterNotificationEvents = () => {
  socket.off("NOTIFICATION_CREATED");
  socket.off("NOTIFICATION_READ");
};