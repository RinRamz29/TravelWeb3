// components/NFTCard.js (updated)
import React from 'react';
import { formatDate } from '../utils/format';

const NFTCard = ({ nft, onClick, viewCount, viewMode }) => {
  const placeholderImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23353840'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='20' text-anchor='middle' dominant-baseline='middle' fill='%236e6e6e'%3ENo Image%3C/text%3E%3C/svg%3E";
  
  const getAttributes = () => {
    if (nft?.metadata?.[0]?.attributes) {
      const { name, year, location, category } = nft.metadata[0].attributes;
      
      return (
        <div className="nft-attributes">
          {name && <div className="nft-name">{name}</div>}
          <div className="nft-details">
            {year && <span>{year}</span>}
            {location && <span>• {location}</span>}
          </div>
          {category && category.length > 0 && (
            <div className="nft-categories">
              {category.slice(0, 2).map((cat, index) => (
                <span key={index} className="category-tag">{cat}</span>
              ))}
              {category.length > 2 && <span className="category-tag">+{category.length - 2}</span>}
            </div>
          )}
        </div>
      );
    }
    
    return <div className="nft-id">Token #{nft.index}</div>;
  };
  
  if (viewMode === 'list') {
    return (
      <div className="nft-list-item" onClick={onClick}>
        <div className="list-item-image">
          <img 
            src={nft.thumbnailSrc || placeholderImage} 
            alt={nft?.metadata?.[0]?.attributes?.name || `Token #${nft.index}`} 
          />
        </div>
        <div className="list-item-info">
          <div className="list-item-name">
            {nft?.metadata?.[0]?.attributes?.name || `Token #${nft.index}`}
          </div>
          <div className="list-item-details">
            {nft?.metadata?.[0]?.attributes?.year && (
              <span>{nft.metadata[0].attributes.year}</span>
            )}
            {nft?.metadata?.[0]?.attributes?.location && (
              <span>• {nft.metadata[0].attributes.location}</span>
            )}
          </div>
        </div>
        <div className="list-item-stats">
          <div className="list-item-views">
            <i className="fas fa-eye"></i>
            <span>{viewCount}</span>
          </div>
          <div className="list-item-date">
            {formatDate(nft.timestamp)}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="nft-card" onClick={onClick}>
      <div className="nft-thumbnail">
        <img 
          src={nft.thumbnailSrc || placeholderImage} 
          alt={nft?.metadata?.[0]?.attributes?.name || `Token #${nft.index}`} 
        />
      </div>
      <div className="nft-info">
        {getAttributes()}
      </div>
      <div className="nft-footer">
        <div className="nft-date">{formatDate(nft.timestamp)}</div>
        <div className="nft-access-count">
          <i className="fas fa-eye"></i>
          <span>{viewCount}</span>
        </div>
      </div>
    </div>
  );
};

export default NFTCard;
