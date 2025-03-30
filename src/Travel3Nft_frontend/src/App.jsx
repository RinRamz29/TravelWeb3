import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CustodianProvider } from './context/CustodianContext';
import { NotificationProvider } from './context/NotificationContext';
import Header from './components/Header';
import PlaceDetails from './components/PlaceDetails';
import MyNFTs from './components/MyNFTs';
import CreateNFT from './components/CreateNFT';
import CustodianRoute from './components/CustodianRoute';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingPlaceholder from './components/LoadingPlaceholder';
import HomePage from './components/HomePage'; // Import the new HomePage component

const App = () => {
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Simulate loading data
    setTimeout(() => setLoading(false), 2000);
  }, []);
  
  return (
    <AuthProvider>
      <Router>
        <CustodianProvider>
          <NotificationProvider>
            <div className="app">
              <Header />
              <main className="main-content">
                <div className="container">
                  {loading ? (
                    <LoadingPlaceholder />
                  ) : (
                    <ErrorBoundary>
                      <Routes>
                        {/* Add the HomePage component as the default route */}
                        <Route path="/" element={<HomePage />} />
                        <Route path="/place/:id" element={<PlaceDetails />} />
                        <Route path="/my-nfts" element={<MyNFTs />} />
                        <Route path="/create-nft" element={<CustodianRoute><CreateNFT /></CustodianRoute>} />
                      </Routes>
                    </ErrorBoundary>
                  )}
                </div>
              </main>
            </div>
          </NotificationProvider>
        </CustodianProvider>
      </Router>
    </AuthProvider>
  );
};

export default App;