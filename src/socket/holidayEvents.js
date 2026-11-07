
import { socket } from "./socket";

/**
 * Register listeners for holiday real-time events.
 *
 * Backend emits:
 *   - `holiday_event`
 *
 * Payload:
 *   {
 *     event,
 *     title,
 *     message,
 *     category,
 *     severity,
 *     data,
 *     createdAt
 *   }
 *
 * Events:
 *   - HOLIDAY_CREATED
 *   - HOLIDAY_UPDATED
 *   - HOLIDAY_DELETED
 */
export const registerHolidayEvents = (handlers = {}) => {
  socket.on("holiday_event", (payload) => {
    const {
      event,
      title,
      message,
      category,
      severity,
      data,
      createdAt,
    } = payload || {};

    switch (event) {
      case "HOLIDAY_CREATED":
        handlers.onCreated?.({
          title,
          message,
          category,
          severity,
          data,
          createdAt,
        });
        break;

      case "HOLIDAY_UPDATED":
        handlers.onUpdated?.({
          title,
          message,
          category,
          severity,
          data,
          createdAt,
        });
        break;

      case "HOLIDAY_DELETED":
        handlers.onDeleted?.({
          title,
          message,
          category,
          severity,
          data,
          createdAt,
        });
        break;

      default:
        break;
    }
  });
};

export const unregisterHolidayEvents = () => {
  socket.off("holiday_event");
};
