// import { io } from "socket.io-client";
// import { getAuthUser } from "../utils/auth";

// const SOCKET_URL =import.meta.env.VITE_SOCKET_URL;;



// export const socket = io(SOCKET_URL, {
//   transports: ["websocket", "polling"],
//   timeout: 10000, // 10 seconds
//   // autoConnect: true,
// });

// export const initSocket = () => {
//   if (!socket.connected) {
//     socket.connect();
//     console.log("Socket connecting...");
//   }

//   const handleConnect = () => {
//     const authUser = getAuthUser();

//     console.log("Socket connected, joining rooms for user:", authUser);


//     if (!authUser) {
//       console.warn(":warning: No authenticated user found");
//       return;
//     }

//     // Doctor's own room
//     if (authUser.doctorId) {
//       const room = `doctor_${authUser.doctorId}`;
//       socket.emit("join-room", room);
//     }

//     // Staff room
//     if (authUser.staffId) {
//       const room = `staff_${authUser.staffId}`;
//       socket.emit("join-room", room);
//     }

//     // Hospital room — where most booking events go
//     if (authUser.hospitalId) {
//       const room = `hospital_${authUser.hospitalId}`;
//       socket.emit("join-room", room);
//     }

//     // Super-admin broadcast room (literal "role_1" — matches backend)
//     if (authUser.role === "superadmin" || authUser.roleId === 1) {
//       socket.emit("join-room", "role_1");
//     }

//     // Personal user room — for booking_alert / blood_stock_alert
//     if (authUser.id) {
//       const room = `user_${authUser.id}`;
//       socket.emit("join-room", room);
//     }
//   };

//   // Prevent duplicate listeners on hot reload
//   socket.off("connect", handleConnect);
//   socket.on("connect", handleConnect);

//   socket.on("disconnect", (reason) => {
//     console.log("Socket disconnected:", reason);
//   });

//   socket.on("connect_error", (error) => {
//     console.error("Socket connection error:", error);
//   });

//   // If already connected when initSocket() is called, run handler immediately
//   if (socket.connected) {
//     console.log("Socket already connected, joining rooms...");
//     handleConnect();
//   }

//   return socket;
// };

// export const logoutSocket = () => {
//   socket.emit("leave-all-rooms");
//   socket.disconnect();
// };







// src/socket/socket.js

import { io } from "socket.io-client";
import { getAuthUser } from "../utils/auth";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

if (!SOCKET_URL) {
  console.error("VITE_SOCKET_URL is not configured");
}

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ["websocket", "polling"],
  timeout: 10000,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
});

const joinUserRooms = () => {
  const authUser = getAuthUser();

  if (!authUser) {
    console.warn("No authenticated user found. Cannot join rooms.");
    return;
  }

 

  const rooms = [];

  // Doctor room
  if (authUser.doctorId) {
    rooms.push(`doctor_${authUser.doctorId}`);
  }

  // Staff room
  if (authUser.staffId) {
    rooms.push(`staff_${authUser.staffId}`);
  }

  // Hospital room
  if (authUser.hospitalId) {
    rooms.push(`hospital_${authUser.hospitalId}`);
  }

  // Super-admin room
  if (
    authUser.role === "superadmin" ||
    Number(authUser.roleId) === 1
  ) {
    rooms.push("role_1");
  }

  // Personal user room
  if (authUser.id) {
    rooms.push(`user_${authUser.id}`);
  }

  // Join all applicable rooms
  [...new Set(rooms)].forEach((room) => {
    socket.emit("join-room", room);
  });

  if (rooms.length === 0) {
    console.warn("No valid Socket.IO rooms found for this user.");
  }
};

// Register connection listeners only once
socket.on("connect", joinUserRooms);

socket.on("disconnect", (reason) => {
  console.warn("Socket disconnected:", reason);
});

socket.on("connect_error", (error) => {
  console.error("Socket connection error:", error.message);
});

socket.on("reconnect_attempt", (attempt) => {
});

socket.on("reconnect", () => {
});

// Initialize socket connection
export const initSocket = () => {
  if (!socket.connected) {
    socket.connect();
  } else {
    joinUserRooms();
  }

  return socket;
};

// Logout
export const logoutSocket = () => {
  // Disconnecting automatically removes this connection
  // from its joined server-side rooms.
  socket.disconnect();
};

// Optional: manually reconnect after login
export const reconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }

  socket.connect();
};



