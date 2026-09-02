// src/socket/doctorEvents.js
import { socket } from "./socket";

export const registerDoctorEvents = (handlers = {}) => {
  const dispatch = ({ event, data }) => {

    switch (event) {
      case "DOCTOR_REGISTERED":
        handlers.onDoctorRegistered?.(data);
        break;

      case "DOCTOR_UPDATED":
        handlers.onDoctorUpdated?.(data);
        break;

      case "DOCTOR_DELETED":
        handlers.onDoctorDeleted?.(data);
        break;

      case "DOCTOR_RECOVERED":
        handlers.onDoctorRecovered?.(data);
        break;

      case "DOCTOR_PASSWORD_RESET":
        handlers.onDoctorPasswordReset?.(data);
        break;

      case "DOCTOR_PASSWORD_CHANGED":
        handlers.onDoctorPasswordChanged?.(data);
        break;

      case "DOCTOR_PASSWORD_CHANGED_BY_ADMIN":
        handlers.onDoctorPasswordChangedByAdmin?.(data);
        break;

      default:
        console.warn("⚠️ Unknown doctor event:", event);
    }
  };

  socket.on("hospital_event", dispatch);
  socket.on("doctor_events", dispatch);

  return () => {
    socket.off("hospital_event", dispatch);
    socket.off("doctor_events", dispatch);
  };
};

export const unregisterDoctorEvents = () => {
  socket.off("hospital_event");
  socket.off("doctor_events");
};