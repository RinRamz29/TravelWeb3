import './polyfills';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { checkActorsAvailable, BACKEND_CANISTER_ID, FRONTEND_CANISTER_ID } from './services/dfinity-imports';
import { NotificationProvider } from './context/NotificationContext';
import Notification from './components/Notification';
import './index.scss';

// Log environment variables and canister IDs
console.log("Environment variables:", {
  CANISTER_ID_TRAVEL3NFT_BACKEND: process.env.CANISTER_ID_TRAVEL3NFT_BACKEND,
  CANISTER_ID_TRAVEL3NFT_FRONTEND: process.env.CANISTER_ID_TRAVEL3NFT_FRONTEND,
  DFX_NETWORK: process.env.DFX_NETWORK,
  BACKEND_CANISTER_ID,
  FRONTEND_CANISTER_ID
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {(() => {
      const status = checkActorsAvailable();
      console.log("Application initialization - Canister status:", status);
      return null;
    })()}
    <NotificationProvider>
      <App />
      <Notification />
    </NotificationProvider>
  </React.StrictMode>,
);
