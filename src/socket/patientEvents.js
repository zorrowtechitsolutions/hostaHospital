// src/socket/patientEvents.js
import { socket } from "./socket";

export const registerPatientEvents = (handlers = {}) => {
  socket.on("patient_event", (payload) => {
    const { event, message, data } = payload;

    switch (event) {
      case "PATIENT_REGISTERED":
        handlers.onRegistered?.({ message, data });
        break;

      case "PATIENT_UPDATED":
        handlers.onUpdated?.({ message, data });
        break;

      case "PATIENT_DELETED":
        handlers.onDeleted?.({ message, data });
        break;

      case "PATIENT_RECOVERED":
        handlers.onRecovered?.({ message, data });
        break;

      default:
        break;
    }
  });
};

export const unregisterPatientEvents = () => {
  socket.off("patient_event");
};