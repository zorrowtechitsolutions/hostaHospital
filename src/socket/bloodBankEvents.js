import { socket } from "./socket";

export const registerBloodBankEvents = (handlers = {}) => {
  socket.on("system_event", (payload) => {
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
        // Unknown event - silently ignore
        break;
    }
  });
};

export const unregisterBloodBankEvents = () => {
  socket.off("system_event");
  socket.offAny();
};