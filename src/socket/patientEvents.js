// src/socket/patientEvents.js
import { socket } from "./socket";

let onAnyListener = null;

export const registerPatientEvents = (handlers = {}) => {
  console.log("✅ Registering Patient Socket Events");

  if (!onAnyListener) {
    onAnyListener = (event, ...args) => {
      console.log("📡 SOCKET EVENT:", event, args);
    };

    socket.onAny(onAnyListener);
  }

  socket.off("system_event");

  socket.on("system_event", (payload) => {
    console.log("🔥 INSIDE SYSTEM EVENT", payload);

    const event = payload.message?.match(/\[(.*?)\]/)?.[1];

    if (event === "PATIENT_REGISTERED") {
      console.log("👤 Patient Registered:", payload.data);
      handlers.onPatientRegistered?.(payload.data);
    }

    if (event === "PATIENT_UPDATED") {
      console.log("✏️ Patient Updated:", payload.data);
      handlers.onPatientUpdated?.(payload.data);
    }

    if (event === "PATIENT_DELETED") {
      console.log("🗑️ Patient Deleted:", payload.data);
      handlers.onPatientDeleted?.(payload.data);
    }

    // ✅ NEW: Handle PATIENT_RECOVERED event
    if (event === "PATIENT_RECOVERED") {
      console.log("♻️ Patient Recovered:", payload.data);
      handlers.onPatientRecovered?.(payload.data);
    }
  });

  console.log("✅ Patient listeners setup complete");
};

export const unregisterPatientEvents = () => {
  socket.off("system_event");

  if (onAnyListener) {
    socket.offAny(onAnyListener);
    onAnyListener = null;
  }

  console.log("🧹 Patient events removed");
};