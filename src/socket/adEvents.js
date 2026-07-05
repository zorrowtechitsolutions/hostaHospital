// src/socket/adEvents.js
import { socket } from "./socket";

let onAnyListener = null;

// Ad Events Listener - Using system_event pattern
export const registerAdEvents = (handlers = {}) => {
  // ✅ UNIFIED SYSTEM EVENT LISTENER (Primary)
  socket.on("system_event", (payload) => {
    // Extract event type from message (format: [EVENT_TYPE] message)
    const event = payload.message?.match(/\[(.*?)\]/)?.[1];

    switch (event) {
      case "AD_CREATED":
        handlers.onAdCreated?.(payload.data);
        break;

      case "AD_UPDATED":
        handlers.onAdUpdated?.(payload.data);
        break;

      case "AD_DELETED":
        handlers.onAdDeleted?.(payload.data);
        break;

      default:
        // Unknown event - silently ignore
        break;
    }
  });

  // ✅ INDIVIDUAL EVENT LISTENERS (Fallback for direct events)
  socket.on("AD_CREATED", (data) => {
    handlers.onAdCreated?.(data);
  });

  socket.on("AD_UPDATED", (data) => {
    handlers.onAdUpdated?.(data);
  });

  socket.on("AD_DELETED", (data) => {
    handlers.onAdDeleted?.(data);
  });
};

// Unregister ad events (cleanup)
export const unregisterAdEvents = () => {
  // Remove system_event listener
  socket.off("system_event");
  
  // Remove individual event listeners
  socket.off("AD_CREATED");
  socket.off("AD_UPDATED");
  socket.off("AD_DELETED");
  
  // Remove onAny listener if it exists
  if (onAnyListener) {
    socket.offAny(onAnyListener);
    onAnyListener = null;
  }
};