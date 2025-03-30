import React, { createContext, useState, useEffect, useContext } from 'react';
import nftService from '../services/nftService';
import authService from '../services/authService';
import { useAuth } from './AuthContext';

// Create the context
const CustodianContext = createContext({
  isCustodian: false,
  isLoading: true,
  checkCustodianStatus: () => {},
});

// Create the provider component
export const CustodianProvider = ({ children }) => {
  const [isCustodian, setIsCustodian] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  const checkCustodianStatus = async () => {
    if (!authService.isAuthenticated) {
      setIsCustodian(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const custodianStatus = await nftService.isCustodian();
      setIsCustodian(custodianStatus);
    } catch (error) {
      console.error('Error checking custodian status:', error);
      setIsCustodian(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Check custodian status when auth state changes
  useEffect(() => {
    // Check custodian status whenever authentication state changes
    if (isAuthenticated !== undefined) {
      checkCustodianStatus();
    }
  }, [isAuthenticated]);

  const value = {
    isCustodian,
    isLoading,
    checkCustodianStatus,
  };

  return (
    <CustodianContext.Provider value={value}>
      {children}
    </CustodianContext.Provider>
  );
};

// Custom hook to use the custodian context
export const useCustodian = () => {
  const context = useContext(CustodianContext);
  if (context === undefined) {
    throw new Error('useCustodian must be used within a CustodianProvider');
  }
  return context;
};

export default CustodianContext;
