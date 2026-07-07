import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import { Provider } from "react-redux";
import { store } from "../app/store";
import process from "process";

window.process = process;

// ✅ REGISTER SERVICE WORKER WITH BETTER HANDLING
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // Unregister any existing service workers first (cleanup)
      const existingRegistrations = await navigator.serviceWorker.getRegistrations();
      for (let registration of existingRegistrations) {
        if (registration.active && registration.active.scriptURL.includes('firebase-messaging-sw')) {
          console.log('🧹 Unregistering existing SW...');
          await registration.unregister();
        }
      }
      
      // Register new service worker
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/'
      });
      
      console.log('✅ Service Worker registered successfully:', registration);
      
      // Check if SW is active
      if (registration.active) {
        console.log('✅ Service Worker is active');
      } else if (registration.installing) {
        console.log('⏳ Service Worker is installing...');
      } else if (registration.waiting) {
        console.log('⏳ Service Worker is waiting...');
      }
      
      // Listen for SW updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('🔄 New Service Worker installing...');
        
        newWorker.addEventListener('statechange', () => {
          console.log('📊 Service Worker state:', newWorker.state);
          if (newWorker.state === 'activated') {
            console.log('✅ New Service Worker activated!');
          }
        });
      });
      
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </Provider>
);