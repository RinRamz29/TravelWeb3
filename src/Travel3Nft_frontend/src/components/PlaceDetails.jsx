import React, { useState, useEffect } from 'react';
import { formatDate, formatPrincipal } from '../utils/helpers';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import NftActions from './NftActions';

const PlaceDetails = ({ place, onClose }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [imageZoomed, setImageZoomed] = useState(false);
  const { showSuccess, showInfo } = useNotification();
  const { isAuthenticated, principal } = useAuth();
  
  // Extract attributes from metadata if available
  const attributes = place.metadata?.attributes || {};
  const imageUrl = place.metadata?.mainImageLocation?.icp || 
                  place.metadata?.imageLocation?.icp || 
                  '/logo2.svg'; // Fallback to default image
  const documentUrl = place.metadata?.documentLocation?.icp || '';
  
  // Close modal when Escape key is pressed
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);
  
  // Prevent scrolling of background content when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);
  
  const handleImageLoad = () => {
    setImageLoaded(true);
  };
  
  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('place-details-overlay')) {
      onClose();
    }
  };

  const handleDownloadImage = () => {
    if (!imageUrl) {
      showInfo('No image available to download');
      return;
    }
    
    // Create a temporary link to download the image
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `travel3-nft-${place.index}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showSuccess('Image download started');
  };

  const toggleImageZoom = () => {
    setImageZoomed(!imageZoomed);
  };

  const isOwner = isAuthenticated && principal && 
    principal.toString() === place.owner.toString();

  return (
    <div className="place-details-overlay" onClick={handleOverlayClick}>
      <div className="place-details-modal">
        <button className="close-button" onClick={onClose}>×</button>
        
        {imageZoomed && <div className="zoomed-image-overlay" onClick={toggleImageZoom}><img src={imageUrl} alt={attributes.name} /></div>}
        
        <div className="details-content">
          <div className={`details-image ${!imageLoaded ? 'loading' : ''}`}>
            <img 
              src={imageUrl} 
              alt={attributes.name || 'Historical Place'} 
              onLoad={handleImageLoad}
            />
            
            {!imageLoaded && <div className="image-placeholder"></div>}
            
            <div className="image-actions">
              <button className="zoom-btn" onClick={toggleImageZoom}>🔍</button>
              <button className="download-btn" onClick={handleDownloadImage}>⬇️</button>
            </div>
            
          </div>
          
          <div className="details-info">
            <h2>{attributes.name || `Place #${place.index}`}</h2>
            <div className="tabs">
              <button 
                className={activeTab === 'info' ? 'active' : ''} 
                onClick={() => setActiveTab('info')}
              >
                Information
              </button>
              <button 
                className={activeTab === 'nft' ? 'active' : ''} 
                onClick={() => setActiveTab('nft')}
              >
                NFT Details
              </button>
            </div>

            {isOwner && (
              <div className="owner-badge">
                You own this NFT
              </div>
            )}
            
            {activeTab === 'info' && (
              <div className="tab-content">
                <p className="location"><strong>Location:</strong> {attributes.location || 'Unknown location'}</p>
                <p className="year"><strong>Year:</strong> {attributes.year || 'Unknown year'}</p>
                
                {attributes.description && (
                  <div className="description">
                    <h3>Description</h3>
                    <p>{attributes.description}</p>
                  </div>
                )}
                
                {documentUrl && (
                  <div className="document-link">
                    <h3>Documentation</h3>
                    <a href={documentUrl} target="_blank" rel="noopener noreferrer" className="document-button">
                      View Documentation
                    </a>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'nft' && (
              <div className="tab-content">
                <div className="nft-info">
                  <div className="info-row">
                    <span>Token ID</span>
                    <span>#{place.index}</span>
                  </div>
                  <div className="info-row">
                    <span>Owner</span>
                    <span className="owner-id">{formatPrincipal(place.owner.toString())}</span>
                  </div>
                  <div className="info-row">
                    <span>Minted</span>
                    <span>{formatDate(place.timestamp)}</span>
                  </div>
                  <div className="info-row">
                    <span>Collection</span>
                    <span>Travel3 Historical Places</span>
                  </div>
                  
                  <NftActions place={place} isOwner={isOwner} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaceDetails;
