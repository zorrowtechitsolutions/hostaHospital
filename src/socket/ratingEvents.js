// src/socket/ratingEvents.js
import { socket } from "./socket";

let onAnyListener = null;

// Rating Events Listener
export const registerRatingEvents = (handlers = {}) => {
  if (!onAnyListener) {
    onAnyListener = () => {};
    socket.onAny(onAnyListener);
  }

  // UNIFIED SYSTEM EVENT LISTENER
  socket.on("system_event", (payload) => {
    const event = payload.message?.match(/\[(.*?)\]/)?.[1];

    switch (event) {
      case "RATING_REGISTERED":
        handlers.onRatingRegistered?.(payload.data);
        break;
      case "RATING_UPDATED":
        handlers.onRatingUpdated?.(payload.data);
        break;
      default:
        break;
    }
  });

  // INDIVIDUAL EVENT LISTENERS (Fallback)
  socket.on("RATING_REGISTERED", (data) => {
    handlers.onRatingRegistered?.(data);
  });

  socket.on("RATING_UPDATED", (data) => {
    handlers.onRatingUpdated?.(data);
  });
};

// Unregister rating events
export const unregisterRatingEvents = () => {
  socket.off("system_event");
  socket.off("RATING_REGISTERED");
  socket.off("RATING_UPDATED");
  
  if (onAnyListener) {
    socket.offAny(onAnyListener);
    onAnyListener = null;
  }
};