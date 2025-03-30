import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import MintNFT from './components/MintNFT';
import Header from './components/Header';
import CreateNFT from './components/CreateNFT';
import HomePage from './components/HomePage';
import PlaceDetails from './components/PlaceDetails';
import MyNFTs from './components/MyNFTs';

const App = () => {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <div className="app">
            <Header />
            <div className="content">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/place/:id" element={<PlaceDetails />} />
                <Route path="/create-nft" element={<CreateNFT />} />
                <Route path="/mint" element={<MintNFT />} />
                <Route path="/my-nfts" element={<MyNFTs />} />
              </Routes>
            </div>
          </div>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
};

export default App;
