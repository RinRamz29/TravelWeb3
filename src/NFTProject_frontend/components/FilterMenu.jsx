// components/FilterMenu.js
import React, { useState } from 'react';

const FilterMenu = ({ sortBy, onSortChange, viewMode, onViewModeChange }) => {
  const [showSortMenu, setShowSortMenu] = useState(false);
  
  const sortOptions = [
    { value: 'recent', label: 'Recently Added' },
    { value: 'oldest', label: 'Oldest' },
    { value: 'name', label: 'Name' },
    { value: 'views', label: 'Most Viewed' }
  ];
  
  const handleSortClick = () => {
    setShowSortMenu(!showSortMenu);
  };
  
  const handleSortSelect = (option) => {
    onSortChange(option);
    setShowSortMenu(false);
  };
  
  return (
    <div className="filter-menu">
      <div className="filter-group">
        <div className="filter-button">
          <i className="fas fa-filter"></i>
          <span>Filter</span>
        </div>
        
        <div className="sort-dropdown">
          <div className="filter-button" onClick={handleSortClick}>
            <i className="fas fa-sort"></i>
            <span>Sort by: {sortOptions.find(opt => opt.value === sortBy)?.label}</span>
            <i className={`fas fa-chevron-${showSortMenu ? 'up' : 'down'}`} style={{ marginLeft: '8px' }}></i>
          </div>
          
          {showSortMenu && (
            <div className="sort-menu">
              {sortOptions.map((option) => (
                <div 
                  key={option.value}
                  className={`sort-option ${sortBy === option.value ? 'selected' : ''}`}
                  onClick={() => handleSortSelect(option.value)}
                >
                  {option.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="view-toggle">
        <div 
          className={`view-option ${viewMode === 'grid' ? 'active' : ''}`}
          onClick={() => onViewModeChange('grid')}
        >
          <i className="fas fa-th"></i>
        </div>
        <div 
          className={`view-option ${viewMode === 'list' ? 'active' : ''}`}
          onClick={() => onViewModeChange('list')}
        >
          <i className="fas fa-list"></i>
        </div>
      </div>
    </div>
  );
};

export default FilterMenu;
