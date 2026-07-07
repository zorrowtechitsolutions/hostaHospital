// utils/deviceManager.js
import { v4 as uuidv4 } from 'uuid';

// ============================================
// DEVICE ID MANAGER
// ============================================
export function getDeviceId() {
    let deviceId = localStorage.getItem('deviceId');
    
    if (!deviceId) {
        deviceId = uuidv4(); // ✅ Using the latest uuid
        localStorage.setItem('deviceId', deviceId);
        console.log('🆕 New device ID created:', deviceId);
    }
    
    return deviceId;
}

// Optional: Clear device ID (for logout)
export function clearDeviceId() {
    localStorage.removeItem('deviceId');
    console.log('🗑️ Device ID cleared');
}