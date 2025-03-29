import React, { useState, useEffect } from 'react';

const Notification = ({ message, type, duration = 3000, onClose }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => {
        onClose();
      }, 300); // Allow time for fade-out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className={`notification ${type} ${visible ? 'visible' : 'hidden'}`}>
      <div className="notification-content">
        {type === 'error' && <span className="icon">⚠️</span>}
        {type === 'success' && <span className="icon">✅</span>}
        {type === 'info' && <span className="icon">ℹ️</span>}
        <p>{message}</p>
      </div>
      <button className="close-notification" onClick={() => setVisible(false)}>×</button>
    </div>
  );
};

export default Notification;
