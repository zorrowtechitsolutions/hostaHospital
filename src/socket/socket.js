import { io } from "socket.io-client";
import { getAuthUser } from "../utils/auth";

export const socket = io("https://zorrowtek.in", {
  transports: ["websocket", "polling"],
  autoConnect: true,
});

export const initSocket = () => {
  socket.connect();

  socket.on("connect", () => {
    console.log("✅ Connected:", socket.id);

    const authUser = getAuthUser();

    if (authUser?.id) {
      const room = `hospital_${authUser.id}`;

      console.log("Joining:", room);

      socket.emit("join-room", room);
    }
  });

  socket.on("disconnect", (reason) => {
    console.log("Disconnected:", reason);
  });

  socket.onAny((event, ...args) => {
    console.log("📡", event, args);
  });

  return socket;
};