// src/socket/documentEvents.js
import { socket } from "./socket";

/**
 * Registers a listener for "document_event" socket messages and dispatches
 * them to the appropriate handler based on the event type.
 *
 * Usage:
 *   registerDocumentEvents({
 *     onRegistered: ({ message, data }) => { ... },
 *     onUpdated:    ({ message, data }) => { ... },
 *     onDeleted:    ({ message, data }) => { ... },
 *   });
 *
 * @param {object} handlers - Optional map of event handlers
 */
export const registerDocumentEvents = (handlers = {}) => {
  socket.on("document_event", (payload) => {
    const { event, message, data } = payload;

    switch (event) {
      case "DOCUMENT_REGISTERED":
        handlers.onRegistered?.({ message, data });
        break;

      case "DOCUMENT_UPDATED":
        handlers.onUpdated?.({ message, data });
        break;

      case "DOCUMENT_DELETED":
        handlers.onDeleted?.({ message, data });
        break;

      default:
        // Ignore unknown document events
        break;
    }
  });
};

export const unregisterDocumentEvents = () => {
  socket.off("document_event");
};