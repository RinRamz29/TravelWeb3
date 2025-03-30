import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { formatPrincipal } from '../utils/helpers';

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated, principal, login, logout, isLoading } = useAuth();
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };
    document.addEventListener('scroll', handleScroll);
    return () => {
      document.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);

  const handleConnectWallet = async () => {
    if (isAuthenticated) {
      await logout();
      showSuccess('Wallet disconnected successfully');
    } else {
      try {
        const success = await login();
        if (success) {
          showSuccess('Wallet connected successfully');
        }
      } catch (error) {
        showError('Failed to connect wallet: ' + error.message);
      }
    }
  };

  return (
    <header className={`app-header ${scrolled ? 'scrolled' : ''}`}>
      <div className="header-bottom">
        {/* Logo section */}
        <div className="logo-container">
          <svg width="40" height="40" viewBox="0 0 100 100">
            <ellipse 
              cx="50" cy="50" rx="30" ry="20" 
              fill="none" 
              stroke="#d53f8c" 
              strokeWidth="2" 
              transform="rotate(45 50 50)" 
            />
            <ellipse 
              cx="50" cy="50" rx="30" ry="20" 
              fill="none" 
              stroke="#d53f8c" 
              strokeWidth="2" 
              transform="rotate(-45 50 50)" 
            />
          </svg>
          <span>Travel3</span>
        </div>
        
        {/* Wallet connection button */}
        <div className="header-actions">
          <button
            className={`connect-wallet-btn ${isAuthenticated ? 'connected' : ''}`}
            onClick={handleConnectWallet}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : isAuthenticated
              ? `Connected: ${formatPrincipal(principal?.toString())}`
              : 'Connect Wallet'}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
