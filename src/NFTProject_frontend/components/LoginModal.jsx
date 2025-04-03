// components/LoginModal.js
import React, { useState } from 'react';
import { AuthClient } from '@dfinity/auth-client';

const LoginModal = ({ onLogin, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Inside LoginModal.js

  const handleInternetIdentity = async () => {
    setLoading(true);
    setError(null);

    try {
      const authClient = await AuthClient.create();

      const isLocalEnv = window.location.hostname === 'localhost' ||
        window.location.hostname.includes('127.0.0.1');

      const identityProviderUrl = isLocalEnv
        ? 'http://localhost:4943/?canisterId=rdmx6-jaaaa-aaaaa-aaadq-cai'
        : 'https://identity.ic0.app';

      const isAuthenticated = await new Promise((resolve) => {
        authClient.login({
          identityProvider: identityProviderUrl,
          onSuccess: () => resolve(true),
          onError: (error) => {
            console.error('Login error:', error);
            resolve(false);
          }
        });
      });

      if (isAuthenticated) {
        const identity = authClient.getIdentity();
        onLogin(identity);
      } else {
        setError('Authentication failed. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An error occurred during login: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePlugWallet = () => {
    setError('Plug Wallet integration coming soon!');
    // Implementation for Plug Wallet would go here
  };

  const handleStoicWallet = () => {
    setError('Stoic Wallet integration coming soon!');
    // Implementation for Stoic Wallet would go here
  };

  return (
    <div className="modal-overlay">
      <div className="login-modal">
        <div className="modal-header">
          <h3>Connect Wallet</h3>
          <button className="btn close" onClick={onClose}>×</button>
        </div>

        <div className="wallet-options">
          <button
            className="wallet-option"
            onClick={handleInternetIdentity}
            disabled={loading}
          >
            <img
              src="https://internetcomputer.org/img/IC_logo.svg"
              alt="Internet Identity"
              className="wallet-icon"
            />
            <span>Internet Identity</span>
          </button>

          <button
            className="wallet-option"
            onClick={handlePlugWallet}
            disabled={loading}
          >
            <img
              src="https://plugwallet.ooo/assets/images/plug-logo.svg"
              alt="Plug Wallet"
              className="wallet-icon"
            />
            <span>Plug Wallet</span>
          </button>

          <button
            className="wallet-option"
            onClick={handleStoicWallet}
            disabled={loading}
          >
            <img
              src="https://stoicwallet.com/stoic-wallet-logo.png"
              alt="Stoic Wallet"
              className="wallet-icon"
            />
            <span>Stoic Wallet</span>
          </button>
        </div>

        {loading && (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Connecting...</p>
          </div>
        )}

        {error && <div className="error-message">{error}</div>}
      </div>
    </div>
  );
};

export default LoginModal;