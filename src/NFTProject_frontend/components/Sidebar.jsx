// components/Sidebar.js
import React from 'react';

const Sidebar = ({ activeView, onViewChange, isCustodian, isConnected }) => {
  return (
    <div className="sidebar">
      <img 
        src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMjAwIDIwMCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiMxODY3OWUiLz48cGF0aCBkPSJNODAgMTUwTDUwIDEwMEwxMTAgMTAwTDgwIDE1MFoiIGZpbGw9IndoaXRlIi8+PHBhdGggZD0iTTEzMCAxNTBMMTAwIDEwMEwxNjAgMTAwTDEzMCAxNTBaIiBmaWxsPSJ3aGl0ZSIvPjxjaXJjbGUgY3g9IjE0MCIgY3k9IjUwIiByPSIyMCIgZmlsbD0iI2YwYjgzYiIvPjwvc3ZnPg==" 
        alt="Logo" 
        className="sidebar-logo"
        onClick={() => onViewChange('browse')}
      />
      
      <div 
        className={`sidebar-item ${activeView === 'browse' ? 'active' : ''}`}
        onClick={() => onViewChange('browse')}
        title="Browse NFTs"
      >
        <i className="fas fa-home"></i>
      </div>
      
      <div className="sidebar-item" title="Search">
        <i className="fas fa-search"></i>
      </div>
      
      {isConnected && (
        <div className="sidebar-item" title="My Profile">
          <i className="fas fa-user"></i>
        </div>
      )}
      
      {isCustodian && (
        <>
          <div className="sidebar-divider"></div>
          
          <div 
            className={`sidebar-item ${activeView === 'custodian' ? 'active' : ''}`}
            onClick={() => onViewChange('custodian')}
            title="Custodian Panel"
          >
            <i className="fas fa-shield-alt"></i>
          </div>
          
          <div 
            className="sidebar-item"
            title="Mint New NFT"
            onClick={() => {
              onViewChange('custodian');
            }}
          >
            <i className="fas fa-plus-circle"></i>
          </div>
        </>
      )}
      
      <div className="sidebar-divider"></div>
      
      <div className="sidebar-item" title="Statistics">
        <i className="fas fa-chart-line"></i>
      </div>
      
      <div className="sidebar-item" title="Settings">
        <i className="fas fa-cog"></i>
      </div>
      
      <div className="sidebar-item" title="Help">
        <i className="fas fa-question-circle"></i>
      </div>
    </div>
  );
};

export default Sidebar;