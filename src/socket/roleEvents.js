// src/socket/roleEvents.js
import { socket } from "./socket";

let onAnyListener = null;

// Role Events Listener - Using system_event pattern
export const registerRoleEvents = (handlers = {}) => {
  console.log("✅ Role listeners registered");
  console.log("📡 Socket connected:", socket.connected);
  console.log("📡 Socket ID:", socket.id);

  // Log ALL socket events for debugging
  if (!onAnyListener) {
    onAnyListener = (event, ...args) => {
      console.log("📡 ALL SOCKET EVENTS - ROLE:", event, args);
    };
    socket.onAny(onAnyListener);
  }

  // ✅ UNIFIED SYSTEM EVENT LISTENER (Primary)
  socket.on("system_event", (payload) => {
    console.log("🔥 SYSTEM EVENT (ROLE):", payload);

    // Extract event type from message (format: [EVENT_TYPE] message)
    const event = payload.message?.match(/\[(.*?)\]/)?.[1];

    switch (event) {
      case "ROLE_REGISTERED":
        console.log("👤 Role Registered:", payload.data);
        handlers.onRoleRegistered?.(payload.data);
        break;

      case "ROLE_UPDATED":
        console.log("✏️ Role Updated:", payload.data);
        handlers.onRoleUpdated?.(payload.data);
        break;

      case "ROLE_DELETED":
        console.log("🗑️ Role Deleted:", payload.data);
        handlers.onRoleDeleted?.(payload.data);
        break;

      default:
        console.log("Unknown role event:", event);
    }
  });

  // ✅ INDIVIDUAL EVENT LISTENERS (Fallback for direct events)
  socket.on("ROLE_REGISTERED", (data) => {
    console.log("👤 Role Registered (direct):", data);
    handlers.onRoleRegistered?.(data);
  });

  socket.on("ROLE_UPDATED", (data) => {
    console.log("✏️ Role Updated (direct):", data);
    handlers.onRoleUpdated?.(data);
  });

  socket.on("ROLE_DELETED", (data) => {
    console.log("🗑️ Role Deleted (direct):", data);
    handlers.onRoleDeleted?.(data);
  });

  console.log("✅ Role listeners setup complete");
};

// Unregister role events (cleanup)
export const unregisterRoleEvents = () => {
  // Remove system_event listener
  socket.off("system_event");
  
  // Remove individual event listeners
  socket.off("ROLE_REGISTERED");
  socket.off("ROLE_UPDATED");
  socket.off("ROLE_DELETED");
  
  // Remove onAny listener
  if (onAnyListener) {
    socket.offAny(onAnyListener);
    onAnyListener = null;
  }

  console.log("🧹 Role events unregistered");
};