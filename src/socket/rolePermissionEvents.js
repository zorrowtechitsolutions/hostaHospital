// src/socket/rolePermissionEvents.js
import { socket } from "./socket";

let onAnyListener = null;

// Role Permission Events Listener - Using system_event pattern
export const registerRolePermissionEvents = (handlers = {}) => {
  console.log("✅ Role Permission listeners registered");
  console.log("📡 Socket connected:", socket.connected);
  console.log("📡 Socket ID:", socket.id);

  // Log ALL socket events for debugging
  if (!onAnyListener) {
    onAnyListener = (event, ...args) => {
      console.log("📡 ALL SOCKET EVENTS - ROLE PERMISSION:", event, args);
    };
    socket.onAny(onAnyListener);
  }

  // ✅ UNIFIED SYSTEM EVENT LISTENER (Primary)
  socket.on("system_event", (payload) => {
    console.log("🔥 SYSTEM EVENT (ROLE PERMISSION):", payload);

    // Extract event type from message (format: [EVENT_TYPE] message)
    const event = payload.message?.match(/\[(.*?)\]/)?.[1];

    switch (event) {
      case "ROLEPERMISSION_UPDATED":
        console.log("🔐 Role Permission Updated:", payload.data);
        handlers.onRolePermissionUpdated?.(payload.data);
        break;

      default:
        console.log("Unknown role permission event:", event);
    }
  });

  // ✅ INDIVIDUAL EVENT LISTENERS (Fallback for direct events)
  socket.on("ROLEPERMISSION_UPDATED", (data) => {
    console.log("🔐 Role Permission Updated (direct):", data);
    handlers.onRolePermissionUpdated?.(data);
  });

  console.log("✅ Role Permission listeners setup complete");
};

// Unregister role permission events (cleanup)
export const unregisterRolePermissionEvents = () => {
  // Remove system_event listener
  socket.off("system_event");
  
  // Remove individual event listeners
  socket.off("ROLEPERMISSION_UPDATED");
  
  // Remove onAny listener
  if (onAnyListener) {
    socket.offAny(onAnyListener);
    onAnyListener = null;
  }

  console.log("🧹 Role Permission events unregistered");
};