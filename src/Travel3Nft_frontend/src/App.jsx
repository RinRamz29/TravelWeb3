import { useState, useEffect } from 'react';
import nftService from './services/nftService';
import HistoricalPlaceCard from './components/HistoricalPlaceCard';
import ErrorBoundary from './components/ErrorBoundary';
import Header from './components/Header';
import { useNotification } from './context/NotificationContext';
import LoadingPlaceholder from './components/LoadingPlaceholder';
import FilterBar from './components/FilterBar';

function App() {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filteredPlaces, setFilteredPlaces] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('name-asc');
  const [filterLocation, setFilterLocation] = useState('');
  const { showError, showSuccess } = useNotification();

  useEffect(() => {
    setLoading(true);
    nftService.getAllTokens()
      .then((tokens) => {
        setPlaces(tokens);
        setFilteredPlaces(tokens);
        showSuccess(`Loaded ${tokens.length} historical places`);
        setLoading(false);
      })
      .catch((err) => {
        showError('Failed to load NFTs: ' + err.message);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let result = [...places];
    
    // Apply search filter
    if (searchTerm) {
      result = result.filter(place => 
        place.metadata?.attributes?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        place.metadata?.attributes?.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply location filter
    if (filterLocation) {
      result = result.filter(place => 
        place.metadata?.attributes?.location?.toLowerCase().includes(filterLocation.toLowerCase())
      );
    }
    
    // Apply sorting
    result = sortPlaces(result, sortOption);
    
    setFilteredPlaces(result);
  }, [places, searchTerm, sortOption, filterLocation]);
  
  const sortPlaces = (placesToSort, option) => {
    return [...placesToSort].sort((a, b) => {
      const nameA = a.metadata?.attributes?.name || '';
      const nameB = b.metadata?.attributes?.name || '';
      const yearA = a.metadata?.attributes?.year || '';
      const yearB = b.metadata?.attributes?.year || '';
      
      if (option === 'name-asc') return nameA.localeCompare(nameB);
      if (option === 'name-desc') return nameB.localeCompare(nameA);
      if (option === 'year-asc') return yearA.localeCompare(yearB);
      if (option === 'year-desc') return yearB.localeCompare(yearA);
      return 0;
    });
  };

  return (
    <div className="app">
      <Header />
      <main>
        <div className="container">
          {/* Test component to verify Identity import */}
          
          <h1>Historical Places NFT Collection</h1>
          <FilterBar 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            sortOption={sortOption}
            setSortOption={setSortOption}
            filterLocation={filterLocation}
            setFilterLocation={setFilterLocation}
            places={places}
          />
          {error && <div className="error-message">{error}</div>}
          <ErrorBoundary>
            <div className="places-grid">
              {loading ? (
                Array(6).fill().map((_, index) => (
                  <LoadingPlaceholder key={index} />
                ))
              ) : filteredPlaces.length > 0 ? (
                filteredPlaces.map((place) => (
                  <HistoricalPlaceCard key={place.index} place={place} />
                ))
              ) : (
                <div className="no-results">No historical places found matching your criteria</div>
              )}
            </div>
          </ErrorBoundary>
        </div>
      </main>
      <footer>
        <div className="container">
          <p>&copy; {new Date().getFullYear()} Travel3 NFT Collection. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
