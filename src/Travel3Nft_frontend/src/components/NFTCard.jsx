import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import placeholderImage from '../assets/placeholder-image.jpg';

const NFTCard = ({ nft, onToggleHighlight }) => {
  const [imageError, setImageError] = useState(false);
  
  // Handle different NFT data formats
  const id = nft.id || nft.index?.toString() || nft.tokenId?.toString() || '0';
  const tokenId = nft.tokenId || nft.index?.toString() || id;
  const highlighted = nft.highlighted || false;
  
  // Extract metadata from different possible formats
  const metadata = nft.metadata || {};
  const attributes = metadata.attributes || {};
  
  // Get image URL from different possible locations in the data structure
  let imageUrl = '';
  if (metadata.mainImageUrl) {
    imageUrl = metadata.mainImageUrl;
  } else if (metadata.mainImageLocation?.icp) {
    imageUrl = metadata.mainImageLocation.icp;
  } else if (metadata[0]?.mainImageLocation?.icp) {
    imageUrl = metadata[0].mainImageLocation.icp;
  }
  
  // Get NFT name from different possible locations
  const name = attributes.name || metadata.name || `NFT #${tokenId}`;
  
  // Get location from different possible locations
  const location = attributes.location || metadata.location || 'Unknown Location';

  const handleHighlightToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleHighlight) {
      onToggleHighlight(id || tokenId);
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <Link to={`/nft/${tokenId}`} className={`nft-card ${highlighted ? 'highlighted' : ''}`}>
      <div className="nft-card-inner">
        <div className="nft-image-container">
          <img
            src={!imageError ? imageUrl : placeholderImage}
            alt={name}
            onError={handleImageError}
            className="nft-image"
          />
          {highlighted && <div className="highlight-badge">Featured</div>}
        </div>
        <div className="nft-info">
          <h3>{name}</h3>
          <p className="nft-location">{location}</p>
          {attributes.year && <p className="nft-year">{attributes.year}</p>}
          <button className="highlight-toggle" onClick={handleHighlightToggle}>
            {highlighted ? 'Remove Highlight' : 'Highlight'}
          </button>
        </div>
      </div>
    </Link>
  );
};

export default NFTCard;
