// src/socket/prescriptionEvents.js
import { socket } from "./socket";

/**
 * Registers a listener for "prescription_event" socket messages and dispatches
 * them to the appropriate handler based on the event type.
 *
 * Returns a cleanup function that removes ONLY this listener, so it is safe
 * to call inside a React `useEffect` return.
 *
 * Usage:
 *   useEffect(() => {
 *     const cleanup = registerPrescriptionEvents({
 *       onCreated:            ({ message, data }) => { ... },
 *       onUpdated:            ({ message, data }) => { ... },
 *       onDeleted:            ({ message, data }) => { ... },
 *       onRecovered:          ({ message, data }) => { ... },
 *       onHospitalRegistered: ({ message, data }) => { ... },
 *       onHospitalUpdated:    ({ message, data }) => { ... },
 *       onHospitalDeleted:    ({ message, data }) => { ... },
 *     });
 *     return cleanup;
 *   }, []);
 *
 * @param {object} handlers - Optional map of event handlers
 * @returns {() => void} cleanup function
 */
export const registerPrescriptionEvents = (handlers = {}) => {
  const handlePrescriptionEvent = (payload) => {
    if (!payload || typeof payload.event !== "string") {
      console.warn(
        "[Prescription Socket] Invalid payload:",
        payload
      );
      return;
    }

    const { event, message, data } = payload;


    const result = { message, data };

    switch (event) {
      case "PRESCRIPTION_CREATED":
        handlers.onCreated?.(result);
        break;

      case "PRESCRIPTION_UPDATED":
        handlers.onUpdated?.(result);
        break;

      case "PRESCRIPTION_DELETED":
        handlers.onDeleted?.(result);
        break;

      case "PRESCRIPTION_RECOVERED":
        handlers.onRecovered?.(result);
        break;

      case "HOSPITALPRESCRIPTION_REGISTERED":
        handlers.onHospitalRegistered?.(result);
        break;

      case "HOSPITAL_PRESCRIPTION_UPDATED":
        handlers.onHospitalUpdated?.(result);
        break;

      case "HOSPITAL_PRESCRIPTION_DELETED":
        handlers.onHospitalDeleted?.(result);
        break;

      default:
        console.warn(
          "[Prescription Socket] Unknown event:",
          event
        );
    }
  };

  socket.on("prescription_event", handlePrescriptionEvent);

  // Remove only this listener.
  return () => {
    socket.off("prescription_event", handlePrescriptionEvent);
  };
};

/**
 * @deprecated Use the cleanup function returned by `registerPrescriptionEvents`
 * instead. This removes ALL listeners for "prescription_event", which can
 * accidentally detach other components' listeners.
 */
export const unregisterPrescriptionEvents = () => {
  socket.off("prescription_event");
};