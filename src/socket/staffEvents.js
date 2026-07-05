// src/socket/staffEvents.js
import { socket } from "./socket";

let onAnyListener = null;

// Staff Events Listener - Using system_event pattern
export const registerStaffEvents = (handlers = {}) => {

  // ✅ UNIFIED SYSTEM EVENT LISTENER (Primary)
  socket.on("system_event", (payload) => {

    // Extract event type from message (format: [EVENT_TYPE] message)
    const event = payload.message?.match(/\[(.*?)\]/)?.[1];

    switch (event) {
      case "STAFF_REGISTERED":
        handlers.onStaffRegistered?.(payload.data);
        break;

      case "STAFF_UPDATED":
        handlers.onStaffUpdated?.(payload.data);
        break;

      case "STAFF_DELETED":
        handlers.onStaffDeleted?.(payload.data);
        break;

      // ✅ NEW: Handle STAFF_RECOVERED event
      case "STAFF_RECOVERED":
        handlers.onStaffRecovered?.(payload.data);
        break;

      case "STAFF_PASSWORD_RESET":
        handlers.onStaffPasswordReset?.(payload.data);
        break;

      case "STAFF_PASSWORD_CHANGED":
        handlers.onStaffPasswordChanged?.(payload.data);
        break;
    }
  });

  // ✅ INDIVIDUAL EVENT LISTENERS (Fallback for direct events)
  socket.on("STAFF_REGISTERED", (data) => {
    handlers.onStaffRegistered?.(data);
  });

  socket.on("STAFF_UPDATED", (data) => {
    handlers.onStaffUpdated?.(data);
  });

  socket.on("STAFF_DELETED", (data) => {
    handlers.onStaffDeleted?.(data);
  });

  // ✅ NEW: Individual listener for STAFF_RECOVERED
  socket.on("STAFF_RECOVERED", (data) => {
    handlers.onStaffRecovered?.(data);
  });

  socket.on("STAFF_PASSWORD_RESET", (data) => {
    handlers.onStaffPasswordReset?.(data);
  });

  socket.on("STAFF_PASSWORD_CHANGED", (data) => {
    handlers.onStaffPasswordChanged?.(data);
  });
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

};