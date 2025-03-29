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
      <div className="container">
        <div className="header-content">
          <div className="logo">
            <img src="/logo2.svg" alt="Travel3 Logo" />
            <span>Travel3</span>
          </div>
          <nav className="main-nav">
            <ul>
              <li><a href="#" className="active">Collection</a></li>
              <li><a href="#">About</a></li>
              <li><a href="#">FAQ</a></li>
            </ul>
          </nav>
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
      </div>
    </header>
  );
};

export default Header;
