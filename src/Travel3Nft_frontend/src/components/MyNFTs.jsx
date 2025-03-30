import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import nftService from '../services/nftService';
import NFTCard from './NFTCard';
import FilterBar from './FilterBar';
import LoadingPlaceholder from './LoadingPlaceholder';

const MyNFTs = () => {
  const { isAuthenticated, isLoading, principal } = useAuth();
  const navigate = useNavigate();
  const [nfts, setNfts] = useState([]);
  const [filteredNfts, setFilteredNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  // Debug output
  useEffect(() => {
    console.log("MyNFTs auth state:", { isAuthenticated, isLoading, principal: principal?.toString() });
  }, [isAuthenticated, isLoading, principal]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, isLoading, navigate]);

  const fetchUserNFTs = useCallback(async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    setError(null);

    try {
      console.log("Fetching user NFTs...");
      const userNFTs = await nftService.getUserNFTs();
      console.log("Received user NFTs:", userNFTs);

      if (userNFTs && userNFTs.length > 0) {
        setNfts(userNFTs);
        setFilteredNfts(userNFTs);
      } else {
        console.log("No NFTs found for user");
        setNfts([]);
        setFilteredNfts([]);
      }
    } catch (err) {
      console.error("Error fetching NFTs:", err);
      setError("Failed to load your NFTs. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    // Only fetch NFTs if user is authenticated and not in loading state
    if (!isLoading && isAuthenticated) {
      fetchUserNFTs();
    }
  }, [isLoading, isAuthenticated, fetchUserNFTs]);

  useEffect(() => {
    // Apply filters when nfts or filter changes
    if (!nfts || nfts.length === 0) {
      setFilteredNfts([]);
      return;
    }

    if (filter === 'all') {
      setFilteredNfts(nfts);
    } else {
      setFilteredNfts(nfts.filter((nft) => nft.metadata.attributes.category === filter));
    }
  }, [filter, nfts]);

  const handleToggleHighlight = (id) => {
    setNfts((prevNfts) =>
      prevNfts.map((nft) =>
        nft.id === id ? { ...nft, highlighted: !nft.highlighted } : nft
      )
    );
  };

  return (
    <div className="my-nfts-container">
      {!isAuthenticated && !isLoading ? (
        <div className="auth-message">
          Please connect your wallet to view your NFTs
        </div>
      ) : (
        <div>
          <h1>My NFT Collection</h1>
          <FilterBar filter={filter} setFilter={setFilter} />
          {loading ? (
            <LoadingPlaceholder message="Loading your NFT collection..." />
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : filteredNfts.length === 0 ? (
            <div className="empty-collection">
              <p>You don't have any NFTs in your collection yet.</p>
              <button onClick={() => navigate('/mint')}>Mint Your First NFT</button>
            </div>
          ) : (
            <div className="nft-grid">
              {filteredNfts.map((nft, index) => (
                <NFTCard key={nft.id || nft.tokenId || index} 
                  nft={nft} onToggleHighlight={handleToggleHighlight} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MyNFTs;
