import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import { Provider } from "react-redux";
import { store } from "../app/store";
import process from "process";

window.process = process;

// ✅ REGISTER SERVICE WORKER - NO UNREGISTER ON EVERY LOAD
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // Register service worker without unregistering first
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/'
      });
      
      
      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;
      
      
      // Listen for SW updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'activated') {
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