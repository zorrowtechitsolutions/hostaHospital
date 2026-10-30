// src/socket/vitalEvent.js
import { socket } from "./socket";

/**
 * Register listeners for patient vitals real-time events.
 *
 * Backend emits on `hospital_${hospitalId}`, `user_${userId}`, and
 * `patient_${patientId}` with event name `patientvitals_event`.
 *
 * Payload: { event, title, type, message, data }
 *
 * Events:
 *   - PATIENTVITALS_REGISTERED
 *   - PATIENTVITALS_UPDATED
 *   - PATIENTVITALS_DELETED
 */
export const registerPatientVitalsEvents = (handlers = {}) => {
  socket.on("patientvitals_event", (payload) => {
    const { event, title, type, message, data } = payload || {};

    switch (event) {
      case "PATIENTVITALS_REGISTERED":
        handlers.onRegistered?.({ title, type, message, data });
        break;

      case "PATIENTVITALS_UPDATED":
        handlers.onUpdated?.({ title, type, message, data });
        break;

      case "PATIENTVITALS_DELETED":
        handlers.onDeleted?.({ title, type, message, data });
        break;

      default:
        break;
    }
  });
};

export const unregisterPatientVitalsEvents = () => {
  socket.off("patientvitals_event");
};