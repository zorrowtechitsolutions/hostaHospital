import { socket } from "./socket";

/**
 * Register listeners for leave real-time events.
 *
 * Backend emits:
 *   - leave_event
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
 *   - LEAVE_CREATED
 *   - LEAVE_UPDATED
 *   - LEAVE_DELETED
 *   - LEAVE_APPROVED
 *   - LEAVE_REJECTED
 *   - LEAVE_CANCELLED
 *   - LEAVE_TEMPLATE_CREATED
 *   - LEAVE_TEMPLATE_UPDATED
 *   - LEAVE_TEMPLATE_DELETED
 */

export const registerLeaveEvents = (handlers = {}) => {
  const leaveListener = (payload = {}) => {
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
      category: "leave",
      severity,
      data,
    };

    switch (event) {
      // --- STANDARD LEAVE EVENTS ---
      case "LEAVE_CREATED":
        handlers.onCreated?.(eventData);
        break;

      case "LEAVE_UPDATED":
        handlers.onUpdated?.(eventData);
        break;

      case "LEAVE_DELETED":
        handlers.onDeleted?.(eventData);
        break;

      case "LEAVE_APPROVED":
        handlers.onApproved?.(eventData);
        break;

      case "LEAVE_REJECTED":
        handlers.onRejected?.(eventData);
        break;

      case "LEAVE_CANCELLED":
        handlers.onCancelled?.(eventData);
        break;

      // --- LEAVE TEMPLATE EVENTS ---
      case "LEAVE_TEMPLATE_CREATED":
        handlers.onTemplateCreated?.(eventData);
        break;

      case "LEAVE_TEMPLATE_UPDATED":
        handlers.onTemplateUpdated?.(eventData);
        break;

      case "LEAVE_TEMPLATE_DELETED":
        handlers.onTemplateDeleted?.(eventData);
        break;

      default:
        console.warn("Unknown leave event:", event);
        break;
    }
  };

  socket.on("leave_event", leaveListener);

  // Return cleanup function for this listener only.
  return () => {
    socket.off("leave_event", leaveListener);
  };
};

export const unregisterLeaveEvents = () => {
  socket.off("leave_event");
};