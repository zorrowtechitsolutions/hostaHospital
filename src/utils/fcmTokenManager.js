// utils/fcmTokenManager.js
import { getDeviceId } from './deviceManager.js';

export class FCMTokenManager {
    constructor() {
        this.dbName = 'FCM_DB';
        this.storeName = 'tokens';
        this.dbVersion = 1;
        this.db = null;
    }

    // Initialize IndexedDB
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    // Create indexes for fast queries
                    store.createIndex('deviceId', 'deviceId', { unique: false });
                    store.createIndex('fcmToken', 'fcmToken', { unique: true });
                    store.createIndex('createdAt', 'createdAt', { unique: false });
                }
                console.log('📦 IndexedDB initialized');
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                console.log('✅ IndexedDB connected');
                resolve();
            };
            request.onerror = () => {
                console.error('❌ IndexedDB error:', request.error);
                reject(request.error);
            };
        });
    }

    // Add new FCM token
    async addFCMToken(fcmToken) {
        await this.ensureDB();
        const deviceId = getDeviceId();
        
        // Check if token already exists
        const exists = await this.hasToken(fcmToken);
        if (exists) {
            console.log('⚠️ Token already exists:', fcmToken);
            return false;
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(this.storeName, 'readwrite');
            const store = transaction.objectStore(this.storeName);
            
            const tokenData = {
                deviceId: deviceId,
                fcmToken: fcmToken,
                platform: 'web',
                createdAt: new Date().toISOString(),
                userAgent: navigator.userAgent
            };
            
            const request = store.add(tokenData);
            request.onsuccess = () => {
                console.log('✅ FCM token saved:', fcmToken);
                resolve(true);
            };
            request.onerror = () => {
                console.error('❌ Failed to save token:', request.error);
                reject(request.error);
            };
        });
    }

    // Get all tokens for current device
    async getDeviceTokens() {
        await this.ensureDB();
        const deviceId = getDeviceId();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(this.storeName, 'readonly');
            const store = transaction.objectStore(this.storeName);
            const index = store.index('deviceId');
            const request = index.getAll(deviceId);
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            request.onerror = () => {
                console.error('❌ Failed to get tokens:', request.error);
                reject(request.error);
            };
        });
    }

    // Get all FCM tokens as array (for API calls)
    async getAllFCMTokens() {
        const tokens = await this.getDeviceTokens();
        return tokens.map(item => item.fcmToken);
    }

    // Check if token exists
    async hasToken(fcmToken) {
        await this.ensureDB();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(this.storeName, 'readonly');
            const store = transaction.objectStore(this.storeName);
            const index = store.index('fcmToken');
            const request = index.get(fcmToken);
            
            request.onsuccess = () => {
                resolve(!!request.result);
            };
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    // Get token count
    async getTokenCount() {
        const tokens = await this.getDeviceTokens();
        return tokens.length;
    }

    // Remove specific token
    async removeFCMToken(fcmToken) {
        await this.ensureDB();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(this.storeName, 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const index = store.index('fcmToken');
            const request = index.get(fcmToken);
            
            request.onsuccess = () => {
                const result = request.result;
                if (result) {
                    const deleteRequest = store.delete(result.id);
                    deleteRequest.onsuccess = () => {
                        console.log('🗑️ Token removed:', fcmToken);
                        resolve(true);
                    };
                    deleteRequest.onerror = () => reject(deleteRequest.error);
                } else {
                    resolve(false);
                }
            };
            request.onerror = () => reject(request.error);
        });
    }

    // Clear all tokens for this device
    async clearAllDeviceTokens() {
        await this.ensureDB();
        const deviceId = getDeviceId();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(this.storeName, 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const index = store.index('deviceId');
            const request = index.getAll(deviceId);
            
            request.onsuccess = () => {
                const tokens = request.result;
                let deleted = 0;
                
                if (tokens.length === 0) {
                    resolve(0);
                    return;
                }
                
                tokens.forEach(token => {
                    const deleteReq = store.delete(token.id);
                    deleteReq.onsuccess = () => {
                        deleted++;
                        if (deleted === tokens.length) {
                            console.log(`🗑️ Cleared ${deleted} tokens for device`);
                            resolve(deleted);
                        }
                    };
                });
            };
            request.onerror = () => reject(request.error);
        });
    }

    // Get all tokens (across all devices) - for admin/debug
    async getAllTokensAcrossDevices() {
        await this.ensureDB();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(this.storeName, 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            request.onerror = () => reject(request.error);
        });
    }

    // Delete database (for testing)
    async deleteDatabase() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close();
            }
            const request = indexedDB.deleteDatabase(this.dbName);
            request.onsuccess = () => {
                this.db = null;
                console.log('🗑️ Database deleted');
                resolve();
            };
            request.onerror = () => reject(request.error);
        });
    }

    async ensureDB() {
        if (!this.db) {
            await this.init();
        }
    }
}

// Create singleton instance
export const tokenManager = new FCMTokenManager();