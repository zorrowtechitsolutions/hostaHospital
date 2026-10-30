import { socket } from "./socket";


export const registerPatientEvents = (handlers = {}) => {
  const handleEvent = (payload) => {
    // Supports both wrapped payload { event, message, data } and direct payload
    const event = payload?.event || payload?.type;
    const data = payload?.data || payload;
    const message = payload?.message || "";

    switch (event) {
      case "PATIENT_REGISTERED":
        handlers.onRegistered?.({ message, data });
        break;

      case "PATIENT_UPDATED":
        handlers.onUpdated?.({ message, data });
        break;

      case "PATIENT_DELETED":
        handlers.onDeleted?.({ message, data });
        break;

      case "PATIENT_RECOVERED":
        handlers.onRecovered?.({ message, data });
        break;

      case "PATIENT_UNREGISTERED":
        handlers.onUnregistered?.({ message, data });
        break;

      default:
        break;
    }
  };

  // Listen to the wrapper event from notification-service
  socket.on("patient_event", handleEvent);

  // Also listen to direct events from user-service
  socket.on("PATIENT_REGISTERED", (data) =>
    handleEvent({ event: "PATIENT_REGISTERED", data })
  );

  socket.on("PATIENT_UPDATED", (data) =>
    handleEvent({ event: "PATIENT_UPDATED", data })
  );

  socket.on("PATIENT_DELETED", (data) =>
    handleEvent({ event: "PATIENT_DELETED", data })
  );

  socket.on("PATIENT_RECOVERED", (data) =>
    handleEvent({ event: "PATIENT_RECOVERED", data })
  );

  socket.on("PATIENT_UNREGISTERED", (data) =>
    handleEvent({ event: "PATIENT_UNREGISTERED", data })
  );
};

export const unregisterPatientEvents = () => {
  // Remove wrapper event listener
  socket.off("patient_event");

  // Remove direct event listeners
  socket.off("PATIENT_REGISTERED");
  socket.off("PATIENT_UPDATED");
  socket.off("PATIENT_DELETED");
  socket.off("PATIENT_RECOVERED");
  socket.off("PATIENT_UNREGISTERED");
};
