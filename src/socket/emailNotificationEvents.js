// src/socket/emailNotificationEvents.js
import { socket } from "./socket";

/**
 * Register listeners for email notification real-time events.
 *
 * Backend emits on `hospital_${hospitalId}` with event name `email_event`.
 *
 * Payload: { event, message, data }
 *
 * Events:
 *   ── Draft lifecycle ──
 *   - EMAIL_DRAFT_SAVED
 *   - EMAIL_DRAFT_SENT
 *
 *   ── Send lifecycle ──
 *   - EMAIL_QUEUED
 *   - EMAIL_SENDING
 *   - EMAIL_SUCCESS
 *   - EMAIL_PARTIAL
 *   - EMAIL_FAILED
 */
export const registerEmailNotificationEvents = (handlers = {}) => {
  socket.on("email_event", (payload) => {
    const { event, message, data } = payload || {};

    switch (event) {
      case "EMAIL_DRAFT_SAVED":
        handlers.onDraftSaved?.({ message, data });
        break;

      case "EMAIL_DRAFT_SENT":
        handlers.onDraftSent?.({ message, data });
        break;

      case "EMAIL_QUEUED":
        handlers.onQueued?.({ message, data });
        break;

      case "EMAIL_SENDING":
        handlers.onSending?.({ message, data });
        break;

      case "EMAIL_SUCCESS":
        handlers.onSuccess?.({ message, data });
        break;

      case "EMAIL_PARTIAL":
        handlers.onPartial?.({ message, data });
        break;

      case "EMAIL_FAILED":
        handlers.onFailed?.({ message, data });
        break;

      default:
        break;
    }
  });
};

export const unregisterEmailNotificationEvents = () => {
  socket.off("email_event");
};