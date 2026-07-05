// src/socket/categoryEvents.js
import { socket } from "./socket";

let onAnyListener = null;

// Category Events Listener - Using system_event pattern
export const registerCategoryEvents = (handlers = {}) => {
  // ✅ UNIFIED SYSTEM EVENT LISTENER (Primary)
  socket.on("system_event", (payload) => {
    // Extract event type from message (format: [EVENT_TYPE] message)
    const event = payload.message?.match(/\[(.*?)\]/)?.[1];

    switch (event) {
      case "CATEGORY_REGISTERED":
        handlers.onCategoryRegistered?.(payload.data);
        break;

      case "CATEGORY_UPDATED":
        handlers.onCategoryUpdated?.(payload.data);
        break;

      case "CATEGORY_DELETED":
        handlers.onCategoryDeleted?.(payload.data);
        break;

      default:
        // Unknown event - silently ignore
        break;
    }
  });

  // ✅ INDIVIDUAL EVENT LISTENERS (Fallback for direct events)
  socket.on("CATEGORY_REGISTERED", (data) => {
    handlers.onCategoryRegistered?.(data);
  });

  socket.on("CATEGORY_UPDATED", (data) => {
    handlers.onCategoryUpdated?.(data);
  });

  socket.on("CATEGORY_DELETED", (data) => {
    handlers.onCategoryDeleted?.(data);
  });
};

// Unregister category events (cleanup)
export const unregisterCategoryEvents = () => {
  // Remove system_event listener
  socket.off("system_event");
  
  // Remove individual event listeners
  socket.off("CATEGORY_REGISTERED");
  socket.off("CATEGORY_UPDATED");
  socket.off("CATEGORY_DELETED");
  
  // Remove onAny listener if it exists
  if (onAnyListener) {
    socket.offAny(onAnyListener);
    onAnyListener = null;
  }
};