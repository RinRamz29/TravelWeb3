import React, { useState, useEffect } from 'react';
import FilterBar from './FilterBar';
import NFTGrid from './NFTGrid';
import { useNotification } from '../context/NotificationContext';

const HomePage = () => {
  const [nfts, setNfts] = useState([]);
  const [filteredNfts, setFilteredNfts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('name-asc');
  const [filterLocation, setFilterLocation] = useState('');
  const { showError } = useNotification();

  // Simulate fetching NFTs data
  useEffect(() => {
    const fetchNfts = async () => {
      try {
        // In a real app, this would be an API call
        // For now, we'll create some mock data
        setTimeout(() => {
          const mockNfts = Array.from({ length: 24 }, (_, index) => ({
            id: `${index + 1237}`,
            tokenId: `${index + 1237}`,
            owner: `principal-${index}`,
            highlighted: index % 7 === 3, // Highlight some NFTs
            metadata: {
              attributes: {
                name: `Land Plot ${index + 1}`,
                location: ['New York', 'Paris', 'Tokyo', 'London'][index % 4],
                year: 2020 + (index % 5),
                area: (1 + index % 5) * 0.25
              }
            }
          }));
          
          setNfts(mockNfts);
          setFilteredNfts(mockNfts);
          setIsLoading(false);
        }, 1500);
        
      } catch (error) {
        console.error('Error fetching NFTs:', error);
        showError('Failed to load NFTs');
        setIsLoading(false);
      }
    };
    
    fetchNfts();
  }, [showError]);

  // Filter and sort NFTs when filters change
  useEffect(() => {
    let results = [...nfts];
    
    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      results = results.filter(nft => 
        nft.metadata?.attributes?.name?.toLowerCase().includes(search) ||
        nft.metadata?.attributes?.location?.toLowerCase().includes(search)
      );
    }
    
    // Apply location filter
    if (filterLocation) {
      results = results.filter(nft => 
        nft.metadata?.attributes?.location === filterLocation
      );
    }
    
    // Apply sorting
    switch (sortOption) {
      case 'name-asc':
        results.sort((a, b) => 
          (a.metadata?.attributes?.name || '').localeCompare(b.metadata?.attributes?.name || '')
        );
        break;
      case 'name-desc':
        results.sort((a, b) => 
          (b.metadata?.attributes?.name || '').localeCompare(a.metadata?.attributes?.name || '')
        );
        break;
      case 'year-asc':
        results.sort((a, b) => 
          (a.metadata?.attributes?.year || 0) - (b.metadata?.attributes?.year || 0)
        );
        break;
      case 'year-desc':
        results.sort((a, b) => 
          (b.metadata?.attributes?.year || 0) - (a.metadata?.attributes?.year || 0)
        );
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
      <FilterBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        sortOption={sortOption}
        setSortOption={setSortOption}
        filterLocation={filterLocation}
        setFilterLocation={setFilterLocation}
        places={nfts}
      />
      
      <NFTGrid
        nfts={filteredNfts}
        onToggleHighlight={handleToggleHighlight}
        isLoading={isLoading}
      />
    </div>
  );
};

export default HomePage;