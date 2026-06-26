import { socket } from "./socket";

// Booking Events Listener - EXACT MATCH with backend
export const registerBookingEvents = (handlers = {}) => {
  console.log("✅ Booking listeners registered");
  console.log("📡 Socket connected:", socket.connected);
  console.log("📡 Socket ID:", socket.id);

  // Log ALL socket events for debugging
  socket.onAny((event, ...args) => {
    console.log("📡 ALL SOCKET EVENTS - BOOKING:", event, args);
  });

  // ✅ BOOKING REGISTERED EVENT
  socket.on("BOOKING_REGISTERED", (data) => {
    console.log("📅 Booking Registered:", data);
    handlers.onBookingRegistered?.(data);
  });

  // ✅ BOOKING UPDATED EVENT
  socket.on("BOOKING_UPDATED", (data) => {
    console.log("✏️ Booking Updated:", data);
    handlers.onBookingUpdated?.(data);
  });

  // ✅ BOOKING CANCELLED EVENT
  socket.on("BOOKING_CANCELLED", (data) => {
    console.log("❌ Booking Cancelled:", data);
    handlers.onBookingCancelled?.(data);
  });

  // ✅ BOOKING ACCEPTED EVENT
  socket.on("BOOKING_ACCEPTED", (data) => {
    console.log("✅ Booking Accepted:", data);
    handlers.onBookingAccepted?.(data);
  });

  // ✅ BOOKING COMPLETED EVENT
  socket.on("BOOKING_COMPLETED", (data) => {
    console.log("✔️ Booking Completed:", data);
    handlers.onBookingCompleted?.(data);
  });

  console.log("✅ Booking listeners setup complete");
};

// Unregister booking events (cleanup)
export const unregisterBookingEvents = () => {
  socket.off("BOOKING_REGISTERED");
  socket.off("BOOKING_UPDATED");
  socket.off("BOOKING_CANCELLED");
  socket.off("BOOKING_ACCEPTED");
  socket.off("BOOKING_COMPLETED");
  
  // Also remove the onAny listener
  socket.offAny();
  
  console.log("🧹 Booking events unregistered");
};