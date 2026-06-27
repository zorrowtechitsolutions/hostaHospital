// src/socket/doctorEvents.js
import { socket } from "./socket";

let onAnyListener = null;

// Doctor Events Listener - Using system_event pattern
export const registerDoctorEvents = (handlers = {}) => {
  console.log("✅ Doctor listeners registered");
  console.log("📡 Socket connected:", socket.connected);
  console.log("📡 Socket ID:", socket.id);

  // Log ALL socket events for debugging
  if (!onAnyListener) {
    onAnyListener = (event, ...args) => {
      console.log("📡 ALL SOCKET EVENTS - DOCTOR:", event, args);
    };
    socket.onAny(onAnyListener);
  }

  // ✅ UNIFIED SYSTEM EVENT LISTENER (Primary)
  socket.on("system_event", (payload) => {
    console.log("🔥 SYSTEM EVENT (DOCTOR):", payload);

    // Extract event type from message (format: [EVENT_TYPE] message)
    const event = payload.message?.match(/\[(.*?)\]/)?.[1];

    switch (event) {
      case "DOCTOR_REGISTERED":
        console.log("👨‍⚕️ Doctor Registered:", payload.data);
        handlers.onDoctorRegistered?.(payload.data);
        break;

      case "DOCTOR_UPDATED":
        console.log("✏️ Doctor Updated:", payload.data);
        handlers.onDoctorUpdated?.(payload.data);
        break;

      case "DOCTOR_DELETED":
        console.log("🗑️ Doctor Deleted:", payload.data);
        handlers.onDoctorDeleted?.(payload.data);
        break;

      case "DOCTOR_PASSWORD_RESET":
        console.log("🔑 Doctor Password Reset:", payload.data);
        handlers.onDoctorPasswordReset?.(payload.data);
        break;

      case "DOCTOR_PASSWORD_CHANGED":
        console.log("🔐 Doctor Password Changed:", payload.data);
        handlers.onDoctorPasswordChanged?.(payload.data);
        break;

      default:
        console.log("Unknown doctor event:", event);
    }
  });

  // ✅ INDIVIDUAL EVENT LISTENERS (Fallback for direct events)
  socket.on("DOCTOR_REGISTERED", (data) => {
    console.log("👨‍⚕️ Doctor Registered (direct):", data);
    handlers.onDoctorRegistered?.(data);
  });

  socket.on("DOCTOR_UPDATED", (data) => {
    console.log("✏️ Doctor Updated (direct):", data);
    handlers.onDoctorUpdated?.(data);
  });

  socket.on("DOCTOR_DELETED", (data) => {
    console.log("🗑️ Doctor Deleted (direct):", data);
    handlers.onDoctorDeleted?.(data);
  });

  socket.on("DOCTOR_PASSWORD_RESET", (data) => {
    console.log("🔑 Doctor Password Reset (direct):", data);
    handlers.onDoctorPasswordReset?.(data);
  });

  socket.on("DOCTOR_PASSWORD_CHANGED", (data) => {
    console.log("🔐 Doctor Password Changed (direct):", data);
    handlers.onDoctorPasswordChanged?.(data);
  });

  console.log("✅ Doctor listeners setup complete");
};

// Unregister doctor events (cleanup)
export const unregisterDoctorEvents = () => {
  // Remove system_event listener
  socket.off("system_event");
  
  // Remove individual event listeners
  socket.off("DOCTOR_REGISTERED");
  socket.off("DOCTOR_UPDATED");
  socket.off("DOCTOR_DELETED");
  socket.off("DOCTOR_PASSWORD_RESET");
  socket.off("DOCTOR_PASSWORD_CHANGED");
  
  // Remove onAny listener
  if (onAnyListener) {
    socket.offAny(onAnyListener);
    onAnyListener = null;
  }

  console.log("🧹 Doctor events unregistered");
};