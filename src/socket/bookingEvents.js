import { socket } from "./socket";

export const registerBookingEvents = (handlers = {}) => {
  const handleBookingEvent = (payload) => {
    console.log("🔥 BOOKING EVENT RECEIVED:", payload);

    const event = payload?.event;

    console.log("📡 Event name:", event);
    console.log("📦 Event data:", payload?.data);

    if (!event) {
      console.warn("⚠️ booking_event received without event name:", payload);
      return;
    }

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

      case "TOKEN_UPDATED":
        handlers.onTokenUpdated?.(payload.data);
        break;

      case "BOOKING_DELETED":
        handlers.onBookingDeleted?.(payload.data);
        break;

      default:
        console.warn("⚠️ Unknown booking event:", event, payload);
    }
  };

  socket.on("booking_event", handleBookingEvent);

  console.log("✅ Booking event listener registered");

  return () => {
    socket.off("booking_event", handleBookingEvent);
    console.log("🧹 Booking event listener removed");
  };
};

export const unregisterBookingEvents = () => {
  socket.off("booking_event");
};