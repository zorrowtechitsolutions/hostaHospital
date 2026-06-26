import { socket } from "./socket";

// Blood Bank Events Listener - EXACT MATCH with backend
export const registerBloodBankEvents = (handlers = {}) => {
  console.log("✅ BloodBank listeners registered");
  console.log("📡 Socket connected:", socket.connected);
  console.log("📡 Socket ID:", socket.id);

  // Log ALL socket events for debugging
  socket.onAny((event, ...args) => {
    console.log("📡 ALL SOCKET EVENTS:", event, args);
  });

  // ✅ STOCK CREATED EVENT (matches backend: publishEvent("blood_bank_events", "STOCK_CREATED", {...}))
  socket.on("STOCK_CREATED", (data) => {
    console.log("🩸 Blood Stock Created:", data);
    handlers.onStockCreated?.(data);
  });

  // ✅ STOCK UPDATED EVENT (matches backend: publishEvent("blood_bank_events", "STOCK_UPDATED", {...}))
  socket.on("STOCK_UPDATED", (data) => {
    console.log("✏️ Blood Stock Updated:", data);
    handlers.onStockUpdated?.(data);
  });

  // ✅ STOCK DELETED EVENT (matches backend: publishEvent("blood_bank_events", "STOCK_DELETED", {...}))
  socket.on("STOCK_DELETED", (data) => {
    console.log("🗑️ Blood Stock Deleted:", data);
    handlers.onStockDeleted?.(data);
  });

  console.log("✅ BloodBank listeners setup complete");
};

// Unregister blood bank events (cleanup)
export const unregisterBloodBankEvents = () => {
  socket.off("STOCK_CREATED");
  socket.off("STOCK_UPDATED");
  socket.off("STOCK_DELETED");
  
  // Also remove the onAny listener
  socket.offAny();
  
  console.log("🧹 Blood Bank events unregistered");
};