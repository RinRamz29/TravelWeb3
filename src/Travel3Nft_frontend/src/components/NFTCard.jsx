import React from 'react';

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
      <div className="token-id">#{tokenId}</div>
      
      <div className="diamond-nft">
        <div className="diamond"></div>
        <div className="diamond-stand"></div>
      </div>
      
      <div className="card-footer">{area}</div>
    </div>
  );
};

export default NFTCard;