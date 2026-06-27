// src/socket/permissionEvents.js
import { socket } from "./socket";

let onAnyListener = null;

// Permission Events Listener - Using system_event pattern
export const registerPermissionEvents = (handlers = {}) => {
  console.log("✅ Permission listeners registered");
  console.log("📡 Socket connected:", socket.connected);
  console.log("📡 Socket ID:", socket.id);

  // Log ALL socket events for debugging
  if (!onAnyListener) {
    onAnyListener = (event, ...args) => {
      console.log("📡 ALL SOCKET EVENTS - PERMISSION:", event, args);
    };
    socket.onAny(onAnyListener);
  }

  // ✅ UNIFIED SYSTEM EVENT LISTENER (Primary)
  socket.on("system_event", (payload) => {
    console.log("🔥 SYSTEM EVENT (PERMISSION):", payload);

    // Extract event type from message (format: [EVENT_TYPE] message)
    const event = payload.message?.match(/\[(.*?)\]/)?.[1];

    switch (event) {
      case "PERMISSION_REGISTERED":
        console.log("🔑 Permission Registered:", payload.data);
        handlers.onPermissionRegistered?.(payload.data);
        break;

      case "PERMISSION_UPDATED":
        console.log("✏️ Permission Updated:", payload.data);
        handlers.onPermissionUpdated?.(payload.data);
        break;

      case "PERMISSION_DELETED":
        console.log("🗑️ Permission Deleted:", payload.data);
        handlers.onPermissionDeleted?.(payload.data);
        break;

      default:
        console.log("Unknown permission event:", event);
    }
  });

  // ✅ INDIVIDUAL EVENT LISTENERS (Fallback for direct events)
  socket.on("PERMISSION_REGISTERED", (data) => {
    console.log("🔑 Permission Registered (direct):", data);
    handlers.onPermissionRegistered?.(data);
  });

  socket.on("PERMISSION_UPDATED", (data) => {
    console.log("✏️ Permission Updated (direct):", data);
    handlers.onPermissionUpdated?.(data);
  });

  socket.on("PERMISSION_DELETED", (data) => {
    console.log("🗑️ Permission Deleted (direct):", data);
    handlers.onPermissionDeleted?.(data);
  });

  console.log("✅ Permission listeners setup complete");
};

// Unregister permission events (cleanup)
export const unregisterPermissionEvents = () => {
  // Remove system_event listener
  socket.off("system_event");
  
  // Remove individual event listeners
  socket.off("PERMISSION_REGISTERED");
  socket.off("PERMISSION_UPDATED");
  socket.off("PERMISSION_DELETED");
  
  // Remove onAny listener
  if (onAnyListener) {
    socket.offAny(onAnyListener);
    onAnyListener = null;
  }

  console.log("🧹 Permission events unregistered");
};