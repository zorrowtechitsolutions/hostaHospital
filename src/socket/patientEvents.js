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
    console.log("Received patient event:", payload); 
 
    if (!payload) { 
      console.warn("Empty patient event payload"); 
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
        console.log("New patient registered"); 
        handlers.onRegistered?.(eventData); 
        break; 
 
      case "PATIENT_UPDATED": 
        console.log("Patient updated"); 
        handlers.onUpdated?.(eventData); 
        break; 
 
      case "PATIENT_DELETED": 
        console.log("Patient deleted"); 
        handlers.onDeleted?.(eventData); 
        break; 
 
      case "PATIENT_RECOVERED": 
        console.log("Patient recovered"); 
        handlers.onRecovered?.(eventData); 
        break; 
 
      default: 
        console.warn("Unknown patient event:", event); 
        handlers.onUnknown?.(eventData); 
        break; 
    } 
  }; 
 
  // Register only this listener 
  socket.on("patient_event", listener); 
 
  // Return cleanup function 
  return () => { 
    socket.off("patient_event", listener); 
    console.log("Patient event listener removed"); 
  }; 
};

export const unregisterPatientEvents = () => {
  socket.off("patient_event");
};