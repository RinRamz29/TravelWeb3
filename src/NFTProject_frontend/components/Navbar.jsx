// components/Navbar.js
import React from 'react';
import { shortenPrincipal } from '../utils/format';

const Navbar = ({ 
  isConnected, 
  principal, 
  onConnect, 
  onDisconnect, 
  metadata, 
  onSearch, 
  searchQuery,
  isCustodian,
  activeView,
  onViewChange
}) => {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        {metadata?.logo && (
          <img src={metadata.logo} alt="Logo" className="navbar-logo" />
        )}
        <h1 onClick={() => onViewChange('browse')} style={{ cursor: 'pointer' }}>
          {activeView === 'custodian' ? 'Custodian Panel' : (metadata?.name || 'Historical Places NFT')}
        </h1>
        {metadata?.symbol && activeView !== 'custodian' && <span className="navbar-symbol">{metadata.symbol}</span>}
        
        {activeView === 'custodian' && isCustodian && (
          <div className="custodian-badge">
            <i className="fas fa-shield-alt"></i>
            <span>Custodian Access</span>
          </div>
        )}
      </div>
      
      {activeView !== 'custodian' && (
        <div className="search-bar">
          <i className="fas fa-search"></i>
          <input 
            type="text" 
            placeholder="Search items, collections, and accounts" 
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
      )}
      
      <div className="navbar-actions">
        {isConnected ? (
          <div className="navbar-user">
            {isCustodian && activeView !== 'custodian' && (
              <button 
                className="btn secondary"
                onClick={() => onViewChange('custodian')}
              >
                <i className="fas fa-shield-alt"></i>
                Custodian Panel
              </button>
            )}
            
            {activeView === 'custodian' && (
              <button 
                className="btn secondary"
                onClick={() => onViewChange('browse')}
              >
                <i className="fas fa-arrow-left"></i>
                Back to Browse
              </button>
            )}
            
            <span className="principal-id" title={principal?.toString()}>
              {shortenPrincipal(principal?.toString())}
            </span>
            
            <button className="btn secondary" onClick={onDisconnect}>
              Disconnect
            </button>
          </div>
        ) : (
          <button className="btn primary" onClick={onConnect}>
            Connect Wallet
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;