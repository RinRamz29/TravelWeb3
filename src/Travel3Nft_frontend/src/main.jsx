import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { NotificationProvider } from './context/NotificationContext';
import Notification from './components/Notification';
import './index.scss';
import './polyfills';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <NotificationProvider>
      <App />
      <Notification />
    </NotificationProvider>
  </React.StrictMode>,
);
