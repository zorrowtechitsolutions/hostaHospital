import { socket } from "./socket";

/**
 * Register listeners for attendance real-time events.
 *
 * Backend emits:
 *   - attendance_event
 *
 * Payload:
 *   {
 *     event,
 *     title,
 *     message,
 *     severity,
 *     data
 *   }
 *
 * Events:
 *   - ATTENDANCE_REGISTERED
 *   - ATTENDANCE_UPDATED
 *   - ATTENDANCE_DELETED
 *   - ATTENDANCE_CHECKED_IN
 *   - ATTENDANCE_CHECKED_OUT
 *   - ATTENDANCE_CREATED_MANUALLY
 *
 * Note: Legacy payloads (non-structured) may also arrive with the same
 * event names — the backend normalizes them into the same shape before emit.
 */

export const registerAttendanceEvents = (handlers = {}) => {
  const attendanceListener = (payload = {}) => {
    const {
      event,
      title,
      message,
      severity,
      data,
    } = payload;

    const eventData = {
      title,
      message,
      category: "attendance",
      severity,
      data,
    };

    switch (event) {
      case "ATTENDANCE_REGISTERED":
        handlers.onRegistered?.(eventData);
        break;

      case "ATTENDANCE_UPDATED":
        handlers.onUpdated?.(eventData);
        break;

      case "ATTENDANCE_DELETED":
        handlers.onDeleted?.(eventData);
        break;

      case "ATTENDANCE_CHECKED_IN":
        handlers.onCheckedIn?.(eventData);
        break;

      case "ATTENDANCE_CHECKED_OUT":
        handlers.onCheckedOut?.(eventData);
        break;

      case "ATTENDANCE_CREATED_MANUALLY":
        handlers.onCreatedManually?.(eventData);
        break;

      default:
        console.warn("Unknown attendance event:", event);
        break;
    }
  };

  socket.on("attendance_event", attendanceListener);

  // Return cleanup function for this listener only.
  return () => {
    socket.off("attendance_event", attendanceListener);
  };
};

export const unregisterAttendanceEvents = () => {
  socket.off("attendance_event");
};