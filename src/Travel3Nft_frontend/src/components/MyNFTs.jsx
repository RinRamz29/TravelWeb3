import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import nftService from '../services/nftService';
import NFTCard from './NFTCard';
import FilterBar from './FilterBar';
import LoadingPlaceholder from './LoadingPlaceholder';

const MyNFTs = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [nfts, setNfts] = useState([]);
  const [filteredNfts, setFilteredNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    // This will be replaced with actual NFT fetching logic
    const fetchNFTs = async () => {
      try {
        // Replace with actual NFT service call
        setNfts(userNFTs);
        setFilteredNfts(userNFTs);
      } catch (error) {
        console.error('Error fetching NFTs:', error);
      } finally {
        setLoading(false);
      }
    };

    // Mock data for development until backend is ready
    const mockNFTs = [
      { id: '1001', tokenId: '1001', metadata: { attributes: { category: 'monument', area: 1.5 } } },
      { id: '1002', tokenId: '1002', metadata: { attributes: { category: 'landmark', area: 2.3 } } },
      { id: '1003', tokenId: '1003', metadata: { attributes: { category: 'museum', area: 1.8 } } },
      { id: '1004', tokenId: '1004', metadata: { attributes: { category: 'monument', area: 3.2 } } }
    ];
    
    // Use mock data for now, replace with fetchNFTs() when backend is ready
    setNfts(mockNFTs);
    setFilteredNfts(mockNFTs);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (filter === 'all') {
      setFilteredNfts(nfts);
    } else {
      setFilteredNfts(nfts.filter((nft) => nft.metadata.attributes.category === filter));
    }
  }, [filter, nfts]);

  const handleToggleHighlight = (id) => {
    setNfts(prevNfts => 
      prevNfts.map(nft => 
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
            <LoadingPlaceholder />
          ) : (
            <div className="nft-grid">
              {filteredNfts.map((nft) => (
                <NFTCard key={nft.id || nft.tokenId} nft={nft} onToggleHighlight={handleToggleHighlight} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MyNFTs;
