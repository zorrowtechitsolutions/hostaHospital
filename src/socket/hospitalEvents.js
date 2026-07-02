// src/socket/hospitalEvents.js
import { socket } from "./socket";

let onAnyListener = null;

// Hospital Events Listener
export const registerHospitalEvents = (handlers = {}) => {
  if (!onAnyListener) {
    onAnyListener = () => {};
    socket.onAny(onAnyListener);
  }

  // UNIFIED SYSTEM EVENT LISTENER
  socket.on("system_event", (payload) => {
    const event = payload.message?.match(/\[(.*?)\]/)?.[1];

    switch (event) {
      case "HOSPITAL_REGISTERED":
        handlers.onHospitalRegistered?.(payload.data);
        break;
      case "HOSPITAL_UPDATED":
        handlers.onHospitalUpdated?.(payload.data);
        break;
      case "HOSPITAL_DELETED":
        handlers.onHospitalDeleted?.(payload.data);
        break;
      case "HOSPITAL_BLACKLISTED":
        handlers.onHospitalBlacklisted?.(payload.data);
        break;
      case "HOSPITAL_RECOVERED":
        handlers.onHospitalRecovered?.(payload.data);
        break;
      default:
        break;
    }
  });

  // INDIVIDUAL EVENT LISTENERS (Fallback)
  socket.on("HOSPITAL_REGISTERED", (data) => {
    handlers.onHospitalRegistered?.(data);
  });

  socket.on("HOSPITAL_UPDATED", (data) => {
    handlers.onHospitalUpdated?.(data);
  });

  socket.on("HOSPITAL_DELETED", (data) => {
    handlers.onHospitalDeleted?.(data);
  });

  socket.on("HOSPITAL_BLACKLISTED", (data) => {
    handlers.onHospitalBlacklisted?.(data);
  });

  socket.on("HOSPITAL_RECOVERED", (data) => {
    handlers.onHospitalRecovered?.(data);
  });
};

// Unregister hospital events
export const unregisterHospitalEvents = () => {
  socket.off("system_event");
  socket.off("HOSPITAL_REGISTERED");
  socket.off("HOSPITAL_UPDATED");
  socket.off("HOSPITAL_DELETED");
  socket.off("HOSPITAL_BLACKLISTED");
  socket.off("HOSPITAL_RECOVERED");
  
  if (onAnyListener) {
    socket.offAny(onAnyListener);
    onAnyListener = null;
  }
};