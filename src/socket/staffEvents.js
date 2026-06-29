// src/socket/staffEvents.js
import { socket } from "./socket";

let onAnyListener = null;

// Staff Events Listener - Using system_event pattern
export const registerStaffEvents = (handlers = {}) => {
  console.log("✅ Staff listeners registered");
  console.log("📡 Socket connected:", socket.connected);
  console.log("📡 Socket ID:", socket.id);

  // Log ALL socket events for debugging
  if (!onAnyListener) {
    onAnyListener = (event, ...args) => {
      console.log("📡 ALL SOCKET EVENTS - STAFF:", event, args);
    };
    socket.onAny(onAnyListener);
  }

  // ✅ UNIFIED SYSTEM EVENT LISTENER (Primary)
  socket.on("system_event", (payload) => {
    console.log("🔥 SYSTEM EVENT (STAFF):", payload);

    // Extract event type from message (format: [EVENT_TYPE] message)
    const event = payload.message?.match(/\[(.*?)\]/)?.[1];

    switch (event) {
      case "STAFF_REGISTERED":
        console.log("👤 Staff Registered:", payload.data);
        handlers.onStaffRegistered?.(payload.data);
        break;

      case "STAFF_UPDATED":
        console.log("✏️ Staff Updated:", payload.data);
        handlers.onStaffUpdated?.(payload.data);
        break;

      case "STAFF_DELETED":
        console.log("🗑️ Staff Deleted:", payload.data);
        handlers.onStaffDeleted?.(payload.data);
        break;

      // ✅ NEW: Handle STAFF_RECOVERED event
      case "STAFF_RECOVERED":
        console.log("♻️ Staff Recovered:", payload.data);
        handlers.onStaffRecovered?.(payload.data);
        break;

      case "STAFF_PASSWORD_RESET":
        console.log("🔑 Staff Password Reset:", payload.data);
        handlers.onStaffPasswordReset?.(payload.data);
        break;

      case "STAFF_PASSWORD_CHANGED":
        console.log("🔐 Staff Password Changed:", payload.data);
        handlers.onStaffPasswordChanged?.(payload.data);
        break;

      default:
        console.log("Unknown staff event:", event);
    }
  });

  // ✅ INDIVIDUAL EVENT LISTENERS (Fallback for direct events)
  socket.on("STAFF_REGISTERED", (data) => {
    console.log("👤 Staff Registered (direct):", data);
    handlers.onStaffRegistered?.(data);
  });

  socket.on("STAFF_UPDATED", (data) => {
    console.log("✏️ Staff Updated (direct):", data);
    handlers.onStaffUpdated?.(data);
  });

  socket.on("STAFF_DELETED", (data) => {
    console.log("🗑️ Staff Deleted (direct):", data);
    handlers.onStaffDeleted?.(data);
  });

  // ✅ NEW: Individual listener for STAFF_RECOVERED
  socket.on("STAFF_RECOVERED", (data) => {
    console.log("♻️ Staff Recovered (direct):", data);
    handlers.onStaffRecovered?.(data);
  });

  socket.on("STAFF_PASSWORD_RESET", (data) => {
    console.log("🔑 Staff Password Reset (direct):", data);
    handlers.onStaffPasswordReset?.(data);
  });

  socket.on("STAFF_PASSWORD_CHANGED", (data) => {
    console.log("🔐 Staff Password Changed (direct):", data);
    handlers.onStaffPasswordChanged?.(data);
  });

  console.log("✅ Staff listeners setup complete");
};

// Unregister staff events (cleanup)
export const unregisterStaffEvents = () => {
  // Remove system_event listener
  socket.off("system_event");
  
  // Remove individual event listeners
  socket.off("STAFF_REGISTERED");
  socket.off("STAFF_UPDATED");
  socket.off("STAFF_DELETED");
  socket.off("STAFF_RECOVERED");
  socket.off("STAFF_PASSWORD_RESET");
  socket.off("STAFF_PASSWORD_CHANGED");
  
  // Remove onAny listener
  if (onAnyListener) {
    socket.offAny(onAnyListener);
    onAnyListener = null;
  }

  console.log("🧹 Staff events unregistered");
};