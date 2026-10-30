import { io } from "socket.io-client";
import { getAuthUser } from "../utils/auth";

const SOCKET_URL = "https://zorrowtek.in";

console.log(SOCKET_URL, "RTYUI");


export const socket = io(SOCKET_URL, {
  transports: ["websocket", "polling"],
  timeout: 10000, // 10 seconds
  // autoConnect: true,
});

export const initSocket = () => {
  if (!socket.connected) {
    socket.connect();
    console.log("Socket connecting...");
  }

  const handleConnect = () => {
    const authUser = getAuthUser();

    console.log("Socket connected, joining rooms for user:", authUser);


    if (!authUser) {
      console.warn(":warning: No authenticated user found");
      return;
    }

    // Doctor's own room
    if (authUser.doctorId) {
      const room = `doctor_${authUser.doctorId}`;
      socket.emit("join-room", room);
    }

    // Staff room
    if (authUser.staffId) {
      const room = `staff_${authUser.staffId}`;
      socket.emit("join-room", room);
    }

    // Hospital room — where most booking events go
    if (authUser.hospitalId) {
      const room = `hospital_${authUser.hospitalId}`;
      socket.emit("join-room", room);
    }

    // Super-admin broadcast room (literal "role_1" — matches backend)
    if (authUser.role === "superadmin" || authUser.roleId === 1) {
      socket.emit("join-room", "role_1");
    }

    // Personal user room — for booking_alert / blood_stock_alert
    if (authUser.id) {
      const room = `user_${authUser.id}`;
      socket.emit("join-room", room);
    }
  };

  // Prevent duplicate listeners on hot reload
  socket.off("connect", handleConnect);
  socket.on("connect", handleConnect);

  socket.on("disconnect", (reason) => {
    console.log("Socket disconnected:", reason);
  });

  socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error);
  });

  // If already connected when initSocket() is called, run handler immediately
  if (socket.connected) {
    console.log("Socket already connected, joining rooms...");
    handleConnect();
  }

  return socket;
};

export const logoutSocket = () => {
  socket.emit("leave-all-rooms");
  socket.disconnect();
};











