// src/socket/hospitalEvents.js
import { socket } from "./socket";

let onAnyListener = null;

// Hospital Events Listener - Using system_event pattern
export const registerHospitalEvents = (handlers = {}) => {
  console.log("✅ Hospital listeners registered");
  console.log("📡 Socket connected:", socket.connected);
  console.log("📡 Socket ID:", socket.id);

  // Log ALL socket events for debugging
  if (!onAnyListener) {
    onAnyListener = (event, ...args) => {
      console.log("📡 ALL SOCKET EVENTS - HOSPITAL:", event, args);
    };
    socket.onAny(onAnyListener);
  }

  // ✅ UNIFIED SYSTEM EVENT LISTENER (Primary)
  socket.on("system_event", (payload) => {
    console.log("🔥 SYSTEM EVENT (HOSPITAL):", payload);

    // Extract event type from message (format: [EVENT_TYPE] message)
    const event = payload.message?.match(/\[(.*?)\]/)?.[1];

    switch (event) {
      case "HOSPITAL_REGISTERED":
        console.log("🏥 Hospital Registered:", payload.data);
        handlers.onHospitalRegistered?.(payload.data);
        break;

      case "HOSPITAL_UPDATED":
        console.log("✏️ Hospital Updated:", payload.data);
        handlers.onHospitalUpdated?.(payload.data);
        break;

      case "HOSPITAL_DELETED":
        console.log("🗑️ Hospital Deleted:", payload.data);
        handlers.onHospitalDeleted?.(payload.data);
        break;

      case "HOSPITAL_BLACKLISTED":
        console.log("🚫 Hospital Blacklisted:", payload.data);
        handlers.onHospitalBlacklisted?.(payload.data);
        break;

      case "HOSPITAL_RECOVERED":
        console.log("♻️ Hospital Recovered:", payload.data);
        handlers.onHospitalRecovered?.(payload.data);
        break;

      default:
        console.log("Unknown hospital event:", event);
    }
  });

  // ✅ INDIVIDUAL EVENT LISTENERS (Fallback for direct events)
  socket.on("HOSPITAL_REGISTERED", (data) => {
    console.log("🏥 Hospital Registered (direct):", data);
    handlers.onHospitalRegistered?.(data);
  });

  socket.on("HOSPITAL_UPDATED", (data) => {
    console.log("✏️ Hospital Updated (direct):", data);
    handlers.onHospitalUpdated?.(data);
  });

  socket.on("HOSPITAL_DELETED", (data) => {
    console.log("🗑️ Hospital Deleted (direct):", data);
    handlers.onHospitalDeleted?.(data);
  });

  socket.on("HOSPITAL_BLACKLISTED", (data) => {
    console.log("🚫 Hospital Blacklisted (direct):", data);
    handlers.onHospitalBlacklisted?.(data);
  });

  socket.on("HOSPITAL_RECOVERED", (data) => {
    console.log("♻️ Hospital Recovered (direct):", data);
    handlers.onHospitalRecovered?.(data);
  });

  console.log("✅ Hospital listeners setup complete");
};

// Unregister hospital events (cleanup)
export const unregisterHospitalEvents = () => {
  // Remove system_event listener
  socket.off("system_event");
  
  // Remove individual event listeners
  socket.off("HOSPITAL_REGISTERED");
  socket.off("HOSPITAL_UPDATED");
  socket.off("HOSPITAL_DELETED");
  socket.off("HOSPITAL_BLACKLISTED");
  socket.off("HOSPITAL_RECOVERED");
  
  // Remove onAny listener
  if (onAnyListener) {
    socket.offAny(onAnyListener);
    onAnyListener = null;
  }

  console.log("🧹 Hospital events unregistered");
};