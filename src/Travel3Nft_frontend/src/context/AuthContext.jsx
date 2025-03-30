import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
// Use named import to avoid circular dependency
import { authService } from '../services/authService';
import { useNotification } from './NotificationContext';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [principal, setPrincipal] = useState(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const { showError } = useNotification();

  const initAuth = useCallback(async () => {
    setIsLoading(true);
    try {
      // Check if initialize method exists before calling it
      if (authService && typeof authService.initialize === 'function') {
        console.log("Initializing auth service...");
        await authService.initialize();
      } else {
        console.warn("Auth service initialize method not available");
        // You might want to have a fallback here
      }
      
      // Only proceed if authClient exists or isLoggedIn method is available
      if (authService && typeof authService.isLoggedIn === 'function') {
        const authenticated = await authService.isLoggedIn();
        setIsAuthenticated(authenticated);
        console.log("Auth initialized, authenticated:", authenticated);
        
        if (authenticated && typeof authService.getLoggedInPrincipal === 'function') {
          const principal = authService.getLoggedInPrincipal();
          if (principal) {
            setPrincipal(principal);
            console.log("Principal set during init:", principal.toString());
          }
        }
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      showError('Failed to initialize authentication');
    } finally {
      setIsLoading(false);
      setAuthInitialized(true);
    }
  }, [showError]);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const login = async () => {
    try {
      const success = await authService.login();
      console.log("Login result:", success ? "success" : "failed");
      
      if (success) {
        setIsAuthenticated(true);
        const userPrincipal = authService.getLoggedInPrincipal();
        console.log("Setting principal after login:", userPrincipal.toString());
        setPrincipal(userPrincipal);
      } else {
        console.log("Login did not return success");
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
      // No need to reload here as authService.logout() already does that
    } catch (error) {
      console.error('Logout error:', error);
      showError('Logout failed. Please try again.');
    }
  };

  const value = {
    isAuthenticated,
    isLoading,
    principal,
    authInitialized,
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