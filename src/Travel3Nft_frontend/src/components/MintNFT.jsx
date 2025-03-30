import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import nftService from '../services/nftService';

const MintNFT = () => {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [year, setYear] = useState('');
  const [coordinates, setCoordinates] = useState('');
  const [historicalPeriod, setHistoricalPeriod] = useState('');
  const [culturalSignificance, setCulturalSignificance] = useState('');
  const [architecturalStyle, setArchitecturalStyle] = useState('');
  const [description, setDescription] = useState('');
  const [mainImage, setMainImage] = useState(null);
  const [document, setDocument] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fileInputRef = useRef(null);

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
      // Upload the image file first
      let mainImageUrl = '';
      let documentUrl = '';

      if (mainImage) {
        mainImageUrl = await nftService.uploadFile(mainImage);
      }

      if (document) {
        documentUrl = await nftService.uploadFile(document);
      }

      // Prepare metadata for minting
      const metadata = {
        name,
        location,
        year,
        description,
        coordinates,
        collection: 'Travel3 Historical Places',
        category: 'Historical',
        historicalPeriod,
        culturalSignificance,
        architecturalStyle,
        mainImageUrl,
        mainImageType: mainImage ? mainImage.type : 'image/jpeg',
        documentUrl,
        documentType: document ? document.type : 'application/pdf',
      };

      const result = await nftService.mintNFT(metadata);
      showSuccess(`Non-Fungible Token minted successfully! Token ID: ${result.tokenId}`);
      // Reset form
      setName('');
      setLocation('');
      setYear('');
      setDescription('');
      setCoordinates('');
      setHistoricalPeriod('');
      setCulturalSignificance('');
      setArchitecturalStyle('');
      setMainImage(null);
      setDocument(null);
    } catch (error) {
      showError(`Error minting Non-Fungible Token: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      setMainImage(event.target.files[0]);
    }
  };

  const handleDocumentChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      setDocument(event.target.files[0]);
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
        <input
          type="text"
          placeholder="Coordinates (e.g., 40.7128° N, 74.0060° W)"
          value={coordinates}
          onChange={(event) => setCoordinates(event.target.value)}
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Historical Period"
          value={historicalPeriod}
          onChange={(event) => setHistoricalPeriod(event.target.value)}
        />
        <textarea
          placeholder="Cultural Significance"
          value={culturalSignificance}
          onChange={(event) => setCulturalSignificance(event.target.value)}
        />
        <input
          type="text"
          placeholder="Architectural Style"
          value={architecturalStyle}
          onChange={(event) => setArchitecturalStyle(event.target.value)}
        />

        <div className="file-upload">
          <label>Main Image:</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            required
          />
          {mainImage && (
            <div className="preview">
              <img src={URL.createObjectURL(mainImage)} alt="Preview" width="100" />
              <span>{mainImage.name}</span>
            </div>
          )}
        </div>

        <input
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleDocumentChange}
          placeholder="Historical Document (optional)"
        />
        {document && <div className="document-preview">{document.name}</div>}

        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Minting...' : 'Mint Non-Fungible Token'}
        </button>
      </form>
    </div>
  );
};

export default MintNFT;
