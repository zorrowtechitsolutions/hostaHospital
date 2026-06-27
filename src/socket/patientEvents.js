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

  socket.off("patient_event");

 socket.on("system_event", (payload) => {
  console.log("🔥 INSIDE SYSTEM EVENT", payload);

  const event = payload.message?.match(/\[(.*?)\]/)?.[1];

  if (event === "PATIENT_REGISTERED") {
    handlers.onPatientRegistered?.(payload.data);
  }

  if (event === "PATIENT_UPDATED") {
    handlers.onPatientUpdated?.(payload.data);
  }

  if (event === "PATIENT_DELETED") {
    handlers.onPatientDeleted?.(payload.data);
  }
});
}
export const unregisterPatientEvents = () => {
  socket.off("patient_event");

  if (onAnyListener) {
    socket.offAny(onAnyListener);
    onAnyListener = null;
  }

  console.log("🧹 Patient events removed");
};