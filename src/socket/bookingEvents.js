// src/socket/bookingEvents.js
import { socket } from "./socket";

// Booking Events Listener - Using system_event pattern
export const registerBookingEvents = (handlers = {}) => {
  // ✅ UNIFIED SYSTEM EVENT LISTENER
  socket.on("system_event", (payload) => {
    // Extract event type from message (format: [EVENT_TYPE] message)
    const event = payload.message?.match(/\[(.*?)\]/)?.[1];

    switch (event) {
      case "BOOKING_REGISTERED":
        handlers.onBookingRegistered?.(payload.data);
        break;

      case "BOOKING_UPDATED":
        handlers.onBookingUpdated?.(payload.data);
        break;

      case "BOOKING_CANCELLED":
        handlers.onBookingCancelled?.(payload.data);
        break;

      case "BOOKING_ACCEPTED":
        handlers.onBookingAccepted?.(payload.data);
        break;

      case "BOOKING_COMPLETED":
        handlers.onBookingCompleted?.(payload.data);
        break;

      default:
        // Unknown event - silently ignore
        break;
    }
  });
};

// Unregister booking events (cleanup)
export const unregisterBookingEvents = () => {
  // Remove system_event listener
  socket.off("system_event");
  
  // Remove the onAny listener
  socket.offAny();
};