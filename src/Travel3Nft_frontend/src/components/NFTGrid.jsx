import React from 'react';
import NFTCard from './NFTCard';

const NFTGrid = ({ nfts, onToggleHighlight, isLoading }) => {
  if (isLoading) {
    // Return loading placeholders
    return (
      <div className="nft-grid">
        {Array.from({ length: 12 }).map((_, index) => (
          <div key={index} className="nft-card loading">
            <div className="token-id-placeholder"></div>
            <div className="icon-placeholder"></div>
            <div className="area-placeholder"></div>
          </div>
        ))}
      </div>
    );
  }

  if (nfts.length === 0) {
    return (
      <div className="no-results">
        No NFTs found. Try adjusting your filters.
      </div>
    );
  }

  return (
    <div className="nft-grid">
      {nfts.map((nft) => (
        <NFTCard
          key={nft.id || nft.index}
          nft={nft}
          onToggleHighlight={onToggleHighlight}
        />
      ))}
    </div>
  );
};

export default NFTGrid;