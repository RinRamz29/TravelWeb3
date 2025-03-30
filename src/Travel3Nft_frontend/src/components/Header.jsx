import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const location = useLocation();
  const { isAuthenticated, principal, login, logout, isLoading, authInitialized } = useAuth();
  
  // Debug output
  React.useEffect(() => {
    if (authInitialized) {
      console.log("Auth state in Header:", { isAuthenticated, principal: principal?.toString(), isLoading });
    }
  }, [isAuthenticated, principal, isLoading, authInitialized]);
  
  return (
    <header className="app-header">
      <div className="logo">
        <Link to="/">
          <svg className="logo-icon" width="50" height="50" viewBox="0 0 100 100">
            <path d="M50 10 L20 40 L50 70 L80 40 Z" fill="none" stroke="#e84393" strokeWidth="4" />
            <path d="M50 20 L30 40 L50 60 L70 40 Z" fill="#e84393" opacity="0.6" />
          </svg>
          Travel3 NFT
        </Link>
      </div>
      
      <div className="header-content">
        <nav className="main-nav">
          <ul>
            <li>
              <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
                Maps
              </Link>
            </li>
            {isAuthenticated && (
              <li>
                <Link to="/create-nft" className={location.pathname === '/create-nft' ? 'active' : ''}>
                  Create NFT
                </Link>
              </li>
            )}
            <li>
              <Link to="/my-nfts" className={location.pathname === '/my-nfts' ? 'active' : ''}>
                My NFTs
              </Link>
            </li>
          </ul>
        </nav>
        
        <button
          className="connect-button"
          onClick={isAuthenticated ? logout : login}
          disabled={isLoading}
        >
          {isAuthenticated && principal && <span className="principal-preview">{principal.toString().substring(0, 5)}...</span>}
          {isLoading ? (
            'Loading...'
          ) : isAuthenticated ? (
            'Disconnect'
          ) : (
            'Connect with Internet Identity'
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;
