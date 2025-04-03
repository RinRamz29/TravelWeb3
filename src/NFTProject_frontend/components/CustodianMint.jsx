// components/CustodianMint.js
import React, { useState, useEffect } from 'react';
import { Principal } from '@dfinity/principal';

const CustodianMint = ({ nftActor, principal }) => {
  const [isCustodian, setIsCustodian] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    year: '',
    location: '',
    coordinates: '',
    categories: '',
    significance: '',
    tokenId: '',
    photoUrl: '',
    thumbnailUrl: '',
    documentUrl: '',
    iv: '',
    privateKey: ''
  });
  
  // Check if the connected user is a custodian
  useEffect(() => {
    const checkCustodianStatus = async () => {
      if (!nftActor || !principal) return;
      
      try {
        setLoading(true);
        const custodians = await nftActor.who_are_custodians();
        const isUserCustodian = custodians.some(custodian => 
          custodian.toString() === principal.toString()
        );
        setIsCustodian(isUserCustodian);
      } catch (error) {
        console.error("Failed to check custodian status:", error);
        setMessage({
          type: 'error',
          text: 'Error checking custodian status. Please try again.'
        });
      } finally {
        setLoading(false);
      }
    };
    
    checkCustodianStatus();
  }, [nftActor, principal]);
  
  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!nftActor || !principal) {
      setMessage({
        type: 'error',
        text: 'Connection to the Internet Computer is required.'
      });
      return;
    }
    
    try {
      setSubmitting(true);
      setMessage(null);
      
      // Parse categories and year
      const categoriesArray = formData.categories
        .split(',')
        .map(cat => cat.trim())
        .filter(cat => cat !== '');
      
      const yearNum = parseInt(formData.year, 10);
      
      // Mint the NFT
      const mintResult = await nftActor.mint(
        principal, // mint to the current user
        [{
          tokenIdentifier: formData.tokenId,
          photoType: '.jpg',
          photoLocation: {
            icp: formData.photoUrl,
            ipfs: `ipfs://placeholder/${formData.tokenId}-photo`
          },
          thumbnailType: '.jpg',
          thumbnailLocation: {
            icp: formData.thumbnailUrl,
            ipfs: `ipfs://placeholder/${formData.tokenId}-thumbnail`
          },
          documentType: '.pdf',
          documentLocation: {
            icp: formData.documentUrl,
            ipfs: `ipfs://placeholder/${formData.tokenId}-document`
          },
          attributes: {
            name: formData.name,
            year: yearNum,
            location: formData.location,
            coordinates: formData.coordinates ? [formData.coordinates] : [],
            category: categoriesArray,
            significance: formData.significance
          }
        }]
      );
      
      // Handle mint result
      if ('Err' in mintResult) {
        throw new Error(`Minting failed: ${JSON.stringify(mintResult.Err)}`);
      }
      
      const tokenIndex = mintResult.Ok[0];
      
      // Set source URLs
      await nftActor.setThumbnailSrc(tokenIndex, formData.thumbnailUrl);
      await nftActor.setPhotoSrc(tokenIndex, formData.photoUrl);
      await nftActor.setDocumentSrc(tokenIndex, formData.documentUrl);
      
      // Set decryption key if provided
      if (formData.iv && formData.privateKey) {
        await nftActor.setDecryptionKey(tokenIndex, formData.iv, formData.privateKey);
      }
      
      setMessage({
        type: 'success',
        text: `Successfully minted NFT #${tokenIndex}: "${formData.name}"`
      });
      
      // Reset form
      setFormData({
        name: '',
        year: '',
        location: '',
        coordinates: '',
        categories: '',
        significance: '',
        tokenId: '',
        photoUrl: '',
        thumbnailUrl: '',
        documentUrl: '',
        iv: '',
        privateKey: ''
      });
      
    } catch (error) {
      console.error("Failed to mint NFT:", error);
      setMessage({
        type: 'error',
        text: `Error minting NFT: ${error.message}`
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="custodian-panel loading">
        <div className="spinner"></div>
        <p>Checking custodian status...</p>
      </div>
    );
  }
  
  if (!isCustodian) {
    return (
      <div className="custodian-panel not-authorized">
        <h3>Not Authorized</h3>
        <p>Only custodians can mint new Historical Places NFTs.</p>
        <p>Please contact the collection owner for custodian access.</p>
      </div>
    );
  }
  
  return (
    <div className="custodian-panel">
      <h2>Mint New Historical Place NFT</h2>
      <p className="description">Create a new historical place NFT as a custodian of this collection.</p>
      
      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>Place Information</h3>
          
          <div className="form-group">
            <label htmlFor="name">Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. The Great Wall of China"
              required
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="year">Year *</label>
              <input
                type="number"
                id="year"
                name="year"
                value={formData.year}
                onChange={handleChange}
                placeholder="e.g. 1368"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="location">Location *</label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. Beijing, China"
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="coordinates">Coordinates</label>
            <input
              type="text"
              id="coordinates"
              name="coordinates"
              value={formData.coordinates}
              onChange={handleChange}
              placeholder="e.g. 40.4319° N, 116.5704° E"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="categories">Categories * (comma-separated)</label>
            <input
              type="text"
              id="categories"
              name="categories"
              value={formData.categories}
              onChange={handleChange}
              placeholder="e.g. Monument, Ancient, World Wonder"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="significance">Historical Significance *</label>
            <textarea
              id="significance"
              name="significance"
              value={formData.significance}
              onChange={handleChange}
              placeholder="Describe the historical significance of this place..."
              rows="4"
              required
            ></textarea>
          </div>
        </div>
        
        <div className="form-section">
          <h3>NFT Details</h3>
          
          <div className="form-group">
            <label htmlFor="tokenId">Token ID *</label>
            <input
              type="text"
              id="tokenId"
              name="tokenId"
              value={formData.tokenId}
              onChange={handleChange}
              placeholder="e.g. HP003"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="photoUrl">Photo URL *</label>
            <input
              type="url"
              id="photoUrl"
              name="photoUrl"
              value={formData.photoUrl}
              onChange={handleChange}
              placeholder="https://example.com/path/to/photo.jpg"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="thumbnailUrl">Thumbnail URL *</label>
            <input
              type="url"
              id="thumbnailUrl"
              name="thumbnailUrl"
              value={formData.thumbnailUrl}
              onChange={handleChange}
              placeholder="https://example.com/path/to/thumbnail.jpg"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="documentUrl">Document URL *</label>
            <input
              type="url"
              id="documentUrl"
              name="documentUrl"
              value={formData.documentUrl}
              onChange={handleChange}
              placeholder="https://example.com/path/to/document.pdf"
              required
            />
          </div>
        </div>
        
        <div className="form-section">
          <h3>Decryption Information (Optional)</h3>
          
          <div className="form-group">
            <label htmlFor="iv">Initialization Vector (IV)</label>
            <input
              type="text"
              id="iv"
              name="iv"
              value={formData.iv}
              onChange={handleChange}
              placeholder="Enter encryption IV value"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="privateKey">Private Key</label>
            <input
              type="text"
              id="privateKey"
              name="privateKey"
              value={formData.privateKey}
              onChange={handleChange}
              placeholder="Enter private key value"
            />
            <small>This will be used to decrypt encrypted content.</small>
          </div>
        </div>
        
        <div className="form-actions">
          <button
            type="submit"
            className="btn primary"
            disabled={submitting}
          >
            {submitting ? 'Minting...' : 'Mint NFT'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CustodianMint;