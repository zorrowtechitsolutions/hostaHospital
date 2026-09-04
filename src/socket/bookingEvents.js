import { socket } from "./socket";

export const registerBookingEvents = (handlers = {}) => {
  const handleBookingEvent = (payload) => {
    console.log("🔥 BOOKING EVENT RECEIVED:", payload);

    const event = payload?.event;

    console.log("📡 Event name:", event);
    console.log("📦 Event data:", payload?.data);

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
        console.log("⚠️ Unknown booking event:", event);
    }
  };

  socket.on("booking_event", handleBookingEvent);

  return () => {
    socket.off("booking_event", handleBookingEvent);
  };
};

export const unregisterBookingEvents = () => {
  socket.off("booking_event");
};