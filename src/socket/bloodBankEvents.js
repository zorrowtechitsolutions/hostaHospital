import { socket } from "./socket";

export const registerBloodBankEvents = (handlers = {}) => {
  console.log("✅ BloodBank listeners registered");
  console.log("📡 Socket connected:", socket.connected);
  console.log("📡 Socket ID:", socket.id);

  socket.onAny((event, ...args) => {
    console.log("📡 ALL SOCKET EVENTS:", event, args);
  });

  socket.on("system_event", (payload) => {
    console.log("🔥 SYSTEM EVENT:", payload);

    const event = payload.message?.match(/\[(.*?)\]/)?.[1];

    switch (event) {
      case "STOCK_CREATED":
        handlers.onStockCreated?.(payload.data);
        break;

      case "STOCK_UPDATED":
        handlers.onStockUpdated?.(payload.data);
        break;

      case "STOCK_DELETED":
        handlers.onStockDeleted?.(payload.data);
        break;

      default:
        console.log("Unknown blood bank event:", event);
    }
  });

  console.log("✅ BloodBank listeners setup complete");
};

export const unregisterBloodBankEvents = () => {
  socket.off("system_event");
  socket.offAny();

  console.log("🧹 BloodBank events unregistered");
};