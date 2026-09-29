// src/socket/prescriptionEvents.js
import { socket } from "./socket";

/**
 * Registers a listener for "prescription_event" socket messages and dispatches
 * them to the appropriate handler based on the event type.
 *
 * Usage:
 *   registerPrescriptionEvents({
 *     onCreated:            ({ message, data }) => { ... },
 *     onUpdated:            ({ message, data }) => { ... },
 *     onDeleted:            ({ message, data }) => { ... },
 *     onHospitalRegistered: ({ message, data }) => { ... },
 *     onHospitalUpdated:    ({ message, data }) => { ... },
 *     onHospitalDeleted:    ({ message, data }) => { ... },
 *   });
 *
 * @param {object} handlers - Optional map of event handlers
 */
export const registerPrescriptionEvents = (handlers = {}) => {
  socket.on("prescription_event", (payload) => {
    const { event, message, data } = payload;

    switch (event) {
      case "PRESCRIPTION_CREATED":
        handlers.onCreated?.({ message, data });
        break;

      case "PRESCRIPTION_UPDATED":
        handlers.onUpdated?.({ message, data });
        break;

      case "PRESCRIPTION_DELETED":
        handlers.onDeleted?.({ message, data });
        break;

      case "HOSPITALPRESCRIPTION_REGISTERED":
        handlers.onHospitalRegistered?.({ message, data });
        break;

      case "HOSPITAL_PRESCRIPTION_UPDATED":
        handlers.onHospitalUpdated?.({ message, data });
        break;

      case "HOSPITAL_PRESCRIPTION_DELETED":
        handlers.onHospitalDeleted?.({ message, data });
        break;

      default:
        // Ignore unknown prescription events
        break;
    }
  });
};

export const unregisterPrescriptionEvents = () => {
  socket.off("prescription_event");
};