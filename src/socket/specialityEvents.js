// src/socket/specialityEvents.js
import { socket } from "./socket";

let onAnyListener = null;

// Speciality Events Listener
export const registerSpecialityEvents = (handlers = {}) => {
  // Track all socket events for debugging (optional - can be removed entirely)
  if (!onAnyListener) {
    onAnyListener = () => {};
    socket.onAny(onAnyListener);
  }

  // UNIFIED SYSTEM EVENT LISTENER
  socket.on("system_event", (payload) => {
    const event = payload.message?.match(/\[(.*?)\]/)?.[1];

    switch (event) {
      case "SPECIALITY_REGISTERED":
        handlers.onSpecialityRegistered?.(payload.data);
        break;
      case "SPECIALITY_UPDATED":
        handlers.onSpecialityUpdated?.(payload.data);
        break;
      case "SPECIALITY_DELETED":
        handlers.onSpecialityDeleted?.(payload.data);
        break;
      default:
        break;
    }
  });

  // INDIVIDUAL EVENT LISTENERS (Fallback)
  socket.on("SPECIALITY_REGISTERED", (data) => {
    handlers.onSpecialityRegistered?.(data);
  });

  socket.on("SPECIALITY_UPDATED", (data) => {
    handlers.onSpecialityUpdated?.(data);
  });

  socket.on("SPECIALITY_DELETED", (data) => {
    handlers.onSpecialityDeleted?.(data);
  });
};

// Unregister speciality events
export const unregisterSpecialityEvents = () => {
  socket.off("system_event");
  socket.off("SPECIALITY_REGISTERED");
  socket.off("SPECIALITY_UPDATED");
  socket.off("SPECIALITY_DELETED");
  
  if (onAnyListener) {
    socket.offAny(onAnyListener);
    onAnyListener = null;
  }
};