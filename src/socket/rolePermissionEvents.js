// src/socket/rolePermissionEvents.js
import { socket } from "./socket";

let onAnyListener = null;

// Role Permission Events Listener
export const registerRolePermissionEvents = (handlers = {}) => {
  if (!onAnyListener) {
    onAnyListener = () => {};
    socket.onAny(onAnyListener);
  }

  // UNIFIED SYSTEM EVENT LISTENER
  socket.on("system_event", (payload) => {
    const event = payload.message?.match(/\[(.*?)\]/)?.[1];

    switch (event) {
      case "ROLEPERMISSION_UPDATED":
        handlers.onRolePermissionUpdated?.(payload.data);
        break;
      default:
        break;
    }
  });

  // INDIVIDUAL EVENT LISTENERS (Fallback)
  socket.on("ROLEPERMISSION_UPDATED", (data) => {
    handlers.onRolePermissionUpdated?.(data);
  });
};

// Unregister role permission events
export const unregisterRolePermissionEvents = () => {
  socket.off("system_event");
  socket.off("ROLEPERMISSION_UPDATED");
  
  if (onAnyListener) {
    socket.offAny(onAnyListener);
    onAnyListener = null;
  }
};