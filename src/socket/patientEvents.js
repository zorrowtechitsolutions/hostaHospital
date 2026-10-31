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

// Hospital dashboard receives hospital_event
export const registerHospitalPatientEvents = (handlers = {}) => {
  const listener = (payload) => {
    if (!payload) return;

    console.log("[SOCKET] Hospital patient event received:", payload);

    const eventData = {
      event: payload.event,
      title: payload.title,
      type: payload.type,
      message: payload.message,
      data: payload.data,
    };

    switch (payload.event) {
      case "PATIENT_REGISTERED":
        handlers.onRegistered?.(eventData);
        break;

      case "PATIENT_UPDATED":
        handlers.onUpdated?.(eventData);
        break;

      case "PATIENT_DELETED":
        handlers.onDeleted?.(eventData);
        break;

      case "PATIENT_RECOVERED":
        handlers.onRecovered?.(eventData);
        break;

      default:
        handlers.onUnknown?.(eventData);
        break;
    }
  };

  socket.on("hospital_event", listener);

  return () => {
    socket.off("hospital_event", listener);
  };
};


// Patient portal receives patient_event
export const registerPatientEvents = (handlers = {}) => {
  const listener = (payload) => {
    if (!payload) return;

    console.log("[SOCKET] Patient event received:", payload);

    const eventData = {
      event: payload.event,
      title: payload.title,
      type: payload.type,
      message: payload.message,
      data: payload.data,
    };

    switch (payload.event) {
      case "PATIENT_REGISTERED":
        handlers.onRegistered?.(eventData);
        break;

      case "PATIENT_UPDATED":
        handlers.onUpdated?.(eventData);
        break;

      case "PATIENT_DELETED":
        handlers.onDeleted?.(eventData);
        break;

      case "PATIENT_RECOVERED":
        handlers.onRecovered?.(eventData);
        break;

      default:
        handlers.onUnknown?.(eventData);
        break;
    }
  };

  socket.on("patient_event", listener);

  return () => {
    socket.off("patient_event", listener);
  };
};


// Removes ALL "patient_event" listeners
export const unregisterPatientEvents = () => {
  socket.off("patient_event");
};