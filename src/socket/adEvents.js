// src/socket/adEvents.js
import { socket } from "./socket";

let onAnyListener = null;

// Ad Events Listener - Using system_event pattern
export const registerAdEvents = (handlers = {}) => {
  console.log("✅ Ad listeners registered");
  console.log("📡 Socket connected:", socket.connected);
  console.log("📡 Socket ID:", socket.id);

  // Log ALL socket events for debugging
  if (!onAnyListener) {
    onAnyListener = (event, ...args) => {
      console.log("📡 ALL SOCKET EVENTS - AD:", event, args);
    };
    socket.onAny(onAnyListener);
  }

  // ✅ UNIFIED SYSTEM EVENT LISTENER (Primary)
  socket.on("system_event", (payload) => {
    console.log("🔥 SYSTEM EVENT (AD):", payload);

    // Extract event type from message (format: [EVENT_TYPE] message)
    const event = payload.message?.match(/\[(.*?)\]/)?.[1];

    switch (event) {
      case "AD_CREATED":
        console.log("📢 Ad Created:", payload.data);
        handlers.onAdCreated?.(payload.data);
        break;

      case "AD_UPDATED":
        console.log("✏️ Ad Updated:", payload.data);
        handlers.onAdUpdated?.(payload.data);
        break;

      case "AD_DELETED":
        console.log("🗑️ Ad Deleted:", payload.data);
        handlers.onAdDeleted?.(payload.data);
        break;

      default:
        console.log("Unknown ad event:", event);
    }
  });

  // ✅ INDIVIDUAL EVENT LISTENERS (Fallback for direct events)
  socket.on("AD_CREATED", (data) => {
    console.log("📢 Ad Created (direct):", data);
    handlers.onAdCreated?.(data);
  });

  socket.on("AD_UPDATED", (data) => {
    console.log("✏️ Ad Updated (direct):", data);
    handlers.onAdUpdated?.(data);
  });

  socket.on("AD_DELETED", (data) => {
    console.log("🗑️ Ad Deleted (direct):", data);
    handlers.onAdDeleted?.(data);
  });

  console.log("✅ Ad listeners setup complete");
};

// Unregister ad events (cleanup)
export const unregisterAdEvents = () => {
  // Remove system_event listener
  socket.off("system_event");
  
  // Remove individual event listeners
  socket.off("AD_CREATED");
  socket.off("AD_UPDATED");
  socket.off("AD_DELETED");
  
  // Remove onAny listener
  if (onAnyListener) {
    socket.offAny(onAnyListener);
    onAnyListener = null;
  }

  console.log("🧹 Ad events unregistered");
};