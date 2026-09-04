import { socket } from "../socket/socket";

export const registerAmbulanceEvents = (handlers = {}) => {
  socket.on("ambulance_events", (payload) => {
    const { event, message, data } = payload;

    switch (event) {
      case "AMBULANCE_REGISTERED":
        handlers.onRegistered?.({ message, data });
        break;

      case "AMBULANCE_UPDATED":
        handlers.onUpdated?.({ message, data });
        break;

      case "AMBULANCE_DELETED":
        handlers.onDeleted?.({ message, data });
        break;

      default:
        break;
    }
  }); 
};

export const unregisterAmbulanceEvents = () => {
  socket.off("ambulance_events");
};