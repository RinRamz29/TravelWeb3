import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import nftService from '../services/nftService';

const MintNFT = () => {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [year, setYear] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { isAuthenticated } = useAuth();
  const { showSuccess, showError } = useNotification();

  const handleMint = async (event) => {
    event.preventDefault();
    if (!isAuthenticated) {
      showError('Please connect your wallet to mint an Non-Fungible Token');
      return;
    }

    setIsLoading(true);
    try {
      const metadata = {
        tokenIdentifier: `place_${Date.now()}`,
        mainImageType: 'image/jpeg',
        mainImageLocation: { icp: imageUrl, ipfs: '' },
        documentType: 'application/pdf',
        documentLocation: { icp: documentUrl, ipfs: '' },
        attributes: {
          name,
          location,
          year,
          description,
          coordinates: '', // You might want to add this field to your form
          collection: 'Travel3 Historical Places',
          category: 'Historical',
          historicalPeriod: '', // You might want to add this field to your form
          culturalSignificance: '', // You might want to add this field to your form
          architecturalStyle: null, // You might want to add this field to your form
        },
      };

      const result = await nftService.mintNFT(metadata);
      showSuccess(`Non-Fungible Token minted successfully! Token ID: ${result.tokenId}`);
      // Reset form
      setName('');
      setLocation('');
      setYear('');
      setDescription('');
      setImageUrl('');
      setDocumentUrl('');
    } catch (error) {
      showError(`Error minting Non-Fungible Token: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mint-nft">
      <h2>Mint a New Historical Place Non-Fungible Token</h2>
      <form onSubmit={handleMint}>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Location"
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Year"
          value={year}
          onChange={(event) => setYear(event.target.value)}
          required
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          required
        />
        <input
          type="url"
          placeholder="Image URL"
          value={imageUrl}
          onChange={(event) => setImageUrl(event.target.value)}
          required
        />
        <input
          type="url"
          placeholder="Document URL"
          value={documentUrl}
          onChange={(event) => setDocumentUrl(event.target.value)}
          required
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Minting...' : 'Mint Non-Fungible Token'}
        </button>
      </form>
    </div>
  );
};

export default MintNFT;
