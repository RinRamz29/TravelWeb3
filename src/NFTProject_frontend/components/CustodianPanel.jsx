// components/CustodianPanel.js
import React, { useState, useEffect } from 'react';
import CustodianMint from './CustodianMint';

const CustodianPanel = ({ nftActor, principal }) => {
  const [isCustodian, setIsCustodian] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('mint');
  const [stats, setStats] = useState({
    totalNfts: 0,
    totalViews: 0
  });
  
  // Check if the connected user is a custodian
  useEffect(() => {
    const checkCustodianStatus = async () => {
      if (!nftActor || !principal) {
        setLoading(false);
        return;
      }
      
      try {
        const custodians = await nftActor.who_are_custodians();
        const isUserCustodian = custodians.some(custodian => 
          custodian.toString() === principal.toString()
        );
        setIsCustodian(isUserCustodian);
        
        if (isUserCustodian) {
          // Fetch stats
          const totalSupply = await nftActor.totalSupply();
          const accessCount = await nftActor.getAllTokensTotalAccessAmount();
          
          setStats({
            totalNfts: Number(totalSupply),
            totalViews: accessCount.Ok?.AccessTimes ? Number(accessCount.Ok.AccessTimes) : 0
          });
        }
      } catch (error) {
        console.error("Failed to check custodian status:", error);
      } finally {
        setLoading(false);
      }
    };
    
    checkCustodianStatus();
  }, [nftActor, principal]);
  
  if (loading) {
    return (
      <div className="custodian-panel loading">
        <div className="spinner"></div>
        <p>Loading custodian panel...</p>
      </div>
    );
  }
  
  if (!isCustodian) {
    return (
      <div className="custodian-panel not-authorized">
        <h3>Custodian Access Required</h3>
        <p>You need to be a custodian to access this panel.</p>
        <p>Please contact the collection owner for access.</p>
      </div>
    );
  }
  
  return (
    <div className="custodian-container">
      <div className="custodian-header">
        <h2>Custodian Management Panel</h2>
        <div className="stats-cards">
          <div className="stat-card">
            <div className="stat-value">{stats.totalNfts}</div>
            <div className="stat-label">Total NFTs</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.totalViews}</div>
            <div className="stat-label">Total Views</div>
          </div>
        </div>
      </div>
      
      <div className="custodian-tabs">
        <div 
          className={`custodian-tab ${activeTab === 'mint' ? 'active' : ''}`}
          onClick={() => setActiveTab('mint')}
        >
          Mint New NFT
        </div>
        <div 
          className={`custodian-tab ${activeTab === 'manage' ? 'active' : ''}`}
          onClick={() => setActiveTab('manage')}
        >
          Manage Existing NFTs
        </div>
        <div 
          className={`custodian-tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          Analytics
        </div>
      </div>
      
      <div className="custodian-tab-content">
        {activeTab === 'mint' && (
          <CustodianMint nftActor={nftActor} principal={principal} />
        )}
        
        {activeTab === 'manage' && (
          <div className="custodian-panel">
            <h3>Manage Existing NFTs</h3>
            <p>This feature will allow you to update metadata and content for existing NFTs.</p>
            <p className="coming-soon">Coming soon...</p>
          </div>
        )}
        
        {activeTab === 'analytics' && (
          <div className="custodian-panel">
            <h3>NFT Analytics</h3>
            <p>This feature will show detailed analytics about your NFT collection.</p>
            <p className="coming-soon">Coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustodianPanel;