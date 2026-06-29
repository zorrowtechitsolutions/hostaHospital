// src/socket/categoryEvents.js
import { socket } from "./socket";

let onAnyListener = null;

// Category Events Listener - Using system_event pattern
export const registerCategoryEvents = (handlers = {}) => {
  console.log("✅ Category listeners registered");
  console.log("📡 Socket connected:", socket.connected);
  console.log("📡 Socket ID:", socket.id);

  // Log ALL socket events for debugging
  if (!onAnyListener) {
    onAnyListener = (event, ...args) => {
      console.log("📡 ALL SOCKET EVENTS - CATEGORY:", event, args);
    };
    socket.onAny(onAnyListener);
  }

  // ✅ UNIFIED SYSTEM EVENT LISTENER (Primary)
  socket.on("system_event", (payload) => {
    console.log("🔥 SYSTEM EVENT (CATEGORY):", payload);

    // Extract event type from message (format: [EVENT_TYPE] message)
    const event = payload.message?.match(/\[(.*?)\]/)?.[1];

    switch (event) {
      case "CATEGORY_REGISTERED":
        console.log("📁 Category Registered:", payload.data);
        handlers.onCategoryRegistered?.(payload.data);
        break;

      case "CATEGORY_UPDATED":
        console.log("✏️ Category Updated:", payload.data);
        handlers.onCategoryUpdated?.(payload.data);
        break;

      case "CATEGORY_DELETED":
        console.log("🗑️ Category Deleted:", payload.data);
        handlers.onCategoryDeleted?.(payload.data);
        break;

      default:
        console.log("Unknown category event:", event);
    }
  });

  // ✅ INDIVIDUAL EVENT LISTENERS (Fallback for direct events)
  socket.on("CATEGORY_REGISTERED", (data) => {
    console.log("📁 Category Registered (direct):", data);
    handlers.onCategoryRegistered?.(data);
  });

  socket.on("CATEGORY_UPDATED", (data) => {
    console.log("✏️ Category Updated (direct):", data);
    handlers.onCategoryUpdated?.(data);
  });

  socket.on("CATEGORY_DELETED", (data) => {
    console.log("🗑️ Category Deleted (direct):", data);
    handlers.onCategoryDeleted?.(data);
  });

  console.log("✅ Category listeners setup complete");
};

// Unregister category events (cleanup)
export const unregisterCategoryEvents = () => {
  // Remove system_event listener
  socket.off("system_event");
  
  // Remove individual event listeners
  socket.off("CATEGORY_REGISTERED");
  socket.off("CATEGORY_UPDATED");
  socket.off("CATEGORY_DELETED");
  
  // Remove onAny listener
  if (onAnyListener) {
    socket.offAny(onAnyListener);
    onAnyListener = null;
  }

  console.log("🧹 Category events unregistered");
};