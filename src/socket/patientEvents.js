// src/socket/patientEvents.js
import { socket } from "./socket";

let onAnyListener = null;

export const registerPatientEvents = (handlers = {}) => {
  if (!onAnyListener) {
    onAnyListener = () => {};
    socket.onAny(onAnyListener);
  }

  socket.off("system_event");

  socket.on("system_event", (payload) => {
    const event = payload.message?.match(/\[(.*?)\]/)?.[1];

    switch (event) {
      case "PATIENT_REGISTERED":
        handlers.onPatientRegistered?.(payload.data);
        break;
      case "PATIENT_UPDATED":
        handlers.onPatientUpdated?.(payload.data);
        break;
      case "PATIENT_DELETED":
        handlers.onPatientDeleted?.(payload.data);
        break;
      case "PATIENT_RECOVERED":
        handlers.onPatientRecovered?.(payload.data);
        break;
      default:
        break;
    }
  });
};

export const unregisterPatientEvents = () => {
  socket.off("system_event");

  if (onAnyListener) {
    socket.offAny(onAnyListener);
    onAnyListener = null;
  }
};