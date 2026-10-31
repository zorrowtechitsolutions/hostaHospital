import { io } from "socket.io-client";
import { getAuthUser } from "../utils/auth";
import { showToast } from "../components/ui/Toast";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

if (!SOCKET_URL) {
  console.error("[SOCKET] VITE_SOCKET_URL is not configured");
}

// Create ONE shared Socket.IO connection
export const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ["websocket", "polling"],
  timeout: 10000,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
});

// --------------------------------------
// JOIN USER ROOMS
// --------------------------------------

const joinUserRooms = () => {
  const authUser = getAuthUser();

  if (!authUser) {
    console.warn("[SOCKET] No authenticated user found");
    return;
  }

  const rooms = new Set();

  if (authUser.doctorId) {
    rooms.add(`doctor_${authUser.doctorId}`);
  }

  if (authUser.staffId) {
    rooms.add(`staff_${authUser.staffId}`);
  }

  if (authUser.hospitalId) {
    rooms.add(`hospital_${authUser.hospitalId}`);
  }

  if (
    authUser.role === "superadmin" ||
    Number(authUser.roleId) === 1
  ) {
    rooms.add("role_1");
  }

  if (authUser.id) {
    rooms.add(`user_${authUser.id}`);
  }

  if (rooms.size === 0) {
    console.warn("[SOCKET] No rooms found for user");
    return;
  }

  rooms.forEach((room) => {
    console.log("[SOCKET] Joining room:", room);
    socket.emit("join-room", room);
  });
};

// --------------------------------------
// NORMALIZE EVENT MESSAGE
// --------------------------------------

const getNotificationMessage = (data, fallback) => {
  if (typeof data === "string") {
    return data;
  }

  if (!data || typeof data !== "object") {
    return fallback;
  }

  return (
    data.message ||
    data.notification ||
    data.title ||
    data.description ||
    fallback
  );
};

// --------------------------------------
// SOCKET EVENT LISTENERS
// --------------------------------------

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

// --------------------------------------
// PATIENT EVENT
// --------------------------------------

socket.on("patient_event", (data) => {
  console.log("[SOCKET RECEIVED] patient_event:", data);

  const message = getNotificationMessage(
    data,
    "New patient notification received."
  );

  showToast(message, "info");
});

// --------------------------------------
// HOSPITAL EVENT
// --------------------------------------

socket.on("hospital_event", (data) => {
  console.log("[SOCKET RECEIVED] hospital_event:", data);

  const message = getNotificationMessage(
    data,
    "New hospital notification received."
  );

  showToast(message, "info");
});

// --------------------------------------
// EMERGENCY ALERT
// --------------------------------------

socket.on("emergency_alert", (data) => {
  console.log("[SOCKET RECEIVED] emergency_alert:", data);

  const message = getNotificationMessage(
    data,
    "Emergency alert received!"
  );

  showToast(message, "error");
});

// --------------------------------------
// TEST EVENT
// --------------------------------------

socket.on("socket_test", (data) => {
  console.log("[SOCKET RECEIVED] socket_test:", data);

  showToast(
    getNotificationMessage(data, "Socket connection test successful."),
    "success"
  );
});

// --------------------------------------
// INITIALIZE SOCKET
// --------------------------------------

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

// --------------------------------------
// LOGOUT
// --------------------------------------

export const logoutSocket = () => {
  console.log("[SOCKET] Logging out");

  if (socket.connected) {
    socket.disconnect();
  }
};

// --------------------------------------
// RECONNECT
// --------------------------------------

export const reconnectSocket = () => {
  console.log("[SOCKET] Reconnecting...");

  const authUser = getAuthUser();

  if (!authUser) {
    console.warn("[SOCKET] No authenticated user. Cannot reconnect.");
    return;
  }

  if (socket.connected) {
    socket.disconnect();
  }

  socket.connect();
};