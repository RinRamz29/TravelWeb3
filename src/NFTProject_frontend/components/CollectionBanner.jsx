// components/CollectionBanner.js
import React from 'react';

const CollectionBanner = ({ metadata }) => {
  // Create a placeholder banner image if none provided
  const bannerImage = "https://images.unsplash.com/photo-1526129318478-62ed807ebdf9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=300&q=80";
  
  return (
    <div className="collection-banner" style={{ backgroundImage: `url(${bannerImage})` }}>
      <div className="banner-overlay">
        <img 
          src={metadata?.logo || "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMjAwIDIwMCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiMxODY3OWUiLz48cGF0aCBkPSJNODAgMTUwTDUwIDEwMEwxMTAgMTAwTDgwIDE1MFoiIGZpbGw9IndoaXRlIi8+PHBhdGggZD0iTTEzMCAxNTBMMTAwIDEwMEwxNjAgMTAwTDEzMCAxNTBaIiBmaWxsPSJ3aGl0ZSIvPjxjaXJjbGUgY3g9IjE0MCIgY3k9IjUwIiByPSIyMCIgZmlsbD0iI2YwYjgzYiIvPjwvc3ZnPg=="}
          alt="Collection Logo" 
          className="collection-logo" 
        />
        <div className="collection-info">
          <h2>{metadata?.name || 'Historical Places Collection'}</h2>
          <div className="collection-stats">
            <span>Items: {metadata?.totalSupply || 0}</span>
            <span>Created: {new Date(Number(metadata?.created_at || 0) / 1000000).toLocaleDateString()}</span>
            <span>By: {shortenPrincipal(metadata?.owner?.toString())}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function
const shortenPrincipal = (principal) => {
  if (!principal) return '';
  if (principal.length <= 10) return principal;
  return `${principal.slice(0, 5)}...${principal.slice(-5)}`;
};

export default CollectionBanner;