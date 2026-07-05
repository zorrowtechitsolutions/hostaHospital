// src/socket/roleEvents.js
import { socket } from "./socket";

let onAnyListener = null;

// Role Events Listener
export const registerRoleEvents = (handlers = {}) => {
  if (!onAnyListener) {
    onAnyListener = () => {};
    socket.onAny(onAnyListener);
  }

  // UNIFIED SYSTEM EVENT LISTENER
  socket.on("system_event", (payload) => {
    const event = payload.message?.match(/\[(.*?)\]/)?.[1];

    switch (event) {
      case "ROLE_REGISTERED":
        handlers.onRoleRegistered?.(payload.data);
        break;
      case "ROLE_UPDATED":
        handlers.onRoleUpdated?.(payload.data);
        break;
      case "ROLE_DELETED":
        handlers.onRoleDeleted?.(payload.data);
        break;
      default:
        break;
    }
  });

  // INDIVIDUAL EVENT LISTENERS (Fallback)
  socket.on("ROLE_REGISTERED", (data) => {
    handlers.onRoleRegistered?.(data);
  });

  socket.on("ROLE_UPDATED", (data) => {
    handlers.onRoleUpdated?.(data);
  });

  socket.on("ROLE_DELETED", (data) => {
    handlers.onRoleDeleted?.(data);
  });
};

// Unregister role events
export const unregisterRoleEvents = () => {
  socket.off("system_event");
  socket.off("ROLE_REGISTERED");
  socket.off("ROLE_UPDATED");
  socket.off("ROLE_DELETED");
  
  if (onAnyListener) {
    socket.offAny(onAnyListener);
    onAnyListener = null;
  }
};