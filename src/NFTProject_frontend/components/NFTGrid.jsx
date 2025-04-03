// components/NFTGrid.js
import React, { useState, useEffect } from 'react';
import NFTCard from './NFTCard';

const NFTGrid = ({ nfts, onSelect, nftActor, principal }) => {
  const [nftsWithThumbnails, setNftsWithThumbnails] = useState([]);
  
  useEffect(() => {
    const fetchThumbnails = async () => {
      if (!nfts.length || !nftActor || !principal) return;
      
      const updatedNfts = await Promise.all(
        nfts.map(async (nft) => {
          try {
            const result = await nftActor.retriveThumbnailSrc(nft.index, principal);
            if (result.Ok && result.Ok.ContentSrc && result.Ok.ContentSrc[0]) {
              return { ...nft, thumbnailSrc: result.Ok.ContentSrc[0] };
            }
            return nft;
          } catch (error) {
            console.error(`Error fetching thumbnail for NFT ${nft.index}:`, error);
            return nft;
          }
        })
      );
      
      setNftsWithThumbnails(updatedNfts);
    };
    
    fetchThumbnails();
  }, [nfts, nftActor, principal]);
  
  return (
    <div className="nft-grid">
      {nftsWithThumbnails.map((nft) => (
        <NFTCard key={nft.index} nft={nft} onClick={() => onSelect(nft)} />
      ))}
    </div>
  );
};

export default NFTGrid;