import React from 'react';
import { X } from 'lucide-react'; // Assuming you have lucide-react installed

const NFTCard = ({ nft, onToggleHighlight }) => {
  // Extract relevant data from nft object
  const tokenId = nft.tokenId || nft.id || '0000';
  const area = nft.metadata?.attributes?.area || 1.25;
  const isHighlighted = nft.highlighted || false;

  return (
    <div 
      className={`nft-card ${isHighlighted ? 'highlighted' : ''}`}
      onClick={() => onToggleHighlight(nft.id || nft.index)}
    >
      <div className="card-close">
        <X size={16} />
      </div>
      <div className="token-id">
        #{tokenId}
      </div>
      
      {/* Diamond icon */}
      <div className="nft-icon">
        <svg viewBox="0 0 100 100">
          <rect 
            x="30" 
            y="30" 
            width="40" 
            height="40" 
            fill="#f59e0b" 
            transform="rotate(45 50 50)" 
          />
          <line x1="50" y1="70" x2="50" y2="85" stroke="#f59e0b" strokeWidth="3" />
          <line x1="45" y1="80" x2="55" y2="80" stroke="#f59e0b" strokeWidth="3" />
        </svg>
      </div>
      
      {/* Area value */}
      <div className="nft-area">
        {area} <sup>m²</sup>
      </div>
    </div>
  );
};

export default NFTCard;