// components/CategoryTabs.js
import React from 'react';

const CategoryTabs = ({ categories, activeCategory, onCategoryChange }) => {
  // Format category names for display
  const formatCategoryName = (category) => {
    if (category === 'all') return 'All Items';
    if (category === 'owned') return 'My Items';
    
    // Capitalize first letter and replace hyphens with spaces
    return category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  return (
    <div className="category-tabs">
      {categories.map((category) => (
        <div 
          key={category}
          className={`category-tab ${activeCategory === category ? 'active' : ''}`}
          onClick={() => onCategoryChange(category)}
        >
          {formatCategoryName(category)}
        </div>
      ))}
    </div>
  );
};

export default CategoryTabs;