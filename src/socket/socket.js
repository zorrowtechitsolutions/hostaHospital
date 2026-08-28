import { io } from "socket.io-client";
import { getAuthUser } from "../utils/auth";

export const socket = io("https://zorrowtek.in", {
  transports: ["websocket", "polling"],
  autoConnect: true,
});

export const initSocket = () => {
  socket.connect();

  socket.on("connect", () => {
    const authUser = getAuthUser();
    if (!authUser) return;

    // Doctor's own room — DOCTOR_PASSWORD_CHANGED_BY_ADMIN is sent here.
    if (authUser.doctorId) {
      socket.emit("join-room", `doctor_${authUser.doctorId}`);
    }

    if (authUser.staffId) {
      socket.emit("join-room", `staff_${authUser.staffId}`);
    }

    // Hospital's room — most doctor lifecycle events go here.
    if (authUser.hospitalId) {
      socket.emit("join-room", `hospital_${authUser.hospitalId}`);
    }

    // Backend hardcodes the super-admin broadcast room as the literal
    // string "role_1" (see handleDoctorEvent -> safeSocketEmit("role_1", ...)).
    // It is NOT `role_${roleId}` — join the literal room the backend
    // actually broadcasts to, for whichever role should receive it.
    if (authUser.role === "superadmin" || authUser.roleId === 1) {
      socket.emit("join-room", "role_1");
    }

    // Personal room, e.g. for booking_alert / blood_stock_alert (unrelated
    // to doctor events, kept from your original setup).
    if (authUser.id) {
      socket.emit("join-room", `user_${authUser.id}`);
    }
  });

  socket.on("disconnect", () => {});

  return socket;
};

export const logoutSocket = () => {
  socket.emit("leave-all-rooms");
  socket.disconnect();
};