import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

const NftActions = ({ place, isOwner }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated } = useAuth();
  const { showSuccess, showInfo, showError } = useNotification();

  const handleMakeOffer = () => {
    if (!isAuthenticated) {
      showInfo('Please connect your wallet to make an offer');
      return;
    }
    
    showInfo('Marketplace functionality coming soon');
  };

  const handleTransfer = () => {
    if (!isAuthenticated) {
      showInfo('Please connect your wallet to transfer this NFT');
      return;
    }
    
    if (!isOwner) {
      showError('You can only transfer NFTs that you own');
      return;
    }
    
    showInfo('Transfer functionality coming soon');
  };

  const handleViewHistory = () => {
    showInfo('Transaction history coming soon');
  };

  return (
    <div className="nft-actions">
      {isOwner ? (
        <button 
          className="transfer-btn" 
          onClick={handleTransfer}
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : 'Transfer NFT'}
        </button>
      ) : (
        <button 
          className="make-offer-btn" 
          onClick={handleMakeOffer}
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : 'Make Offer'}
        </button>
      )}
      
      <button 
        className="history-btn" 
        onClick={handleViewHistory}
      >
        View History
      </button>
    </div>
  );
};

export default NftActions;
