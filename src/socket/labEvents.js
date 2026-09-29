// src/socket/labEvents.js
import { socket } from "./socket";

/**
 * Registers a listener for "labresult_event" socket messages and dispatches
 * them to the appropriate handler based on the event type.
 *
 * Usage:
 *   registerLabEvents({
 *     onRegistered: ({ message, data }) => { ... },
 *     onUpdated:    ({ message, data }) => { ... },
 *     onDeleted:    ({ message, data }) => { ... },
 *     onRecovered:  ({ message, data }) => { ... },  // ✅ NEW
 *     onTestRegistered:   ({ message, data }) => { ... },
 *     onReportRegistered: ({ message, data }) => { ... },
 *     onReportUpdated:    ({ message, data }) => { ... },
 *   });
 *
 * @param {object} handlers - Optional map of event handlers
 */
export const registerLabEvents = (handlers = {}) => {
  socket.on("labresult_event", (payload) => {
    const { event, message, data } = payload;

    switch (event) {
      case "LABRESULT_REGISTERED":
        handlers.onRegistered?.({ message, data });
        break;

      case "LABRESULT_UPDATED":
        handlers.onUpdated?.({ message, data });
        break;

      case "LABRESULT_DELETED":
        handlers.onDeleted?.({ message, data });
        break;

      // ✅ NEW: recover event
      case "LABRESULT_RECOVERED":
        handlers.onRecovered?.({ message, data });
        break;

      case "TEST_REGISTERED":
        handlers.onTestRegistered?.({ message, data });
        break;

      case "REPORT_REGISTERED":
        handlers.onReportRegistered?.({ message, data });
        break;

      case "REPORT_UPDATED":
        handlers.onReportUpdated?.({ message, data });
        break;

      default:
        // Ignore unknown lab events
        break;
    }
  });
};

export const unregisterLabEvents = () => {
  socket.off("labresult_event");
};