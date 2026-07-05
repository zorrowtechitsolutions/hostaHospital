// src/socket/socket.js
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

    if (authUser?.id) {
      const room = `hospital_${authUser.id}`;
      socket.emit("join-room", room);
    }
  });

  socket.on("disconnect", () => {});

  return socket;
};