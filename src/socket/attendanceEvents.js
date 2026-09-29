// src/socket/attendanceEvents.js
import { socket } from "./socket";

/**
 * Register listeners for attendance real-time events.
 *
 * Backend emits on TWO rooms:
 *   - `role_1`                 → SuperAdmin (message includes hospital name)
 *   - `hospital_${hospitalId}` → Hospital admin (message excludes hospital name)
 *
 * Event name: `"attendance_event"`
 * Payload:    { event, message, data }
 *
 * Events:
 *   - ATTENDANCE_REGISTERED  (check-in / check-out — Face, RFID, Fingerprint, Punch)
 *   - ATTENDANCE_UPDATED
 *   - ATTENDANCE_DELETED
 */
export const registerAttendanceEvents = (handlers = {}) => {
  socket.on("attendance_event", (payload) => {
    const { event, message, data } = payload || {};

    switch (event) {
      case "ATTENDANCE_REGISTERED":
        handlers.onRegistered?.({ message, data });
        break;

      case "ATTENDANCE_UPDATED":
        handlers.onUpdated?.({ message, data });
        break;

      case "ATTENDANCE_DELETED":
        handlers.onDeleted?.({ message, data });
        break;

      default:
        break;
    }
  });
};

export const unregisterAttendanceEvents = () => {
  socket.off("attendance_event");
};