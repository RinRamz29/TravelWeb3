// components/Footer.js (updated)
import React from 'react';

const Footer = ({ metadata }) => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-info">
          <p>
            {metadata?.name || 'Historical Places NFT'} 
            {metadata?.symbol && ` (${metadata.symbol})`}
          </p>
          {metadata?.desc && (
            <p className="footer-description">{metadata.desc}</p>
          )}
        </div>
        <div className="footer-links">
          <a href="https://internetcomputer.org/" target="_blank" rel="noopener noreferrer">
            Powered by Internet Computer
          </a>
          {metadata?.owner && (
            <p className="footer-owner">
              Created by {metadata.owner.toString().slice(0, 5)}...{metadata.owner.toString().slice(-3)}
            </p>
          )}
        </div>
      </div>
    </footer>
  );
};

export default Footer;