// src/socket/doctorEvents.js
import { socket } from "./socket";

/**
 * Backend (notification.handler.ts) emits ONLY these socket event names:
 *   - "hospital_event"   -> to room `hospital_${hospitalId}` and `role_1`
 *   - "doctor_event"     -> to room `doctor_${doctorId}`
 *   - "emergency_alert"  -> ALSO sent to hospital_${hospitalId} / doctor_${doctorId}
 *                           as a duplicate of hospital_event / doctor_event for:
 *                           DOCTOR_REGISTERED, DOCTOR_PASSWORD_RESET,
 *                           DOCTOR_PASSWORD_CHANGED, DOCTOR_PASSWORD_CHANGED_BY_ADMIN
 *
 * Each payload has the shape: { event, message, data }
 * "event" holds the actual routingKey (DOCTOR_REGISTERED, DOCTOR_DELETED, ...).
 *
 * IMPORTANT: hospital_event/doctor_event and emergency_alert are duplicates
 * for the events listed above. Only wire ONE of them to your normal handlers
 * or you will process the same notification twice. Use emergency_alert only
 * if you want a separate "critical alert" UI (banner/sound) in addition to
 * the normal notification list.
 */

const routeEvent = (payload, handlers) => {
  const { event, data } = payload || {};

  switch (event) {
    case "DOCTOR_REGISTERED":
      handlers.onDoctorRegistered?.(data, payload);
      break;
    case "DOCTOR_DELETED":
      handlers.onDoctorDeleted?.(data, payload);
      break;
    case "DOCTOR_RECOVERED":
      handlers.onDoctorRecovered?.(data, payload);
      break;
    case "DOCTOR_PASSWORD_RESET":
      handlers.onDoctorPasswordReset?.(data, payload);
      break;
    case "DOCTOR_PASSWORD_CHANGED":
      handlers.onDoctorPasswordChanged?.(data, payload);
      break;
    case "DOCTOR_PASSWORD_CHANGED_BY_ADMIN":
      handlers.onDoctorPasswordChangedByAdmin?.(data, payload);
      break;
    // Not currently emitted anywhere in the backend handler you shared —
    // kept here in case another handler file emits it later.
    case "DOCTOR_UPDATED":
      handlers.onDoctorUpdated?.(data, payload);
      break;
    default:
      break;
  }
};

/**
 * @param {object} handlers - your UI callbacks (onDoctorRegistered, etc.)
 * @param {object} options
 * @param {boolean} options.useEmergencyAlert
 *   If true, listens on "emergency_alert" instead of "hospital_event" /
 *   "doctor_event" for the events that are duplicated on both channels.
 *   Default false (uses the general channels).
 */
export const registerDoctorEvents = (handlers = {}, options = {}) => {
  const { useEmergencyAlert = false } = options;

  // General hospital-room channel (admin/hospital dashboards)
  socket.on("hospital_event", (payload) => {
    if (useEmergencyAlert) return; // avoid double-processing
    routeEvent(payload, handlers);
  });

  // Doctor-room channel (DOCTOR_PASSWORD_CHANGED_BY_ADMIN goes here)
  socket.on("doctor_event", (payload) => {
    if (useEmergencyAlert) return; // avoid double-processing
    routeEvent(payload, handlers);
  });

  // Duplicate/critical channel — only processed if explicitly opted in
  socket.on("emergency_alert", (payload) => {
    if (!useEmergencyAlert) return;
    routeEvent(payload, handlers);
  });
};

export const unregisterDoctorEvents = () => {
  socket.off("hospital_event");
  socket.off("doctor_event");
  socket.off("emergency_alert");
};