// src/socket/deviceEvents.js
import { socket } from "./socket";

export const registerDeviceEvents = (handlers = {}) => {
  socket.on("device_event", (payload) => {
    const { event, message, data } = payload;

    switch (event) {
      case "DEVICE_REGISTERED":
        handlers.onRegistered?.({ message, data });
        break;

      case "DEVICE_UPDATED":
        handlers.onUpdated?.({ message, data });
        break;

      case "DEVICE_UNREGISTERED":
        handlers.onUnregistered?.({ message, data });
        break;

      case "DEVICE_RESTORED":
        handlers.onRestored?.({ message, data });
        break;

      case "DEVICE_DELETED":
        handlers.onDeleted?.({ message, data });
        break;

      case "DEVICE_CREDENTIALS_REGENERATED":
        handlers.onCredentialsRegenerated?.({ message, data });
        break;

      default:
        break;
    }
  });
};

export const unregisterDeviceEvents = () => {
  socket.off("device_event");
};