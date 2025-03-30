import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import MintNFT from './components/MintNFT';
import Header from './components/Header';
import HomePage from './components/HomePage';
import PlaceDetails from './components/PlaceDetails';
import MyNFTs from './components/MyNFTs';

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <div className="app">
          <Header />
          <div className="content">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/place/:id" element={<PlaceDetails />} />
              <Route path="/mint" element={<MintNFT />} />
              <Route path="/my-nfts" element={<MyNFTs />} />
              <Route path="*" element={<div>Page Not Found</div>} />
            </Routes>
          </div>
        </div>
      </AuthProvider>
    </Router>
  );
};

export default App;
