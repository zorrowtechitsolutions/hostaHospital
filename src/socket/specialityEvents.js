// src/socket/specialityEvents.js
import { socket } from "./socket";

let onAnyListener = null;

// Speciality Events Listener - Using system_event pattern
export const registerSpecialityEvents = (handlers = {}) => {
  console.log("✅ Speciality listeners registered");
  console.log("📡 Socket connected:", socket.connected);
  console.log("📡 Socket ID:", socket.id);

  // Log ALL socket events for debugging
  if (!onAnyListener) {
    onAnyListener = (event, ...args) => {
      console.log("📡 ALL SOCKET EVENTS - SPECIALITY:", event, args);
    };
    socket.onAny(onAnyListener);
  }

  // ✅ UNIFIED SYSTEM EVENT LISTENER (Primary)
  socket.on("system_event", (payload) => {
    console.log("🔥 SYSTEM EVENT (SPECIALITY):", payload);

    // Extract event type from message (format: [EVENT_TYPE] message)
    const event = payload.message?.match(/\[(.*?)\]/)?.[1];

    switch (event) {
      case "SPECIALITY_REGISTERED":
        console.log("🏥 Speciality Registered:", payload.data);
        handlers.onSpecialityRegistered?.(payload.data);
        break;

      case "SPECIALITY_UPDATED":
        console.log("✏️ Speciality Updated:", payload.data);
        handlers.onSpecialityUpdated?.(payload.data);
        break;

      case "SPECIALITY_DELETED":
        console.log("🗑️ Speciality Deleted:", payload.data);
        handlers.onSpecialityDeleted?.(payload.data);
        break;

      default:
        console.log("Unknown speciality event:", event);
    }
  });

  // ✅ INDIVIDUAL EVENT LISTENERS (Fallback for direct events)
  socket.on("SPECIALITY_REGISTERED", (data) => {
    console.log("🏥 Speciality Registered (direct):", data);
    handlers.onSpecialityRegistered?.(data);
  });

  socket.on("SPECIALITY_UPDATED", (data) => {
    console.log("✏️ Speciality Updated (direct):", data);
    handlers.onSpecialityUpdated?.(data);
  });

  socket.on("SPECIALITY_DELETED", (data) => {
    console.log("🗑️ Speciality Deleted (direct):", data);
    handlers.onSpecialityDeleted?.(data);
  });

  console.log("✅ Speciality listeners setup complete");
};

// Unregister speciality events (cleanup)
export const unregisterSpecialityEvents = () => {
  // Remove system_event listener
  socket.off("system_event");
  
  // Remove individual event listeners
  socket.off("SPECIALITY_REGISTERED");
  socket.off("SPECIALITY_UPDATED");
  socket.off("SPECIALITY_DELETED");
  
  // Remove onAny listener
  if (onAnyListener) {
    socket.offAny(onAnyListener);
    onAnyListener = null;
  }

  console.log("🧹 Speciality events unregistered");
};