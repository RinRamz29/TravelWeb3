// components/NFTDetail.js
import React, { useState, useEffect } from 'react';
import { formatDate, shortenPrincipal } from '../utils/format';

const NFTDetail = ({ nft, onClose, nftActor, isConnected, principal }) => {
  const [loading, setLoading] = useState(false);
  const [photoSrc, setPhotoSrc] = useState(null);
  const [documentSrc, setDocumentSrc] = useState(null);
  const [decryptionKey, setDecryptionKey] = useState(null);
  const [error, setError] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  
  const placeholderImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='20' text-anchor='middle' dominant-baseline='middle' fill='%23999'%3ENo Image%3C/text%3E%3C/svg%3E";
  
  useEffect(() => {
    const checkOwnership = async () => {
      if (!nftActor || !principal || !nft) return;
      
      try {
        const owner = await nftActor.ownerOf(nft.index);
        setIsOwner(owner.toString() === principal.toString());
      } catch (error) {
        console.error("Failed to check ownership:", error);
      }
    };
    
    checkOwnership();
  }, [nft, nftActor, principal]);
  
  const fetchFullPhoto = async () => {
    if (!isConnected || !nftActor || !principal) {
      setError("Please connect your wallet to view full images");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await nftActor.retrivePhotoSrc(nft.index, principal);
      if (result.Ok && result.Ok.ContentSrc && result.Ok.ContentSrc[0]) {
        setPhotoSrc(result.Ok.ContentSrc[0]);
      } else {
        setError("Failed to retrieve full image");
      }
    } catch (error) {
      console.error("Error fetching full photo:", error);
      setError("Error loading full image. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  const fetchDocument = async () => {
    if (!isConnected || !nftActor || !principal) {
      setError("Please connect your wallet to view documents");
      return;
    }
    
    if (!isOwner) {
      setError("Only the owner can access documents");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await nftActor.retriveDocumentSrc(nft.index, principal);
      if (result.Ok && result.Ok.ContentSrc && result.Ok.ContentSrc[0]) {
        setDocumentSrc(result.Ok.ContentSrc[0]);
      } else {
        setError("Failed to retrieve document");
      }
    } catch (error) {
      console.error("Error fetching document:", error);
      setError("Error loading document. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  const fetchDecryptionKey = async () => {
    if (!isConnected || !nftActor || !principal) {
      setError("Please connect your wallet to access decryption keys");
      return;
    }
    
    if (!isOwner) {
      setError("Only the owner can access decryption keys");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await nftActor.retriveDecryptionKey(nft.index);
      if (result.Ok && result.Ok[0]) {
        setDecryptionKey(result.Ok[0]);
      } else {
        setError("Failed to retrieve decryption key");
      }
    } catch (error) {
      console.error("Error fetching decryption key:", error);
      setError("Error loading decryption key. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  const renderAttributes = () => {
    if (!nft?.metadata?.[0]?.attributes) return null;
    
    const { 
      name, 
      year, 
      location, 
      coordinates, 
      category, 
      significance 
    } = nft.metadata[0].attributes;
    
    return (
      <div className="attribute-container">
        {name && (
          <div className="attribute-group">
            <span className="attribute-label">Name:</span>
            <span className="attribute-value">{name}</span>
          </div>
        )}
        {year && (
          <div className="attribute-group">
            <span className="attribute-label">Year:</span>
            <span className="attribute-value">{year}</span>
          </div>
        )}
        {location && (
          <div className="attribute-group">
            <span className="attribute-label">Location:</span>
            <span className="attribute-value">{location}</span>
          </div>
        )}
        {coordinates && (
          <div className="attribute-group">
            <span className="attribute-label">Coordinates:</span>
            <span className="attribute-value">{coordinates}</span>
          </div>
        )}
        {category && category.length > 0 && (
          <div className="attribute-group">
            <span className="attribute-label">Categories:</span>
            <div className="attribute-categories">
              {category.map((cat, index) => (
                <span key={index} className="category-tag">{cat}</span>
              ))}
            </div>
          </div>
        )}
        {significance && (
          <div className="attribute-group">
            <span className="attribute-label">Significance:</span>
            <p className="attribute-value">{significance}</p>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="nft-detail">
      <div className="detail-header">
        <h2>
          {nft?.metadata?.[0]?.attributes?.name 
            ? nft.metadata[0].attributes.name 
            : `Token #${nft.index}`}
        </h2>
        <button className="btn close" onClick={onClose}>×</button>
      </div>
      
      <div className="detail-content">
        <div className="detail-image-container">
          <img 
            src={photoSrc || nft.thumbnailSrc || placeholderImage} 
            alt={nft?.metadata?.[0]?.attributes?.name || `Token #${nft.index}`}
            className="detail-image" 
          />
          
          {!photoSrc && (
            <button 
              className="btn primary view-btn" 
              onClick={fetchFullPhoto}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'View Full Image'}
            </button>
          )}
        </div>
        
        <div className="detail-info">
          <div className="info-section">
            <h3>Details</h3>
            <div className="info-group">
              <span className="info-label">Token ID:</span>
              <span className="info-value">{nft.index}</span>
            </div>
            <div className="info-group">
              <span className="info-label">Owner:</span>
              <span className="info-value" title={nft.owner.toString()}>
                {shortenPrincipal(nft.owner.toString())}
                {isOwner && <span className="owner-tag">(You)</span>}
              </span>
            </div>
            <div className="info-group">
              <span className="info-label">Minted:</span>
              <span className="info-value">{formatDate(nft.timestamp)}</span>
            </div>
          </div>
          
          {renderAttributes()}
          
          {isOwner && (
            <div className="owner-actions">
              <h3>Owner Actions</h3>
              <div className="action-buttons">
                <button 
                  className="btn secondary" 
                  onClick={fetchDocument}
                  disabled={loading || documentSrc}
                >
                  {documentSrc ? 'Document Loaded' : 'Access Document'}
                </button>
                <button 
                  className="btn secondary" 
                  onClick={fetchDecryptionKey}
                  disabled={loading || decryptionKey}
                >
                  {decryptionKey ? 'Key Retrieved' : 'Get Decryption Key'}
                </button>
              </div>
              
              {documentSrc && (
                <div className="document-section">
                  <h4>Document Link</h4>
                  <a 
                    href={documentSrc} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="document-link"
                  >
                    View Document
                  </a>
                </div>
              )}
              
              {decryptionKey && (
                <div className="key-section">
                  <h4>Decryption Key</h4>
                  <div className="key-field">
                    <span className="key-label">IV:</span>
                    <code className="key-value">{decryptionKey.iv}</code>
                  </div>
                  <div className="key-field">
                    <span className="key-label">Private Key:</span>
                    <code className="key-value">{decryptionKey.privateKey}</code>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {error && <div className="error-message">{error}</div>}
        </div>
      </div>
    </div>
  );
};

export default NFTDetail;