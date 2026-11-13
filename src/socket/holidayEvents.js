
import { socket } from "./socket";

/**
 * Register listeners for holiday real-time events.
 *
 * Backend emits:
 *   - holiday_event
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
 *   - HOLIDAY_CREATED
 *   - HOLIDAY_UPDATED
 *   - HOLIDAY_DELETED
 */

export const registerHolidayEvents = (handlers = {}) => {
  const holidayListener = (payload = {}) => {
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
      category: "holiday",
      severity,
      data,
    };

    switch (event) {
      case "HOLIDAY_CREATED":
        handlers.onCreated?.(eventData);
        break;

      case "HOLIDAY_UPDATED":
        handlers.onUpdated?.(eventData);
        break;

      case "HOLIDAY_DELETED":
        handlers.onDeleted?.(eventData);
        break;

      default:
        console.warn("Unknown holiday event:", event);
        break;
    }
  };

  socket.on("holiday_event", holidayListener);

  // Return cleanup function for this listener only.
  return () => {
    socket.off("holiday_event", holidayListener);
  };
};

export const unregisterHolidayEvents = () => {
  socket.off("holiday_event");
};
