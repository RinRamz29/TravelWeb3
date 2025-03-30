import React, { createContext, useContext, useState, useCallback } from 'react';

export const NotificationContext = createContext();

export const useNotification = () => {
  return useContext(NotificationContext);
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  // Generate a unique ID for each notification
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  // Add a notification
  const addNotification = useCallback((type, message) => {
    const id = generateId();
    setNotifications(prev => [...prev, { id, type, message }]);
    return id;
  }, []);

  // Remove a notification by ID
  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  // Helper functions for different notification types
  const showSuccess = useCallback((message) => {
    return addNotification('success', message);
  }, [addNotification]);

  const showError = useCallback((message) => {
    return addNotification('error', message);
  }, [addNotification]);

  const showInfo = useCallback((message) => {
    return addNotification('info', message);
  }, [addNotification]);

  const showWarning = useCallback((message) => {
    return addNotification('warning', message);
  }, [addNotification]);

  const value = {
    notifications,
    addNotification,
    removeNotification,
    showSuccess,
    showError,
    showInfo,
    showWarning
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
