// src/socket/permissionEvents.js
import { socket } from "./socket";

let onAnyListener = null;

// Permission Events Listener
export const registerPermissionEvents = (handlers = {}) => {
  if (!onAnyListener) {
    onAnyListener = () => {};
    socket.onAny(onAnyListener);
  }

  // UNIFIED SYSTEM EVENT LISTENER
  socket.on("system_event", (payload) => {
    const event = payload.message?.match(/\[(.*?)\]/)?.[1];

    switch (event) {
      case "PERMISSION_REGISTERED":
        handlers.onPermissionRegistered?.(payload.data);
        break;
      case "PERMISSION_UPDATED":
        handlers.onPermissionUpdated?.(payload.data);
        break;
      case "PERMISSION_DELETED":
        handlers.onPermissionDeleted?.(payload.data);
        break;
      default:
        break;
    }
  });

  // INDIVIDUAL EVENT LISTENERS (Fallback)
  socket.on("PERMISSION_REGISTERED", (data) => {
    handlers.onPermissionRegistered?.(data);
  });

  socket.on("PERMISSION_UPDATED", (data) => {
    handlers.onPermissionUpdated?.(data);
  });

  socket.on("PERMISSION_DELETED", (data) => {
    handlers.onPermissionDeleted?.(data);
  });
};

// Unregister permission events
export const unregisterPermissionEvents = () => {
  socket.off("system_event");
  socket.off("PERMISSION_REGISTERED");
  socket.off("PERMISSION_UPDATED");
  socket.off("PERMISSION_DELETED");
  
  if (onAnyListener) {
    socket.offAny(onAnyListener);
    onAnyListener = null;
  }
};