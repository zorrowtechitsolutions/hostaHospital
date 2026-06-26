import { socket } from "./socket";

// Staff Events Listener - EXACT MATCH with backend
export const registerStaffEvents = (handlers = {}) => {
  // ✅ STAFF REGISTERED EVENT
  socket.on("STAFF_REGISTERED", (data) => {
    console.log("👤 Staff Registered:", data);
    handlers.onStaffRegistered?.(data);
  });

  // ✅ STAFF UPDATED EVENT
  socket.on("STAFF_UPDATED", (data) => {
    console.log("✏️ Staff Updated:", data);
    handlers.onStaffUpdated?.(data);
  });

  // ✅ STAFF DELETED EVENT
  socket.on("STAFF_DELETED", (data) => {
    console.log("🗑️ Staff Deleted:", data);
    handlers.onStaffDeleted?.(data);
  });

  // ✅ STAFF PASSWORD RESET EVENT
  socket.on("STAFF_PASSWORD_RESET", (data) => {
    console.log("🔑 Staff Password Reset:", data);
    handlers.onStaffPasswordReset?.(data);
  });

  // ✅ STAFF PASSWORD CHANGED EVENT
  socket.on("STAFF_PASSWORD_CHANGED", (data) => {
    console.log("🔐 Staff Password Changed:", data);
    handlers.onStaffPasswordChanged?.(data);
  });
};

// Unregister staff events (cleanup)
export const unregisterStaffEvents = () => {
  socket.off("STAFF_REGISTERED");
  socket.off("STAFF_UPDATED");
  socket.off("STAFF_DELETED");
  socket.off("STAFF_PASSWORD_RESET");
  socket.off("STAFF_PASSWORD_CHANGED");
  console.log("🧹 Staff events unregistered");
};