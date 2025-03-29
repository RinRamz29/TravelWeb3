import React, { useState, useEffect, useMemo } from 'react';
import { useNotification } from '../context/NotificationContext';

const FilterBar = ({ 
  searchTerm, 
  setSearchTerm, 
  sortOption, 
  setSortOption,
  filterLocation,
  setFilterLocation,
  places
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { showInfo } = useNotification();
  
  // Extract unique locations from places data
  const locations = useMemo(() => {
    if (!places || places.length === 0) return [];
    const locationSet = new Set(places.map(place => place.metadata?.attributes?.location).filter(Boolean));
    return Array.from(locationSet).sort();
  }, [places]);
  
  const defaultLocations = [
    'Rome, Italy',
    'Cusco Region, Peru',
    'Giza, Egypt'
  ];

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSortChange = (e) => {
    setSortOption(e.target.value);
  };

  const handleLocationChange = (e) => {
    setFilterLocation(e.target.value);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSortOption('name-asc');
    setFilterLocation('');
    showInfo('Filters cleared');
  };
  
  const toggleFilters = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`filter-bar ${isExpanded ? 'expanded' : ''}`}>
      <div className="filter-row">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search historical places..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm('')}>
              ×
            </button>
          )}
        </div>
        
        <div className="filter-actions">
          <button 
            className="filter-toggle" 
            onClick={toggleFilters}
          >
            Filters {isExpanded ? '▲' : '▼'}
          </button>
          
          <select 
            value={sortOption} 
            onChange={handleSortChange}
            className="sort-select"
          >
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="year-asc">Year (Oldest first)</option>
            <option value="year-desc">Year (Newest first)</option>
          </select>
        </div>
      </div>
      
      {isExpanded && (
        <div className="expanded-filters">
          <div className="filter-group">
            <label>Location</label>
            <select 
              value={filterLocation} 
              onChange={handleLocationChange}
              className="location-select"
            >
              <option value="">All Locations</option>
              {locations.map((location) => (
                <option key={location} value={location} title={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>
          
          {(searchTerm || filterLocation || sortOption !== 'name-asc') && (
            <button className="clear-filters" onClick={clearFilters}>
              Clear All Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterBar;
