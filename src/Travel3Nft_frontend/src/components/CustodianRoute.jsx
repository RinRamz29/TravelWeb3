import React from 'react';
import { Navigate } from 'react-router-dom';
import { useCustodian } from '../context/CustodianContext';

/**
 * A component that protects routes that should only be accessible to custodians.
 * If the user is not a custodian, they will be redirected to the specified path.
 */
const CustodianRoute = ({ children, redirectTo = '/' }) => {
  const { isCustodian, isLoading } = useCustodian();

  // While checking custodian status, show a loading indicator
  if (isLoading) {
    return (
      <div className="custodian-check-loading">
        <div className="spinner"></div>
        <p>Verifying permissions...</p>
      </div>
    );
  }

  // If user is not a custodian, redirect to the specified path
  if (!isCustodian) {
    return <Navigate to={redirectTo} replace />;
  }

  // If user is a custodian, render the children
  return children;
};

export default CustodianRoute;