// import { io } from "socket.io-client";
// import { getAuthUser } from "../utils/auth";

// const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

// if (!SOCKET_URL) {
//   console.error("[SOCKET] VITE_SOCKET_URL is not configured");
// }

// export const socket = io(SOCKET_URL, {
//   autoConnect: false,
//   transports: ["websocket", "polling"],
//   timeout: 10000,
//   reconnection: true,
//   reconnectionAttempts: Infinity,
//   reconnectionDelay: 1000,
//   reconnectionDelayMax: 5000,
// });

// const joinUserRooms = () => {
//   const authUser = getAuthUser();

//   if (!authUser) {
//     console.warn("[SOCKET] No authenticated user found");
//     return;
//   }

// const rooms = new Set();

//   if (authUser.doctorId) {
//     rooms.add(`doctor_${authUser.doctorId}`);
//   }

//   if (authUser.staffId) {
//     rooms.add(`staff_${authUser.staffId}`);
//   }

//   if (authUser.hospitalId) {
//     rooms.add(`hospital_${authUser.hospitalId}`);
//   }

//   if (
//     authUser.role === "superadmin" ||
//     Number(authUser.roleId) === 1
//   ) {
//     rooms.add("role_1");
//   }

//   if (authUser.id) {
//     rooms.add(`user_${authUser.id}`);
//   }

//   if (rooms.size === 0) {
//     console.warn("[SOCKET] No rooms found for user");
//     return;
//   }

//   for (const room of rooms) {
//     console.log("[SOCKET] Joining room:", room);
//     socket.emit("join-room", room);
//   }
// };

// socket.on("connect", () => {
//   console.log("[SOCKET] Connected:", socket.id);

//   joinUserRooms();
// });

// socket.on("room-joined", (data) => {
//   console.log("[SOCKET] Room joined:", data);
// });

// socket.on("disconnect", (reason) => {
//   console.warn("[SOCKET] Disconnected:", reason);
// });

// socket.on("connect_error", (error) => {
//   console.error(
//     "[SOCKET] Connection error:",
//     error.message
//   );
// });

// socket.on("reconnect_attempt", (attempt) => {
//   console.log(
//     "[SOCKET] Reconnection attempt:",
//     attempt
//   );
// });

// export const initSocket = () => {
//   const authUser = getAuthUser();

//   if (!authUser) {
//     console.warn(
//       "[SOCKET] No authenticated user. Not connecting."
//     );

//     return socket;
//   }

//   if (!socket.connected) {
//     console.log("[SOCKET] Connecting...");
//     socket.connect();
//   } else {
//     console.log("[SOCKET] Already connected");
//     joinUserRooms();
//   }

//   return socket;
// };

// export const logoutSocket = () => {
//   console.log("[SOCKET] Logging out");

//   if (socket.connected) {
//     socket.disconnect();
//   }
// };

// export const reconnectSocket = () => {
//   console.log("[SOCKET] Reconnecting...");

//   if (socket.connected) {
//     socket.disconnect();
//   }

//   const authUser = getAuthUser();

//   if (authUser) {
//     socket.connect();
//   }
// };



import { io } from "socket.io-client";
import { getAuthUser } from "../utils/auth";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

if (!SOCKET_URL) {
  console.error("[SOCKET] VITE_SOCKET_URL is not configured");
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
    console.warn("[SOCKET] No authenticated user found");
    return;
  }

  const rooms = new Set();

  // Hospital room
  if (authUser.hospitalId) {
    rooms.add(`hospital_${authUser.hospitalId}`);
  }

  // Patient/user room
  const userId = authUser.id ?? authUser.userId;

  if (userId) {
    rooms.add(`user_${userId}`);
  }

  // Doctor room
  if (authUser.doctorId) {
    rooms.add(`doctor_${authUser.doctorId}`);
  }

  // Staff room
  if (authUser.staffId) {
    rooms.add(`staff_${authUser.staffId}`);
  }

  // Superadmin room
  if (
    authUser.role === "superadmin" ||
    Number(authUser.roleId) === 1
  ) {
    rooms.add("role_1");
  }

  if (rooms.size === 0) {
    console.warn("[SOCKET] No rooms found for authenticated user");
    return;
  }

  rooms.forEach((room) => {
    console.log("[SOCKET] Joining room:", room);
    socket.emit("join-room", room);
  });
};

socket.on("connect", () => {
  console.log("[SOCKET] Connected:", socket.id);
  joinUserRooms();
});

socket.on("room-joined", (data) => {
  console.log("[SOCKET] Room joined:", data);
});

socket.on("disconnect", (reason) => {
  console.warn("[SOCKET] Disconnected:", reason);
});

socket.on("connect_error", (error) => {
  console.error("[SOCKET] Connection error:", error.message);
});

socket.io.on("reconnect_attempt", (attempt) => {
  console.log("[SOCKET] Reconnection attempt:", attempt);
});

export const initSocket = () => {
  const authUser = getAuthUser();

  if (!authUser) {
    console.warn("[SOCKET] No authenticated user. Not connecting.");
    return socket;
  }

  if (!socket.connected) {
    console.log("[SOCKET] Connecting...");
    socket.connect();
  } else {
    console.log("[SOCKET] Already connected");
    joinUserRooms();
  }

  return socket;
};

export const logoutSocket = () => {
  console.log("[SOCKET] Logging out");
  socket.disconnect();
};

export const reconnectSocket = () => {
  console.log("[SOCKET] Reconnecting...");

  socket.disconnect();

  if (getAuthUser()) {
    socket.connect();
  }
};