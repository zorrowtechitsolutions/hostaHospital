// src/socket/emailTemplateEvents.js
import { socket } from "./socket";

/**
 * Register listeners for email template real-time events.
 *
 * Backend emits on TWO rooms:
 *   - `hospital_${hospitalId}`  → hospital dashboard
 *   - `staff_${createdBy}`      → the staff member who created the template
 *
 * Event name: `"template_event"`
 * Payload:    { event, message, data }
 *
 * Events:
 *   - TEMPLATE_CREATED
 *   - TEMPLATE_UPDATED
 *   - TEMPLATE_DELETED
 */
export const registerEmailTemplateEvents = (handlers = {}) => {
  socket.on("template_event", (payload) => {
    const { event, message, data } = payload || {};

    switch (event) {
      case "TEMPLATE_CREATED":
        handlers.onCreated?.({ message, data });
        break;

      case "TEMPLATE_UPDATED":
        handlers.onUpdated?.({ message, data });
        break;

      case "TEMPLATE_DELETED":
        handlers.onDeleted?.({ message, data });
        break;

      default:
        break;
    }
  });
};

export const unregisterEmailTemplateEvents = () => {
  socket.off("template_event");
};