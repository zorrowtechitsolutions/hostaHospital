import { socket } from "./socket";

// Patient Events Listener - EXACT MATCH with backend
export const registerPatientEvents = (handlers = {}) => {
  console.log("✅ Patient listeners registered");
  console.log("📡 Socket connected:", socket.connected);
  console.log("📡 Socket ID:", socket.id);

  // Log ALL socket events for debugging
  socket.onAny((event, ...args) => {
    console.log("📡 ALL SOCKET EVENTS - PATIENT:", event, args);
  });

  // ✅ PATIENT REGISTERED EVENT
  socket.on("PATIENT_REGISTERED", (data) => {
    console.log("👤 Patient Registered:", data);
    handlers.onPatientRegistered?.(data);
  });

  // ✅ PATIENT UPDATED EVENT
  socket.on("PATIENT_UPDATED", (data) => {
    console.log("✏️ Patient Updated:", data);
    handlers.onPatientUpdated?.(data);
  });

  // ✅ PATIENT DELETED EVENT
  socket.on("PATIENT_DELETED", (data) => {
    console.log("🗑️ Patient Deleted:", data);
    handlers.onPatientDeleted?.(data);
  });

  console.log("✅ Patient listeners setup complete");
};

// Unregister patient events (cleanup)
export const unregisterPatientEvents = () => {
  socket.off("PATIENT_REGISTERED");
  socket.off("PATIENT_UPDATED");
  socket.off("PATIENT_DELETED");
  
  // Also remove the onAny listener
  socket.offAny();
  
  console.log("🧹 Patient events unregistered");
};