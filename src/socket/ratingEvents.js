// src/socket/ratingEvents.js
import { socket } from "./socket";

let onAnyListener = null;

// Rating Events Listener - Using system_event pattern
export const registerRatingEvents = (handlers = {}) => {
  console.log("✅ Rating listeners registered");
  console.log("📡 Socket connected:", socket.connected);
  console.log("📡 Socket ID:", socket.id);

  // Log ALL socket events for debugging
  if (!onAnyListener) {
    onAnyListener = (event, ...args) => {
      console.log("📡 ALL SOCKET EVENTS - RATING:", event, args);
    };
    socket.onAny(onAnyListener);
  }

  // ✅ UNIFIED SYSTEM EVENT LISTENER (Primary)
  socket.on("system_event", (payload) => {
    console.log("🔥 SYSTEM EVENT (RATING):", payload);

    // Extract event type from message (format: [EVENT_TYPE] message)
    const event = payload.message?.match(/\[(.*?)\]/)?.[1];

    switch (event) {
      case "RATING_REGISTERED":
        console.log("⭐ Rating Registered:", payload.data);
        handlers.onRatingRegistered?.(payload.data);
        break;

      case "RATING_UPDATED":
        console.log("✏️ Rating Updated:", payload.data);
        handlers.onRatingUpdated?.(payload.data);
        break;

      default:
        console.log("Unknown rating event:", event);
    }
  });

  // ✅ INDIVIDUAL EVENT LISTENERS (Fallback for direct events)
  socket.on("RATING_REGISTERED", (data) => {
    console.log("⭐ Rating Registered (direct):", data);
    handlers.onRatingRegistered?.(data);
  });

  socket.on("RATING_UPDATED", (data) => {
    console.log("✏️ Rating Updated (direct):", data);
    handlers.onRatingUpdated?.(data);
  });

  console.log("✅ Rating listeners setup complete");
};

// Unregister rating events (cleanup)
export const unregisterRatingEvents = () => {
  // Remove system_event listener
  socket.off("system_event");
  
  // Remove individual event listeners
  socket.off("RATING_REGISTERED");
  socket.off("RATING_UPDATED");
  
  // Remove onAny listener
  if (onAnyListener) {
    socket.offAny(onAnyListener);
    onAnyListener = null;
  }

  console.log("🧹 Rating events unregistered");
};