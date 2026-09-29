// src/socket/fingerprintEvents.js
import { socket } from "./socket";

export const registerFingerprintEvents = (handlers = {}) => {
  socket.on("fingerprint_event", (payload) => {
    const { event, message, data } = payload;

    switch (event) {
      case "FINGERPRINT_REGISTERED":
        handlers.onRegistered?.({ message, data });
        break;

      case "FINGERPRINT_UPDATED":
        handlers.onUpdated?.({ message, data });
        break;

      case "FINGERPRINT_DEACTIVATED":
        handlers.onDeactivated?.({ message, data });
        break;

      case "FINGERPRINT_ACTIVATED":
        handlers.onActivated?.({ message, data });
        break;

      default:
        break;
    }
  });
};

export const unregisterFingerprintEvents = () => {
  socket.off("fingerprint_event");
};