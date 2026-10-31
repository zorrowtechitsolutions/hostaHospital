// // // src/socket/patientEvents.js
// // import { socket } from "./socket";

// // export const registerPatientEvents = (handlers = {}) => {
// //   socket.on("patient_event", (payload) => {
// //     const { event, message, data } = payload;

// //     switch (event) {
// //       case "PATIENT_REGISTERED":
// //         handlers.onRegistered?.({ message, data });
// //         break;

// //       case "PATIENT_UPDATED":
// //         handlers.onUpdated?.({ message, data });
// //         break;

// //       case "PATIENT_DELETED":
// //         handlers.onDeleted?.({ message, data });
// //         break;

// //       case "PATIENT_RECOVERED":
// //         handlers.onRecovered?.({ message, data });
// //         break;

// //       default:
// //         break;
// //     }
// //   });
// // };


// // src/socket/patientEvents.js 
 
// import { socket } from "./socket"; 
 
// export const registerPatientEvents = (handlers = {}) => { 
 
//   const listener = (payload) => { 
 
//     if (!payload) { 
//       return; 
//     } 
 
//     const { 
//       event, 
//       title, 
//       type, 
//       message, 
//       data, 
//     } = payload; 
 
//     const eventData = { 
//       event, 
//       title, 
//       type, 
//       message, 
//       data, 
//     }; 
 
//     switch (event) { 
 
//       case "PATIENT_REGISTERED": 
//         handlers.onRegistered?.(eventData); 
//         break; 
 
//       case "PATIENT_UPDATED": 
//         handlers.onUpdated?.(eventData); 
//         break; 
 
//       case "PATIENT_DELETED": 
//         handlers.onDeleted?.(eventData); 
//         break; 
 
//       case "PATIENT_RECOVERED": 
      
//         handlers.onRecovered?.(eventData); 
//         break; 
 
//       default: 
//         handlers.onUnknown?.(eventData); 
//         break; 
//     } 
//   }; 
 
//   // Register only this listener 
//   socket.on("patient_event", listener); 
 
//   // Return cleanup function 
//   return () => { 
//     socket.off("patient_event", listener); 
//   }; 
// };

// export const unregisterPatientEvents = () => {
//   socket.off("patient_event");
// };


import { socket } from "./socket";

export const registerPatientEvents = (handlers = {}) => {
  console.log("[PATIENT EVENTS] Registering patient_event listener");

  const listener = (payload) => {
    console.log("[PATIENT EVENTS] patient_event RECEIVED:", payload);

    if (!payload) {
      console.warn("[PATIENT EVENTS] Empty payload");
      return;
    }

    const eventData = {
      event: payload.event,
      title: payload.title,
      type: payload.type,
      message: payload.message,
      data: payload.data,
    };

    switch (payload.event) {
      case "PATIENT_REGISTERED":
        console.log("[PATIENT EVENTS] PATIENT_REGISTERED");
        handlers.onRegistered?.(eventData);
        break;

      case "PATIENT_UPDATED":
        console.log("[PATIENT EVENTS] PATIENT_UPDATED");
        handlers.onUpdated?.(eventData);
        break;

      case "PATIENT_DELETED":
        console.log("[PATIENT EVENTS] PATIENT_DELETED");
        handlers.onDeleted?.(eventData);
        break;

      case "PATIENT_RECOVERED":
        console.log("[PATIENT EVENTS] PATIENT_RECOVERED");
        handlers.onRecovered?.(eventData);
        break;

      default:
        console.warn(
          "[PATIENT EVENTS] Unknown event:",
          payload.event
        );
        handlers.onUnknown?.(eventData);
    }
  };

  socket.on("patient_event", listener);

  console.log(
    "[PATIENT EVENTS] Listener registered:",
    socket.listeners("patient_event").length
  );

  return () => {
    console.log("[PATIENT EVENTS] Cleaning up listener");

    socket.off("patient_event", listener);
  };
};