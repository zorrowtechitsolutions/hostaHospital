// src/socket/doctorEvents.js
import { socket } from "./socket";

let onAnyListener = null;

// Doctor Events Listener - Using system_event pattern
export const registerDoctorEvents = (handlers = {}) => {
  // ✅ UNIFIED SYSTEM EVENT LISTENER (Primary)
  socket.on("system_event", (payload) => {
    // Extract event type from message (format: [EVENT_TYPE] message)
    const event = payload.message?.match(/\[(.*?)\]/)?.[1];

    switch (event) {
      case "DOCTOR_REGISTERED":
        handlers.onDoctorRegistered?.(payload.data);
        break;

      case "DOCTOR_UPDATED":
        handlers.onDoctorUpdated?.(payload.data);
        break;

      case "DOCTOR_DELETED":
        handlers.onDoctorDeleted?.(payload.data);
        break;

      case "DOCTOR_RECOVERED":
        handlers.onDoctorRecovered?.(payload.data);
        break;

      case "DOCTOR_PASSWORD_RESET":
        handlers.onDoctorPasswordReset?.(payload.data);
        break;

      case "DOCTOR_PASSWORD_CHANGED_BY_ADMIN":
  handlers.onDoctorPasswordChangedByAdmin?.(payload.data);
  break;

      default:
        // Unknown event - silently ignore
        break;
    }
  });

  // ✅ INDIVIDUAL EVENT LISTENERS (Fallback for direct events)
  socket.on("DOCTOR_REGISTERED", (data) => {
    handlers.onDoctorRegistered?.(data);
  });

  socket.on("DOCTOR_UPDATED", (data) => {
    handlers.onDoctorUpdated?.(data);
  });

  socket.on("DOCTOR_DELETED", (data) => {
    handlers.onDoctorDeleted?.(data);
  });

  socket.on("DOCTOR_RECOVERED", (data) => {
    handlers.onDoctorRecovered?.(data);
  });

  socket.on("DOCTOR_PASSWORD_RESET", (data) => {
    handlers.onDoctorPasswordReset?.(data);
  });

  socket.on("DOCTOR_PASSWORD_CHANGED_BY_ADMIN", (data) => {
    handlers.onDoctorPasswordChangedByAdmin?.(data);
  });
};

// Unregister doctor events (cleanup)
export const unregisterDoctorEvents = () => {
  // Remove system_event listener
  socket.off("system_event");
  
  // Remove individual event listeners
  socket.off("DOCTOR_REGISTERED");
  socket.off("DOCTOR_UPDATED");
  socket.off("DOCTOR_DELETED");
  socket.off("DOCTOR_RECOVERED");
  socket.off("DOCTOR_PASSWORD_RESET");
  socket.off("DOCTOR_PASSWORD_CHANGED_BY_ADMIN");
  
  // Remove onAny listener if it exists
  if (onAnyListener) {
    socket.offAny(onAnyListener);
    onAnyListener = null;
  }
};