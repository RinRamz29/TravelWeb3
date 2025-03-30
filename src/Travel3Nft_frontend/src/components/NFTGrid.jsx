import React from 'react';
import { Link } from 'react-router-dom';

const NFTGrid = ({ nfts, onToggleHighlight, isLoading }) => {
  // If there are no NFTs, show a message
  if (!isLoading && (!nfts || nfts.length === 0)) {
    return (
      <div className="text-center my-5">
        <p className="h5">No NFTs found.</p>
      </div>
    );
  }

  return (
    <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 row-cols-xl-4 g-4">
      {nfts.map((nft) => (
        <div className="col" key={nft.id}>
          <div className={`card h-100 ${nft.highlighted ? 'border-primary' : ''}`}>
            {/* NFT Image */}
            <div className="card-img-container position-relative" style={{ paddingTop: '75%', overflow: 'hidden' }}>
              {nft.metadata?.mainImageUrl ? (
                <img
                  src={nft.metadata.mainImageUrl}
                  className="card-img-top position-absolute top-0 start-0 w-100 h-100"
                  style={{ objectFit: 'cover' }}
                  alt={nft.metadata?.attributes?.name || 'NFT'}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/placeholder-image.jpg';
                  }}
                />
              ) : (
                <div 
                  className="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-light"
                >
                  <span className="text-muted">No image</span>
                </div>
              )}
              
              {/* Highlight button */}
              <button
                className={`btn position-absolute top-0 end-0 m-2 ${
                  nft.highlighted ? 'btn-primary' : 'btn-outline-light'
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  onToggleHighlight(nft.id);
                }}
                aria-label={nft.highlighted ? 'Remove from favorites' : 'Add to favorites'}
              >
                <i className="bi bi-star-fill"></i>
              </button>
            </div>
            
            {/* Card Body */}
            <div className="card-body">
              <h5 className="card-title mb-1">
                {nft.metadata?.attributes?.name || 'Unnamed NFT'}
              </h5>
              
              <p className="card-text text-muted small mb-2">
                {nft.metadata?.attributes?.location || 'Unknown Location'}
                {nft.metadata?.attributes?.year && `, ${nft.metadata.attributes.year}`}
              </p>
              
              <p className="card-text small text-truncate">
                {nft.metadata?.attributes?.culturalSignificance?.substring(0, 100) || 'No description available'}
                {nft.metadata?.attributes?.culturalSignificance?.length > 100 ? '...' : ''}
              </p>
              
              <div className="d-flex justify-content-between align-items-center mt-3">
                <span className="badge bg-light text-dark">
                  ID: {nft.tokenId || nft.id}
                </span>
                
                <Link to={`/nft/${nft.id}`} className="btn btn-sm btn-outline-primary">
                  View Details
                </Link>
              </div>
            </div>
          </div>
        </div>
      ))}
      
      {/* Loading placeholders */}
      {isLoading && nfts.length === 0 && (
        Array.from({ length: 8 }).map((_, index) => (
          <div className="col" key={`skeleton-${index}`}>
            <div className="card h-100">
              <div className="card-img-top bg-light" style={{ height: '200px' }}></div>
              <div className="card-body">
                <div className="placeholder-glow">
                  <span className="placeholder col-7 mb-2"></span>
                  <span className="placeholder col-4 mb-3"></span>
                  <span className="placeholder col-12 mb-2"></span>
                  <span className="placeholder col-8"></span>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default NFTGrid;