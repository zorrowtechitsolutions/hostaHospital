// src/socket/reviewEvents.js
import { socket } from "./socket";

let onAnyListener = null;

// Review Events Listener
export const registerReviewEvents = (handlers = {}) => {
  if (!onAnyListener) {
    onAnyListener = () => {};
    socket.onAny(onAnyListener);
  }

  // UNIFIED SYSTEM EVENT LISTENER
  socket.on("system_event", (payload) => {
    const event = payload.message?.match(/\[(.*?)\]/)?.[1];

    switch (event) {
      case "REVIEW_REGISTERED":
        handlers.onReviewRegistered?.(payload.data);
        break;
      case "REVIEW_UPDATED":
        handlers.onReviewUpdated?.(payload.data);
        break;
      default:
        break;
    }
  });

  // INDIVIDUAL EVENT LISTENERS (Fallback)
  socket.on("REVIEW_REGISTERED", (data) => {
    handlers.onReviewRegistered?.(data);
  });

  socket.on("REVIEW_UPDATED", (data) => {
    handlers.onReviewUpdated?.(data);
  });
};

// Unregister review events
export const unregisterReviewEvents = () => {
  socket.off("system_event");
  socket.off("REVIEW_REGISTERED");
  socket.off("REVIEW_UPDATED");
  
  if (onAnyListener) {
    socket.offAny(onAnyListener);
    onAnyListener = null;
  }
};