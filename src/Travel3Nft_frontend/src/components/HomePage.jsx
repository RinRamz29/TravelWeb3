import React, { useState, useEffect, useCallback } from 'react';
import FilterBar from './FilterBar';
import NFTGrid from './NFTGrid';
import { useNotification } from '../context/NotificationContext';
import nftService from '../services/nftService';
import { retryOperation } from '../utils/helpers';

const HomePage = () => {
  const [nfts, setNfts] = useState([]);
  const [filteredNfts, setFilteredNfts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('name-asc');
  const [filterLocation, setFilterLocation] = useState('');
  const [networkStatus, setNetworkStatus] = useState('connecting');
  const [fetchAttempted, setFetchAttempted] = useState(false); // To track if fetch was attempted
  const { showNotification, showError } = useNotification();

  // Initialize canister connection
  useEffect(() => {
    const initConnection = async () => {
      try {
        // Ensure actors are initialized
        await nftService.initializeActors();
        setNetworkStatus('connected');
      } catch (error) {
        console.error('Error initializing connection:', error);
        setNetworkStatus('disconnected');
        showNotification('warning', 'Unable to connect to the blockchain network. Using local data.');
      }
    };

    initConnection();
  }, [showNotification]);

  // Fetch NFTs with retry mechanism
  const fetchNfts = useCallback(async () => {
    // Avoid re-fetching if already attempted
    if (fetchAttempted && nfts.length > 0) return;
    
    setIsLoading(true);
    
    try {
      console.log("Fetching NFTs for homepage");
      
      // Try to fetch real NFTs
      let fetchedNfts = [];
      
      try {
        if (nftService.nftCanister) {
          const fetchedData = await nftService.getAllNFTs();
          if (fetchedData && fetchedData.length > 0) {
            fetchedNfts = fetchedData;
          }
        }
      } catch (error) {
        console.error("Error fetching real NFTs:", error);
      }
      
      // If we got real NFTs, use them
      if (fetchedNfts && fetchedNfts.length > 0) {
        console.log("Using real NFTs:", fetchedNfts.length);
        setNfts(fetchedNfts);
        setFilteredNfts(fetchedNfts);
      } 
      // Otherwise fall back to mock data
      else {
        console.log("No real NFTs found, using mock data");
        
        // Create mock data directly if the service method is missing
        const mockData = nftService.getMockNFTs 
          ? nftService.getMockNFTs() 
          : createMockNFTs(); // Fallback function defined below
        
        setNfts(mockData);
        setFilteredNfts(mockData);
        showNotification('info', 'Using sample NFT data');
      }
    } catch (error) {
      console.error('Error in fetchNfts:', error);
      showError('Failed to load NFTs. Using mock data instead.');
      
      // Fallback to local mock data
      const mockData = createMockNFTs();
      setNfts(mockData);
      setFilteredNfts(mockData);
    } finally {
      setIsLoading(false);
      setFetchAttempted(true); // Mark that we've attempted to fetch
    }
  }, [showError, showNotification, nfts.length, fetchAttempted]);

  // Local mock data function in case the service one is missing
  const createMockNFTs = () => {
    return Array.from({ length: 24 }, (_, index) => ({
      id: `${index + 1237}`,
      tokenId: `${index + 1237}`,
      owner: `principal-${index}`,
      highlighted: index % 7 === 3,
      metadata: {
        mainImageUrl: `/assets/mock-nft-${index % 5 + 1}.jpg`,
        attributes: {
          name: `Historical Place ${index + 1}`,
          location: ['Paris, France', 'Rome, Italy', 'Athens, Greece', 'Cairo, Egypt', 'Beijing, China'][index % 5],
          year: (1800 + (index * 10)).toString(),
          culturalSignificance: "This historical place has significant cultural importance."
        }
      }
    }));
  };

  // Fetch NFTs when component mounts or network status changes
  useEffect(() => {
    if (networkStatus === 'connected' || networkStatus === 'disconnected') {
      fetchNfts();
    }
  }, [networkStatus, fetchNfts]);
  
  // Handle manual refresh
  const handleRefresh = () => {
    setFetchAttempted(false); // Reset the fetch attempted flag
    fetchNfts();
  };

  // Filter and sort NFTs when filters change
  useEffect(() => {
    if (!nfts.length) return;
    
    let results = [...nfts];
    
    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      results = results.filter(nft => {
        const name = nft.metadata?.attributes?.name || '';
        const location = nft.metadata?.attributes?.location || '';
        return name.toLowerCase().includes(search) || location.toLowerCase().includes(search);
      });
    }
    
    // Apply location filter
    if (filterLocation) {
      results = results.filter(nft => {
        const location = nft.metadata?.attributes?.location || '';
        return location === filterLocation;
      });
    }
    
    // Apply sorting
    switch (sortOption) {
      case 'name-asc':
        results.sort((a, b) => {
          const nameA = a.metadata?.attributes?.name || '';
          const nameB = b.metadata?.attributes?.name || '';
          return nameA.localeCompare(nameB);
        });
        break;
      case 'name-desc':
        results.sort((a, b) => {
          const nameA = a.metadata?.attributes?.name || '';
          const nameB = b.metadata?.attributes?.name || '';
          return nameB.localeCompare(nameA);
        });
        break;
      case 'year-asc':
        results.sort((a, b) => {
          const yearA = parseInt(a.metadata?.attributes?.year || 0, 10);
          const yearB = parseInt(b.metadata?.attributes?.year || 0, 10);
          return yearA - yearB;
        });
        break;
      case 'year-desc':
        results.sort((a, b) => {
          const yearB = parseInt(b.metadata?.attributes?.year || 0, 10);
          const yearA = parseInt(a.metadata?.attributes?.year || 0, 10);
          return yearB - yearA;
        });
        break;
      default:
        break;
    }
    
    setFilteredNfts(results);
  }, [nfts, searchTerm, sortOption, filterLocation]);

  const handleToggleHighlight = (id) => {
    setNfts(prevNfts =>
      prevNfts.map(nft =>
        nft.id === id
          ? { ...nft, highlighted: !nft.highlighted }
          : nft
      )
    );
  };

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="mb-0">NFT Collection</h1>
        <div className="d-flex align-items-center">
          {networkStatus === 'connected' ? (
            <span className="badge bg-success me-3">Connected to Network</span>
          ) : networkStatus === 'disconnected' ? (
            <span className="badge bg-warning me-3">Offline Mode</span>
          ) : (
            <span className="badge bg-secondary me-3">Connecting...</span>
          )}
          <button 
            className="btn btn-outline-primary" 
            onClick={handleRefresh}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Loading...
              </>
            ) : (
              'Refresh'
            )}
          </button>
        </div>
      </div>
      
      <FilterBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        sortOption={sortOption}
        setSortOption={setSortOption}
        filterLocation={filterLocation}
        setFilterLocation={setFilterLocation}
        places={nfts}
      />
      
      {isLoading && filteredNfts.length === 0 ? (
        <div className="text-center my-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading NFTs...</p>
        </div>
      ) : (
        <NFTGrid
          nfts={filteredNfts}
          onToggleHighlight={handleToggleHighlight}
          isLoading={isLoading}
        />
      )}
      
      {!isLoading && filteredNfts.length === 0 && (
        <div className="text-center my-5">
          <p>No NFTs found matching your filters.</p>
          <button 
            className="btn btn-outline-secondary" 
            onClick={() => {
              setSearchTerm('');
              setFilterLocation('');
              setSortOption('name-asc');
            }}
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default HomePage;