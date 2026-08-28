import { socket } from "./socket";

export const registerAdEvents = (handlers = {}) => {
  // Backend emits: socketEmitter.to(`hospital_${hospitalId}`).emit("hospital_event", {...})
  socket.on("hospital_event", (payload) => {
    const { event, message, data } = payload || {};

    switch (event) {
      case "AD_CREATED":
        handlers.onAdCreated?.(data, message);
        break;
      case "AD_UPDATED":
        handlers.onAdUpdated?.(data, message);
        break;
      case "AD_DELETED":
        handlers.onAdDeleted?.(data, message);
        break;
      default:
        // Not an ad event (hospital_event may carry other event types too)
        break;
    }
  });
};

export const unregisterAdEvents = () => {
  socket.off("hospital_event");
};