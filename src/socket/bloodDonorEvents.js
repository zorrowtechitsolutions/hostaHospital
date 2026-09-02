// bloodDonorEvents.js
import { socket } from "./socket";

export const registerBloodDonorEvents = (handlers = {}) => {
  socket.on("blood_events", (payload) => {
    const event = payload.event;

    switch (event) {
      case "DONOR_REGISTERED":
        handlers.onDonorRegistered?.(payload.data);
        break;

      case "DONOR_UPDATED":
        handlers.onDonorUpdated?.(payload.data);
        break;

      case "DONOR_DELETED":
        handlers.onDonorDeleted?.(payload.data);
        break;

      default:
    }
  });
};

export const unregisterBloodDonorEvents = () => {
  socket.off("blood_events");
};