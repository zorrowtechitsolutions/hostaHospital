// src/socket/prescriptionEvents.js
import { socket } from "./socket";

let onAnyListener = null;

// Prescription Events Listener - Using system_event pattern
export const registerPrescriptionEvents = (handlers = {}) => {
  console.log("✅ Prescription listeners registered");
  console.log("📡 Socket connected:", socket.connected);
  console.log("📡 Socket ID:", socket.id);

  // Log ALL socket events for debugging
  if (!onAnyListener) {
    onAnyListener = (event, ...args) => {
      console.log("📡 ALL SOCKET EVENTS - PRESCRIPTION:", event, args);
    };
    socket.onAny(onAnyListener);
  }

  // ✅ UNIFIED SYSTEM EVENT LISTENER (Primary)
  socket.on("system_event", (payload) => {
    console.log("🔥 SYSTEM EVENT (PRESCRIPTION):", payload);

    // Extract event type from message (format: [EVENT_TYPE] message)
    const event = payload.message?.match(/\[(.*?)\]/)?.[1];

    switch (event) {
      case "PRESCRIPTION_CREATED":
        console.log("📋 Prescription Created:", payload.data);
        handlers.onPrescriptionCreated?.(payload.data);
        break;

      case "PRESCRIPTION_UPDATED":
        console.log("✏️ Prescription Updated:", payload.data);
        handlers.onPrescriptionUpdated?.(payload.data);
        break;

      case "PRESCRIPTION_DELETED":
        console.log("🗑️ Prescription Deleted:", payload.data);
        handlers.onPrescriptionDeleted?.(payload.data);
        break;

      default:
        console.log("Unknown prescription event:", event);
    }
  });

  // ✅ INDIVIDUAL EVENT LISTENERS (Fallback for direct events)
  socket.on("PRESCRIPTION_CREATED", (data) => {
    console.log("📋 Prescription Created (direct):", data);
    handlers.onPrescriptionCreated?.(data);
  });

  socket.on("PRESCRIPTION_UPDATED", (data) => {
    console.log("✏️ Prescription Updated (direct):", data);
    handlers.onPrescriptionUpdated?.(data);
  });

  socket.on("PRESCRIPTION_DELETED", (data) => {
    console.log("🗑️ Prescription Deleted (direct):", data);
    handlers.onPrescriptionDeleted?.(data);
  });

  console.log("✅ Prescription listeners setup complete");
};

// Unregister prescription events (cleanup)
export const unregisterPrescriptionEvents = () => {
  // Remove system_event listener
  socket.off("system_event");
  
  // Remove individual event listeners
  socket.off("PRESCRIPTION_CREATED");
  socket.off("PRESCRIPTION_UPDATED");
  socket.off("PRESCRIPTION_DELETED");
  
  // Remove onAny listener
  if (onAnyListener) {
    socket.offAny(onAnyListener);
    onAnyListener = null;
  }

  console.log("🧹 Prescription events unregistered");
};