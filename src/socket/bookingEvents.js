// src/socket/bookingEvents.js
import { socket } from "./socket";

// Booking Events Listener - Using system_event pattern
export const registerBookingEvents = (handlers = {}) => {
  console.log("✅ Booking listeners registered");
  console.log("📡 Socket connected:", socket.connected);
  console.log("📡 Socket ID:", socket.id);

  // Log ALL socket events for debugging
  socket.onAny((event, ...args) => {
    console.log("📡 ALL SOCKET EVENTS - BOOKING:", event, args);
  });

  // ✅ UNIFIED SYSTEM EVENT LISTENER
  socket.on("system_event", (payload) => {
    console.log("🔥 SYSTEM EVENT (BOOKING):", payload);

    // Extract event type from message (format: [EVENT_TYPE] message)
    const event = payload.message?.match(/\[(.*?)\]/)?.[1];

    switch (event) {
      case "BOOKING_REGISTERED":
        console.log("📅 Booking Registered:", payload.data);
        handlers.onBookingRegistered?.(payload.data);
        break;

      case "BOOKING_UPDATED":
        console.log("✏️ Booking Updated:", payload.data);
        handlers.onBookingUpdated?.(payload.data);
        break;

      case "BOOKING_CANCELLED":
        console.log("❌ Booking Cancelled:", payload.data);
        handlers.onBookingCancelled?.(payload.data);
        break;

      case "BOOKING_ACCEPTED":
        console.log("✅ Booking Accepted:", payload.data);
        handlers.onBookingAccepted?.(payload.data);
        break;

      case "BOOKING_COMPLETED":
        console.log("✔️ Booking Completed:", payload.data);
        handlers.onBookingCompleted?.(payload.data);
        break;

      default:
        console.log("Unknown booking event:", event);
    }
  });

  console.log("✅ Booking listeners setup complete");
};

// Unregister booking events (cleanup)
export const unregisterBookingEvents = () => {
  // Remove system_event listener
  socket.off("system_event");
  
  // Remove the onAny listener
  socket.offAny();

  console.log("🧹 Booking events unregistered");
};