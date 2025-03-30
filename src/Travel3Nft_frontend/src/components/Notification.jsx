import React from 'react';
import { useNotification } from '../context/NotificationContext';

const Notification = () => {
  const { notifications, dismissNotification } = useNotification();

  if (notifications.length === 0) return null;

  return (
    <div className="notification-container">
      {notifications.map(notification => (
        <div 
          key={notification.id} 
          className={`notification notification-${notification.type}`}
        >
          <div className="notification-content">
            <div className="notification-message">{notification.message}</div>
          </div>
          <button 
            className="notification-dismiss" 
            onClick={() => dismissNotification(notification.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export default Notification;
