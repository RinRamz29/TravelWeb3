import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const location = useLocation();
  const { isAuthenticated, principal, login, logout, isLoading } = useAuth();
  
  const formatPrincipal = (principal) => {
    if (!principal) return '';
    const principalText = principal.toString();
    return `${principalText.substring(0, 5)}...${principalText.substring(principalText.length - 5)}`;
  };
  
  return (
    <header className="app-header">
      <div className="logo-container">
        <Link to="/">
          <svg className="logo" width="50" height="50" viewBox="0 0 100 100">
            <path d="M50 10 L20 40 L50 70 L80 40 Z" fill="none" stroke="#e84393" strokeWidth="4" />
            <path d="M50 20 L30 40 L50 60 L70 40 Z" fill="#e84393" opacity="0.6" />
          </svg>
        </Link>
      </div>
      
      <div className="header-content">
        <nav>
          <ul className="nav-links">
            <li>
              <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
                Maps
              </Link>
            </li>
            <li>
              <Link to="/my-nfts" className={location.pathname === '/my-nfts' ? 'active' : ''}>
                My NFTs
              </Link>
            </li>
            <li>
              <Link to="/create-nft" className={location.pathname === '/create-nft' ? 'active' : ''}>
                Create NFT
              </Link>
            </li>
          </ul>
        </nav>
        
        <button
          className="connect-button"
          onClick={isAuthenticated ? logout : login}
          disabled={isLoading}
        >
          {isLoading ? (
            'Loading...'
          ) : isAuthenticated ? (
            `Connected: ${formatPrincipal(principal)}`
          ) : (
            'Connect with Internet Identity'
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;