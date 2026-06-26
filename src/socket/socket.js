import { io } from "socket.io-client";

export const socket = io("https://zorrowtek.in", {
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

export const initSocket = () => {
  socket.connect();

  socket.on("connect", () => {
    console.log("✅ Socket connected:", socket.id);
  });

  socket.on("disconnect", (reason) => {
    console.log("❌ Socket disconnected:", reason);
  });

  socket.on("connect_error", (error) => {
    console.error("❌ Socket connection error:", error);
  });

  // Optional: Log all events for debugging (remove in production)
  socket.onAny((event, ...args) => {
    console.log(`📡 Event: ${event}`, args);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
    console.log("🔌 Socket disconnected manually");
  }
};