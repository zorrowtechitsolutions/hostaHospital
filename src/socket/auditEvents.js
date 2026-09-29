// src/socket/auditEvents.js
import { socket } from "./socket";

/**
 * Register listeners for audit / auth real-time events.
 *
 * Backend emits on:
 *   - `hospital_${hospitalId}`  → when the actor belongs to a hospital
 *   - `super_admin`             → when no hospitalId and role is 'hospital' (fallback)
 *
 * Event name: `"auth_event"`
 * Payload:    { event: "AUTH_LOGIN", message, data }
 */
export const registerAuditEvents = (handlers = {}) => {
  socket.on("auth_event", (payload) => {
    const { event, message, data } = payload || {};

    switch (event) {
      case "AUTH_LOGIN":
        handlers.onAuthLogin?.({ message, data });
        break;

      // Add more audit-related event keys here as backend grows
      // e.g. "AUTH_LOGOUT", "AUTH_FAILED", "AUDIT_UPDATED"

      default:
        break;
    }
  });
};

export const unregisterAuditEvents = () => {
  socket.off("auth_event");
};