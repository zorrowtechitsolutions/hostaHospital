// src/socket/accessCardEvents.js
import { socket } from "./socket";

/**
 * Register listeners for access card real-time events.
 *
 * Backend emits on TWO rooms:
 *   - `role_1`                 → SuperAdmin (message includes hospital name)
 *   - `hospital_${hospitalId}` → Hospital admin (message excludes hospital name)
 *
 * Event name: `"accesscard_event"`
 * Payload:    { event, message, data }
 *
 * Events:
 *   - ACCESSCARD_ASSIGNED
 *   - ACCESSCARD_UPDATED
 *   - ACCESSCARD_DEACTIVATED
 *   - ACCESSCARD_ACTIVATED
 */
export const registerAccessCardEvents = (handlers = {}) => {
  socket.on("accesscard_event", (payload) => {
    const { event, message, data } = payload || {};

    switch (event) {
      case "ACCESSCARD_ASSIGNED":
        handlers.onAssigned?.({ message, data });
        break;

      case "ACCESSCARD_UPDATED":
        handlers.onUpdated?.({ message, data });
        break;

      case "ACCESSCARD_DEACTIVATED":
        handlers.onDeactivated?.({ message, data });
        break;

      case "ACCESSCARD_ACTIVATED":
        handlers.onActivated?.({ message, data });
        break;

      default:
        break;
    }
  });
};

export const unregisterAccessCardEvents = () => {
  socket.off("accesscard_event");
};