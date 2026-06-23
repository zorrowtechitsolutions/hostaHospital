import { io } from "socket.io-client";

export const socket = io("https://zorrowtek.in", {
  transports: ["websocket", "polling"],
  reconnection: true,
});

export const initSocket = (handlers?: any) => {
  socket.connect();

  socket.on("connect", () => {
    console.log("✅ Connected:", socket.id);
  });

  // 👇 GLOBAL EVENT CATCHER (your current system)
  socket.onAny((event, ...args) => {
    console.log(`📡 Event: ${event}`, args);

    // optional: send to global handler
    handlers?.onEvent?.(event, args);
  });

  socket.on("disconnect", (reason) => {
    console.log("❌ Disconnected:", reason);
  });
};