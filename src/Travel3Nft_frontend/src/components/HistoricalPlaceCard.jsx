import React, { useState } from 'react';
import PlaceDetails from './PlaceDetails';
import { formatDate, truncateText } from '../utils/helpers';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

const HistoricalPlaceCard = ({ place }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const { showSuccess, showInfo } = useNotification();
  const { isAuthenticated } = useAuth();

  const handleFavorite = (e) => {
    e.stopPropagation(); // Prevent card click
    
    if (!isAuthenticated) {
      showInfo('Please connect your wallet to favorite NFTs');
      return;
    }
    
    setIsFavorite(!isFavorite);
    showSuccess(isFavorite ? 'Removed from favorites' : 'Added to favorites');
  };

  const handleShare = (e) => {
    e.stopPropagation(); // Prevent card click
    
    // Create a shareable URL for this NFT
    const shareUrl = `${window.location.origin}?nft=${place.index}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(shareUrl)
      .then(() => showSuccess('Link copied to clipboard'))
      .catch(() => showInfo('Failed to copy link'));
  };

  // Extract attributes from metadata if available
  const attributes = place.metadata?.attributes || {};
  const imageUrl = place.metadata?.mainImageLocation?.icp || 
                  place.metadata?.imageLocation?.icp || 
                  '/logo2.svg'; // Fallback to default image

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  return (
    <div className="historical-place-card">
      <div className="card-content" onClick={() => setShowDetails(true)}>
        <div className={`image-container ${!imageLoaded ? 'loading' : ''}`}>
          <img 
            src={imageUrl} 
            alt={attributes.name || 'Historical Place'} 
            onLoad={handleImageLoad}
          />
          {!imageLoaded && <div className="image-placeholder"></div>}
        </div>
        
        <div className="card-info">
          <h3>{truncateText(attributes.name || `Place #${place.index}`, 30)}</h3>
          <p className="location">{truncateText(attributes.location || 'Unknown location', 25)}</p>
          <p className="year">{attributes.year || 'Unknown year'}</p>
          
          <div className="card-footer">
            <span className="token-id">Token #{place.index}</span>
            <span className="mint-date">{formatDate(place.timestamp)}</span>
          </div>
          
          <div className="card-actions">
            <button className={`favorite-btn ${isFavorite ? 'active' : ''}`} onClick={handleFavorite}>
              {isFavorite ? '★' : '☆'}
            </button>
            <button className="share-btn" onClick={handleShare}>
              Share
            </button>
          </div>
        </div>
      </div>
      {showDetails && <PlaceDetails place={place} onClose={() => setShowDetails(false)} />}
    </div>
  );
};

export default HistoricalPlaceCard;
