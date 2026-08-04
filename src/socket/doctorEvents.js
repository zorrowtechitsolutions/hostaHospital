// src/socket/doctorEvents.js
import { socket } from "./socket";

let onAnyListener = null;

export const registerDoctorEvents = (handlers = {}) => {
  socket.on("system_event", (payload) => {
    const event =
      payload.event ||
      payload.type ||
      payload.message?.match(/\[(.*?)\]/)?.[1];

    switch (event) {
      case "DOCTOR_REGISTERED":
        handlers.onDoctorRegistered?.(payload.data);
        break;

      case "DOCTOR_UPDATED":
        handlers.onDoctorUpdated?.(payload.data);
        break;

      case "DOCTOR_DELETED":
        handlers.onDoctorDeleted?.(payload.data);
        break;

      case "DOCTOR_RECOVERED":
        handlers.onDoctorRecovered?.(payload.data);
        break;

      case "DOCTOR_PASSWORD_RESET":
        handlers.onDoctorPasswordReset?.(payload.data);
        break;

      case "DOCTOR_PASSWORD_CHANGED":
        handlers.onDoctorPasswordChanged?.(payload.data);
        break;

      case "DOCTOR_PASSWORD_CHANGED_BY_ADMIN":
        handlers.onDoctorPasswordChangedByAdmin?.(payload.data);
        break;

      default:
        break;
    }
  });

  socket.on("DOCTOR_REGISTERED", (data) => {
    handlers.onDoctorRegistered?.(data);
  });

  socket.on("DOCTOR_UPDATED", (data) => {
    handlers.onDoctorUpdated?.(data);
  });

  socket.on("DOCTOR_DELETED", (data) => {
    handlers.onDoctorDeleted?.(data);
  });

  socket.on("DOCTOR_RECOVERED", (data) => {
    handlers.onDoctorRecovered?.(data);
  });

  socket.on("DOCTOR_PASSWORD_RESET", (data) => {
    handlers.onDoctorPasswordReset?.(data);
  });

  socket.on("DOCTOR_PASSWORD_CHANGED", (data) => {
    handlers.onDoctorPasswordChanged?.(data);
  });

  socket.on("DOCTOR_PASSWORD_CHANGED_BY_ADMIN", (data) => {
    handlers.onDoctorPasswordChangedByAdmin?.(data);
  });
};

export const unregisterDoctorEvents = () => {
  socket.off("system_event");
  socket.off("DOCTOR_REGISTERED");
  socket.off("DOCTOR_UPDATED");
  socket.off("DOCTOR_DELETED");
  socket.off("DOCTOR_RECOVERED");
  socket.off("DOCTOR_PASSWORD_RESET");
  socket.off("DOCTOR_PASSWORD_CHANGED");
  socket.off("DOCTOR_PASSWORD_CHANGED_BY_ADMIN");

  if (onAnyListener) {
    socket.offAny(onAnyListener);
    onAnyListener = null;
  }
};