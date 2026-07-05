// src/socket/prescriptionEvents.js
import { socket } from "./socket";

let onAnyListener = null;

// Prescription Events Listener
export const registerPrescriptionEvents = (handlers = {}) => {
  if (!onAnyListener) {
    onAnyListener = () => {};
    socket.onAny(onAnyListener);
  }

  // UNIFIED SYSTEM EVENT LISTENER
  socket.on("system_event", (payload) => {
    const event = payload.message?.match(/\[(.*?)\]/)?.[1];

    switch (event) {
      case "PRESCRIPTION_CREATED":
        handlers.onPrescriptionCreated?.(payload.data);
        break;
      case "PRESCRIPTION_UPDATED":
        handlers.onPrescriptionUpdated?.(payload.data);
        break;
      case "PRESCRIPTION_DELETED":
        handlers.onPrescriptionDeleted?.(payload.data);
        break;
      default:
        break;
    }
  });

  // INDIVIDUAL EVENT LISTENERS (Fallback)
  socket.on("PRESCRIPTION_CREATED", (data) => {
    handlers.onPrescriptionCreated?.(data);
  });

  socket.on("PRESCRIPTION_UPDATED", (data) => {
    handlers.onPrescriptionUpdated?.(data);
  });

  socket.on("PRESCRIPTION_DELETED", (data) => {
    handlers.onPrescriptionDeleted?.(data);
  });
};

// Unregister prescription events
export const unregisterPrescriptionEvents = () => {
  socket.off("system_event");
  socket.off("PRESCRIPTION_CREATED");
  socket.off("PRESCRIPTION_UPDATED");
  socket.off("PRESCRIPTION_DELETED");
  
  if (onAnyListener) {
    socket.offAny(onAnyListener);
    onAnyListener = null;
  }
};