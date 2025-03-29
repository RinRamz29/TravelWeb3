import React from 'react';

const LoadingPlaceholder = () => {
  return (
    <div className="historical-place-card skeleton">
      <div className="card-content">
        <div className="image-container skeleton-image"></div>
        <div className="card-info">
          <div className="skeleton-title"></div>
          <div className="skeleton-text"></div>
          <div className="skeleton-text"></div>
          <div className="skeleton-footer">
            <div className="skeleton-chip"></div>
            <div className="skeleton-chip"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingPlaceholder;
