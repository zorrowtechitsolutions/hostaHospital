import { socket } from "../socket/socket";

// Ambulance Events Listener
export const registerAmbulanceEvents = (handlers = {}) => {
  // ✅ REGISTER EVENT
  socket.on("AMBULANCE_REGISTERED", (data) => {
    handlers.onRegistered?.(data);
  });

  // ✅ UPDATED EVENT
  socket.on("AMBULANCE_UPDATED", (data) => {
    handlers.onUpdated?.(data);
  });

  // ✅ DELETED EVENT 
  socket.on("AMBULANCE_DELETED", (data) => {
    handlers.onDeleted?.(data);
  });
};

// Unregister ambulance events (cleanup)
export const unregisterAmbulanceEvents = () => {
  socket.off("AMBULANCE_REGISTERED");
  socket.off("AMBULANCE_UPDATED");
  socket.off("AMBULANCE_DELETED");
  console.log("🧹 Ambulance events unregistered");
};