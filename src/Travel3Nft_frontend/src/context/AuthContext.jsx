import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import authService from '../services/authService';
import { useNotification } from './NotificationContext';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [principal, setPrincipal] = useState(null); 
  const { showError } = useNotification();

  const initAuth = useCallback(async () => {
    setIsLoading(true);
    try {
      const authenticated = await authService.initialize();
      setIsAuthenticated(authenticated);
      if (authenticated) {
        setPrincipal(authService.getPrincipal());
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      showError('Failed to initialize authentication');
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const login = async () => {
    try {
      const success = await authService.login();
      if (success) {
        setIsAuthenticated(true);
        setPrincipal(authService.getPrincipal());
      }
    } catch (error) {
      console.error('Login error:', error);
      showError('Login failed. Please try again.');
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setIsAuthenticated(false);
      setPrincipal(null);
    } catch (error) {
      console.error('Logout error:', error); 
      showError('Logout failed. Please try again.');
    }
  };

  const value = {
    isAuthenticated,
    isLoading,
    principal, 
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
