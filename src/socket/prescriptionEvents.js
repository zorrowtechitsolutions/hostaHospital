import { socket } from "./socket";

// Prescription Events Listener - EXACT MATCH with backend
export const registerPrescriptionEvents = (handlers = {}) => {
  console.log("✅ Prescription listeners registered");
  console.log("📡 Socket connected:", socket.connected);
  console.log("📡 Socket ID:", socket.id);

  // Log ALL socket events for debugging
  socket.onAny((event, ...args) => {
    console.log("📡 ALL SOCKET EVENTS - PRESCRIPTION:", event, args);
  });

  // ✅ PRESCRIPTION CREATED EVENT
  socket.on("PRESCRIPTION_CREATED", (data) => {
    console.log("📋 Prescription Created:", data);
    handlers.onPrescriptionCreated?.(data);
  });

  // ✅ PRESCRIPTION UPDATED EVENT
  socket.on("PRESCRIPTION_UPDATED", (data) => {
    console.log("✏️ Prescription Updated:", data);
    handlers.onPrescriptionUpdated?.(data);
  });

  // ✅ PRESCRIPTION DELETED EVENT
  socket.on("PRESCRIPTION_DELETED", (data) => {
    console.log("🗑️ Prescription Deleted:", data);
    handlers.onPrescriptionDeleted?.(data);
  });

  console.log("✅ Prescription listeners setup complete");
};

// Unregister prescription events (cleanup)
export const unregisterPrescriptionEvents = () => {
  socket.off("PRESCRIPTION_CREATED");
  socket.off("PRESCRIPTION_UPDATED");
  socket.off("PRESCRIPTION_DELETED");
  
  // Also remove the onAny listener
  socket.offAny();
  
  console.log("🧹 Prescription events unregistered");
};