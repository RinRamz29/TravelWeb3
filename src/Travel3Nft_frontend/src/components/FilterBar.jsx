import React, { useMemo, useCallback } from 'react';
// Import helpers correctly - two alternative approaches
// Option 1: Import specific functions
import { debounce } from '../utils/helpers';

const FilterBar = ({
  searchTerm,
  setSearchTerm,
  sortOption,
  setSortOption,
  filterLocation,
  setFilterLocation,
  places
}) => {
  // Extract unique locations from NFTs for the dropdown
  const uniqueLocations = useMemo(() => {
    if (!places || places.length === 0) return [];
    
    const locationsSet = new Set();
    
    places.forEach(place => {
      if (place.metadata?.attributes?.location) {
        locationsSet.add(place.metadata.attributes.location);
      }
    });
    
    return Array.from(locationsSet).sort();
  }, [places]);

  // Create debounced search handler to prevent too many re-renders
  // Fallback implementation in case the helper isn't available
  const createDebounceFn = (fn, delay) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), delay);
    };
  };
  
  // Create debounced search handler to prevent too many re-renders
  const handleSearchChange = useCallback(
    createDebounceFn((e) => setSearchTerm(e.target.value), 300),
    [setSearchTerm]
  );

  return (
    <div className="card mb-4">
      <div className="card-body">
        <div className="row g-3">
          {/* Search input */}
          <div className="col-md-4">
            <label htmlFor="search" className="form-label">Search</label>
            <div className="input-group">
              <span className="input-group-text">
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                className="form-control"
                id="search"
                placeholder="Search by name or location..."
                defaultValue={searchTerm}
                onChange={handleSearchChange}
              />
              {searchTerm && (
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={() => setSearchTerm('')}
                >
                  <i className="bi bi-x"></i>
                </button>
              )}
            </div>
          </div>
          
          {/* Location filter dropdown */}
          <div className="col-md-4">
            <label htmlFor="location" className="form-label">Location</label>
            <select
              className="form-select"
              id="location"
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
            >
              <option value="">All Locations</option>
              {uniqueLocations.map(location => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>
          
          {/* Sort options dropdown */}
          <div className="col-md-4">
            <label htmlFor="sort" className="form-label">Sort By</label>
            <select
              className="form-select"
              id="sort"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
            >
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="year-asc">Year (Oldest First)</option>
              <option value="year-desc">Year (Newest First)</option>
            </select>
          </div>
        </div>
        
        {/* Active filters display */}
        {(searchTerm || filterLocation) && (
          <div className="mt-3">
            <small className="text-muted">Active filters:</small>
            <div className="d-flex flex-wrap gap-2 mt-1">
              {searchTerm && (
                <span className="badge bg-light text-dark">
                  Search: {searchTerm}
                  <button
                    type="button"
                    className="btn-close ms-2"
                    style={{ fontSize: '0.5rem' }}
                    onClick={() => setSearchTerm('')}
                  ></button>
                </span>
              )}
              
              {filterLocation && (
                <span className="badge bg-light text-dark">
                  Location: {filterLocation}
                  <button
                    type="button"
                    className="btn-close ms-2"
                    style={{ fontSize: '0.5rem' }}
                    onClick={() => setFilterLocation('')}
                  ></button>
                </span>
              )}
              
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => {
                  setSearchTerm('');
                  setFilterLocation('');
                }}
              >
                Clear All
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterBar;