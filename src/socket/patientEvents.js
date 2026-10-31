// // src/socket/patientEvents.js
// import { socket } from "./socket";

// export const registerPatientEvents = (handlers = {}) => {
//   socket.on("patient_event", (payload) => {
//     const { event, message, data } = payload;

//     switch (event) {
//       case "PATIENT_REGISTERED":
//         handlers.onRegistered?.({ message, data });
//         break;

//       case "PATIENT_UPDATED":
//         handlers.onUpdated?.({ message, data });
//         break;

//       case "PATIENT_DELETED":
//         handlers.onDeleted?.({ message, data });
//         break;

//       case "PATIENT_RECOVERED":
//         handlers.onRecovered?.({ message, data });
//         break;

//       default:
//         break;
//     }
//   });
// };


// src/socket/patientEvents.js 
 
import { socket } from "./socket"; 
 
export const registerPatientEvents = (handlers = {}) => { 
 
  const listener = (payload) => { 
 
    if (!payload) { 
      return; 
    } 
 
    const { 
      event, 
      title, 
      type, 
      message, 
      data, 
    } = payload; 
 
    const eventData = { 
      event, 
      title, 
      type, 
      message, 
      data, 
    }; 
 
    switch (event) { 
 
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
 
  // Register only this listener 
  socket.on("patient_event", listener); 
 
  // Return cleanup function 
  return () => { 
    socket.off("patient_event", listener); 
  }; 
};

export const unregisterPatientEvents = () => {
  socket.off("patient_event");
};