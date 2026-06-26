import { socket } from "./socket";

// Role Events Listener - EXACT MATCH with backend
export const registerRoleEvents = (handlers = {}) => {
  console.log("✅ Role listeners registered");
  console.log("📡 Socket connected:", socket.connected);
  console.log("📡 Socket ID:", socket.id);

  // Log ALL socket events for debugging
  socket.onAny((event, ...args) => {
    console.log("📡 ALL SOCKET EVENTS - ROLE:", event, args);
  });

  // ✅ ROLE REGISTERED EVENT
  socket.on("ROLE_REGISTERED", (data) => {
    console.log("👤 Role Registered:", data);
    handlers.onRoleRegistered?.(data);
  });

  // ✅ ROLE UPDATED EVENT
  socket.on("ROLE_UPDATED", (data) => {
    console.log("✏️ Role Updated:", data);
    handlers.onRoleUpdated?.(data);
  });

  // ✅ ROLE DELETED EVENT
  socket.on("ROLE_DELETED", (data) => {
    console.log("🗑️ Role Deleted:", data);
    handlers.onRoleDeleted?.(data);
  });

  console.log("✅ Role listeners setup complete");
};

// Unregister role events (cleanup)
export const unregisterRoleEvents = () => {
  socket.off("ROLE_REGISTERED");
  socket.off("ROLE_UPDATED");
  socket.off("ROLE_DELETED");
  
  // Also remove the onAny listener
  socket.offAny();
  
  console.log("🧹 Role events unregistered");
};