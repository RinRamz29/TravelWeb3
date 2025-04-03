// App.js - Complete file with custodian integration
import React, { useState, useEffect } from 'react';
import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { idlFactory } from '../declarations/nft/nft.did';
import './App.scss';

// Components
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import NFTGrid from '../components/NFTGrid';
import NFTDetail from '../components/NFTDetail';
import LoginModal from '../components/LoginModal';
import Footer from '../components/Footer';
import CollectionBanner from '../components/CollectionBanner';
import CategoryTabs from '../components/CategoryTabs';
import FilterMenu from '../components/FilterMenu';
import CustodianPanel from '../components/CustodianPanel';

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [principal, setPrincipal] = useState(null);
  const [nftActor, setNftActor] = useState(null);
  const [nfts, setNfts] = useState([]);
  const [selectedNft, setSelectedNft] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [metadata, setMetadata] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState('browse'); // 'browse' or 'custodian'
  const [isCustodian, setIsCustodian] = useState(false);

  // Canister ID - replace with your deployed canister ID
  const CANISTER_ID = 'bd3sg-teaaa-aaaaa-qaaba-cai';

  // Initialize connection to IC
  useEffect(() => {
    const initConnection = async () => {
      try {
        const isLocalEnv = window.location.hostname === 'localhost' ||
          window.location.hostname.includes('127.0.0.1');

        const host = isLocalEnv ? 'http://localhost:4943' : 'https://ic0.app';

        const agent = new HttpAgent({ host });

        // IMPORTANT: Fetch root key in local environment
        if (isLocalEnv) {
          await agent.fetchRootKey();
        }

        const actor = Actor.createActor(idlFactory, {
          agent,
          canisterId: CANISTER_ID,
        });

        setNftActor(actor);

        // Check for previous authentication
        const wasConnected = localStorage.getItem('isConnected') === 'true';
        const storedPrincipalId = localStorage.getItem('principalId');
        const wasCustodian = localStorage.getItem('isCustodian') === 'true';

        if (wasConnected && storedPrincipalId) {
          // Create Principal from stored string
          try {
            const userPrincipal = Principal.fromText(storedPrincipalId);
            setPrincipal(userPrincipal);
            setIsConnected(true);
            setIsCustodian(wasCustodian);

            // Re-auth is needed for actual operations, but the UI can reflect logged-in state
          } catch (e) {
            // Invalid principal stored, clear values
            localStorage.removeItem('isConnected');
            localStorage.removeItem('principalId');
            localStorage.removeItem('isCustodian');
          }
        }

        // Fetch collection metadata
        try {
          const metadata = await actor.getMetadata();
          setMetadata(metadata);
        } catch (err) {
          console.error("Failed to fetch metadata:", err);
        }

        setLoading(false);
      } catch (error) {
        console.error("Failed to initialize connection:", error);
        setLoading(false);
      }
    };

    initConnection();
  }, []);

  // Connect wallet
  const connectWallet = async (identity) => {
    try {
      // Create a local agent with the right host and fetch root key
      const isLocalEnv = window.location.hostname === 'localhost' ||
        window.location.hostname.includes('127.0.0.1');

      const host = isLocalEnv ? 'http://localhost:4943' : 'https://ic0.app';

      const agent = new HttpAgent({
        host,
        identity
      });

      // IMPORTANT: Fetch root key in local environment
      if (isLocalEnv) {
        await agent.fetchRootKey();
      }

      const actor = Actor.createActor(idlFactory, {
        agent,
        canisterId: CANISTER_ID,
      });

      const userPrincipal = identity.getPrincipal();
      setPrincipal(userPrincipal);
      setNftActor(actor);
      setIsConnected(true);

      // Store authentication in localStorage to persist through reloads
      localStorage.setItem('isConnected', 'true');
      localStorage.setItem('principalId', userPrincipal.toString());

      // Check if user is a custodian
      const custodians = await actor.who_are_custodians();
      const custodianStatus = custodians.some(custodian =>
        custodian.toString() === userPrincipal.toString()
      );
      setIsCustodian(custodianStatus);
      localStorage.setItem('isCustodian', custodianStatus ? 'true' : 'false');

      // Fetch user's NFTs after login
      fetchUserNFTs(actor, userPrincipal);

      setShowLoginModal(false);
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      alert("Failed to connect: " + error.message);
    }
  };

  // Fetch all NFTs
  const fetchAllNFTs = async () => {
    if (!nftActor) return;

    try {
      setLoading(true);
      const tokens = await nftActor.getAllTokens();

      // Sort NFTs based on selected sorting option
      const sorted = sortNFTs(tokens, sortBy);

      setNfts(sorted);
      setActiveCategory('all');
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch NFTs:", error);
      setLoading(false);
    }
  };

  // Fetch user's NFTs
  const fetchUserNFTs = async (actor, userPrincipal) => {
    if (!actor || !userPrincipal) return;

    try {
      setLoading(true);
      const tokens = await actor.getUserTokens(userPrincipal);

      // Sort NFTs based on selected sorting option
      const sorted = sortNFTs(tokens, sortBy);

      setNfts(sorted);
      setActiveCategory('owned');
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch user NFTs:", error);
      setLoading(false);
    }
  };

  // Sort NFTs based on criteria
  const sortNFTs = (tokens, criteria) => {
    let sorted = [...tokens];

    switch (criteria) {
      case 'recent':
        sorted.sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
        break;
      case 'oldest':
        sorted.sort((a, b) => Number(a.timestamp) - Number(b.timestamp));
        break;
      case 'name':
        sorted.sort((a, b) => {
          const nameA = a.metadata?.[0]?.attributes?.name || '';
          const nameB = b.metadata?.[0]?.attributes?.name || '';
          return nameA.localeCompare(nameB);
        });
        break;
      case 'views':
        // This would require fetching view counts for each token
        // For now, just keeping original order
        break;
      default:
        break;
    }

    return sorted;
  };

  // Filter NFTs based on search query and category
  const filterNFTs = () => {
    if (!nfts.length) return [];

    let filtered = [...nfts];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(nft => {
        const name = nft.metadata?.[0]?.attributes?.name || '';
        const location = nft.metadata?.[0]?.attributes?.location || '';
        const year = nft.metadata?.[0]?.attributes?.year?.toString() || '';
        const categories = nft.metadata?.[0]?.attributes?.category || [];

        return name.toLowerCase().includes(query) ||
          location.toLowerCase().includes(query) ||
          year.includes(query) ||
          categories.some(cat => cat.toLowerCase().includes(query));
      });
    }

    // Filter by category (if not 'all' or 'owned')
    if (activeCategory !== 'all' && activeCategory !== 'owned') {
      filtered = filtered.filter(nft => {
        const categories = nft.metadata?.[0]?.attributes?.category || [];
        return categories.some(cat => cat.toLowerCase() === activeCategory.toLowerCase());
      });
    }

    return filtered;
  };

  // View NFT details
  const viewNFTDetail = async (nft) => {
    setSelectedNft(nft);

    // If user is logged in, fetch thumbnail
    if (isConnected && nftActor && principal) {
      try {
        // Retrieve thumbnail
        const thumbnailResult = await nftActor.retriveThumbnailSrc(nft.index, principal);
        if (thumbnailResult.Ok && thumbnailResult.Ok.ContentSrc) {
          const updatedNft = { ...nft, thumbnailSrc: thumbnailResult.Ok.ContentSrc[0] };
          setSelectedNft(updatedNft);
        }
      } catch (error) {
        console.error("Failed to fetch NFT details:", error);
      }
    }
  };

  // Close NFT detail view
  const closeNFTDetail = () => {
    setSelectedNft(null);
  };

  // Handle category change
  const handleCategoryChange = (category) => {
    setActiveCategory(category);

    if (category === 'owned' && isConnected && principal) {
      fetchUserNFTs(nftActor, principal);
    } else if (category === 'all') {
      fetchAllNFTs();
    }
  };

  // Handle sort change
  const handleSortChange = (sortOption) => {
    setSortBy(sortOption);
    setNfts(sortNFTs([...nfts], sortOption));
  };

  // Handle search input
  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  // Switch between browse and custodian view
  const switchView = (view) => {
    setActiveView(view);
    if (view === 'browse') {
      fetchAllNFTs();
    }
  };

  // Logout
  const disconnect = () => {
    setPrincipal(null);
    setIsConnected(false);
    setIsCustodian(false);
    setNfts([]);
    setActiveView('browse');

    // Clear stored authentication data
    localStorage.removeItem('isConnected');
    localStorage.removeItem('principalId');
    localStorage.removeItem('isCustodian');

    // Reinitialize with anonymous actor
    const isLocalEnv = window.location.hostname === 'localhost' ||
      window.location.hostname.includes('127.0.0.1');

    const host = isLocalEnv ? 'http://localhost:4943' : 'https://ic0.app';

    const agent = new HttpAgent({ host });

    // Fetch root key in local env
    if (isLocalEnv) {
      agent.fetchRootKey().catch(e => {
        console.error("Could not fetch root key:", e);
      });
    }

    const actor = Actor.createActor(idlFactory, {
      agent,
      canisterId: CANISTER_ID,
    });
    setNftActor(actor);
  };
  // Get unique categories from NFTs
  const getUniqueCategories = () => {
    const categories = new Set(['all']);

    if (isConnected) {
      categories.add('owned');
    }

    nfts.forEach(nft => {
      const nftCategories = nft.metadata?.[0]?.attributes?.category || [];
      nftCategories.forEach(category => {
        categories.add(category.toLowerCase());
      });
    });

    return Array.from(categories);
  };

  return (
    <div className="app">
      <Sidebar
        activeView={activeView}
        onViewChange={switchView}
        isCustodian={isCustodian}
        isConnected={isConnected}
      />

      <div className="main-with-sidebar">
        <Navbar
          isConnected={isConnected}
          principal={principal}
          onConnect={() => setShowLoginModal(true)}
          onDisconnect={disconnect}
          metadata={metadata}
          onSearch={handleSearch}
          searchQuery={searchQuery}
          isCustodian={isCustodian}
          activeView={activeView}
          onViewChange={switchView}
        />

        <main className="main-content">
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>Loading...</p>
            </div>
          ) : activeView === 'custodian' ? (
            <CustodianPanel
              nftActor={nftActor}
              principal={principal}
              onNftMinted={fetchAllNFTs}
            />
          ) : selectedNft ? (
            <NFTDetail
              nft={selectedNft}
              onClose={closeNFTDetail}
              nftActor={nftActor}
              isConnected={isConnected}
              principal={principal}
            />
          ) : (
            <>
              <CollectionBanner metadata={metadata} />

              <div className="featured-section">
                <h2>Historical Places Collection</h2>
                <p>Discover and collect historical landmarks and monuments from around the world as NFTs, with exclusive documentation and high-resolution photographs.</p>

                {isCustodian && (
                  <button
                    className="btn primary custodian-button"
                    onClick={() => switchView('custodian')}
                  >
                    <i className="fas fa-plus-circle"></i>
                    Mint New Historical Place
                  </button>
                )}
              </div>

              <CategoryTabs
                categories={getUniqueCategories()}
                activeCategory={activeCategory}
                onCategoryChange={handleCategoryChange}
              />

              <FilterMenu
                sortBy={sortBy}
                onSortChange={handleSortChange}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
              />

              <NFTGrid
                nfts={filterNFTs()}
                onSelect={viewNFTDetail}
                nftActor={nftActor}
                principal={principal}
                viewMode={viewMode}
              />

              {filterNFTs().length === 0 && (
                <div className="empty-state">
                  {searchQuery ? (
                    <>
                      <h3>No matching NFTs found</h3>
                      <p>Try using different search terms or filters</p>
                    </>
                  ) : (
                    <>
                      <h3>No NFTs to display</h3>
                      <p>Browse all NFTs to explore the collection</p>
                      <button className="btn primary" onClick={fetchAllNFTs} style={{ marginTop: 16 }}>
                        Browse All NFTs
                      </button>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </main>

        <Footer metadata={metadata} />
      </div>

      {showLoginModal && (
        <LoginModal
          onLogin={connectWallet}
          onClose={() => setShowLoginModal(false)}
        />
      )}
    </div>
  );
}

export default App;