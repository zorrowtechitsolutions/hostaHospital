// src/socket/reviewEvents.js
import { socket } from "./socket";

let onAnyListener = null;

// Review Events Listener - Using system_event pattern
export const registerReviewEvents = (handlers = {}) => {
  console.log("✅ Review listeners registered");
  console.log("📡 Socket connected:", socket.connected);
  console.log("📡 Socket ID:", socket.id);

  // Log ALL socket events for debugging
  if (!onAnyListener) {
    onAnyListener = (event, ...args) => {
      console.log("📡 ALL SOCKET EVENTS - REVIEW:", event, args);
    };
    socket.onAny(onAnyListener);
  }

  // ✅ UNIFIED SYSTEM EVENT LISTENER (Primary)
  socket.on("system_event", (payload) => {
    console.log("🔥 SYSTEM EVENT (REVIEW):", payload);

    // Extract event type from message (format: [EVENT_TYPE] message)
    const event = payload.message?.match(/\[(.*?)\]/)?.[1];

    switch (event) {
      case "REVIEW_REGISTERED":
        console.log("📝 Review Registered:", payload.data);
        handlers.onReviewRegistered?.(payload.data);
        break;

      case "REVIEW_UPDATED":
        console.log("✏️ Review Updated:", payload.data);
        handlers.onReviewUpdated?.(payload.data);
        break;

      default:
        console.log("Unknown review event:", event);
    }
  });

  // ✅ INDIVIDUAL EVENT LISTENERS (Fallback for direct events)
  socket.on("REVIEW_REGISTERED", (data) => {
    console.log("📝 Review Registered (direct):", data);
    handlers.onReviewRegistered?.(data);
  });

  socket.on("REVIEW_UPDATED", (data) => {
    console.log("✏️ Review Updated (direct):", data);
    handlers.onReviewUpdated?.(data);
  });

  console.log("✅ Review listeners setup complete");
};

// Unregister review events (cleanup)
export const unregisterReviewEvents = () => {
  // Remove system_event listener
  socket.off("system_event");
  
  // Remove individual event listeners
  socket.off("REVIEW_REGISTERED");
  socket.off("REVIEW_UPDATED");
  
  // Remove onAny listener
  if (onAnyListener) {
    socket.offAny(onAnyListener);
    onAnyListener = null;
  }

  console.log("🧹 Review events unregistered");
};