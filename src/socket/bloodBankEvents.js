import { socket } from "./socket";

export const registerBloodBankEvents = (handlers = {}) => {
  socket.on("blood_bank_events", (payload) => {

    const event = payload.event;


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
    }
  });
};

export const unregisterBloodBankEvents = () => {
  socket.off("blood_bank_events");
  socket.offAny();
};