import { io } from "socket.io-client";
import { getAuthUser } from "../utils/auth";

export const socket = io("https://zorrowtek.in", {
  transports: ["websocket", "polling"],
  autoConnect: true,
});

export const initSocket = () => {
  if (!socket.connected) {
    socket.connect();
  }

  const handleConnect = () => {
    const authUser = getAuthUser();

    console.log("🟢 SOCKET CONNECTED:", socket.id);
    console.log("👤 AUTH USER:", authUser);

    if (!authUser) {
      console.warn("⚠️ No authenticated user found");
      return;
    }

    // Doctor's own room
    if (authUser.doctorId) {
      const room = `doctor_${authUser.doctorId}`;
      console.log("🏥 Joining doctor room:", room);
      socket.emit("join-room", room);
    }

    // Staff room
    if (authUser.staffId) {
      const room = `staff_${authUser.staffId}`;
      console.log("👨‍💼 Joining staff room:", room);
      socket.emit("join-room", room);
    }

    // Hospital room — where most booking events go
    if (authUser.hospitalId) {
      const room = `hospital_${authUser.hospitalId}`;
      console.log("🏥 Joining hospital room:", room);
      socket.emit("join-room", room);
    }

    // Super-admin broadcast room (literal "role_1" — matches backend)
    if (authUser.role === "superadmin" || authUser.roleId === 1) {
      console.log("👑 Joining role_1");
      socket.emit("join-room", "role_1");
    }

    // Personal user room — for booking_alert / blood_stock_alert
    if (authUser.id) {
      const room = `user_${authUser.id}`;
      console.log("👤 Joining user room:", room);
      socket.emit("join-room", room);
    }
  };

  // Prevent duplicate listeners on hot reload
  socket.off("connect", handleConnect);
  socket.on("connect", handleConnect);

  socket.on("disconnect", (reason) => {
    console.log("🔴 SOCKET DISCONNECTED:", reason);
  });

  socket.on("connect_error", (error) => {
    console.error("❌ SOCKET CONNECTION ERROR:", error.message);
  });

  // If already connected when initSocket() is called, run handler immediately
  if (socket.connected) {
    handleConnect();
  }

  return socket;
};

export const logoutSocket = () => {
  socket.emit("leave-all-rooms");
  socket.disconnect();
};