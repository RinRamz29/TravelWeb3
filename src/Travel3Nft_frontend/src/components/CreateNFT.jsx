import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import nftService from '../services/nftService';
import { NotificationContext } from '../context/NotificationContext';
import { AuthContext } from '../context/AuthContext';
import LoadingPlaceholder from './LoadingPlaceholder';
import FileUploader from './FileUploader';

const CreateNFT = () => {
  const navigate = useNavigate();
  const { showNotification } = useContext(NotificationContext);
  const { isAuthenticated } = useContext(AuthContext);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [mainImageUrl, setMainImageUrl] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Redirect unauthenticated users
  if (!isAuthenticated) {
    return (
      <div className="container">
        <div className="auth-message">
          <h2>Authentication Required</h2>
          <p>Please log in to create NFTs</p>
          <button
            className="connect-button"
            onClick={() => navigate('/login')}
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  const handleMainImageUploaded = (url) => {
    setMainImageUrl(url);
    console.log("Main image uploaded:", url);
  };

  const handleDocumentUploaded = (url) => {
    setDocumentUrl(url);
    console.log("Document uploaded:", url);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
   
    if (!title || !location || !description) {
      showNotification('error', 'Please fill in all required fields');
      return;
    }

    setIsCreating(true);

    if (!mainImageUrl) {
      showNotification('error', 'Please upload a main image for the NFT');
      setIsCreating(false);
      return;
    }

    try {
      const result = await nftService.createNFT({
        title,
        location,
        description,
        mainImageUrl,
        documentUrl
      });

      if (result.Ok) {
        showNotification('success', 'NFT created successfully!');
        navigate('/my-nfts');
      } else {
        showNotification('error', `Error creating NFT: ${JSON.stringify(result.Err || result)}`);
      }
    } catch (error) {
      console.error('Error creating NFT:', error);
      showNotification('error', `Error creating NFT: ${error.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    navigate('/');
  };

  return (
    <div className="container">
      <h1 className="section-title">Create NFT</h1>
      
      <div className="create-nft-form">
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-section">
              <label htmlFor="title">Title</label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter NFT title"
                required
              />
            </div>
            
            <div className="form-section">
              <label htmlFor="location">Location</label>
              <input
                type="text"
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter the location (e.g., Paris, France)"
                required
              />
            </div>
          </div>
          
          <div className="form-section full-width">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your historical place"
              required
            ></textarea>
          </div>
          
          <div className="media-section">
            <h2>Media Files</h2>
            
            <div className="file-upload">
              <label>Main Image</label>
              <FileUploader
                onFileUploaded={handleMainImageUploaded}
                label="Upload Main Image"
                acceptTypes="image/*"
                onUploadStarted={() => setIsUploading(true)}
                onUploadFinished={() => setIsUploading(false)}
              />
              
              {mainImageUrl && (
                <div className="image-preview">
                  <img src={mainImageUrl} alt="Preview" />
                </div>
              )}
            </div>
            
            <div className="file-upload">
              <label>Document (Optional)</label>
              <FileUploader
                onFileUploaded={handleDocumentUploaded}
                label="Upload Document"
                acceptTypes=".pdf,.doc,.docx,application/pdf,application/msword"
                onUploadStarted={() => setIsUploading(true)}
                onUploadFinished={() => setIsUploading(false)}
              />
              
              {documentUrl && (
                <div className="document-link">
                  <a href={documentUrl} target="_blank" rel="noopener noreferrer">
                    View Document
                  </a>
                </div>
              )}
            </div>
          </div>
          
          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={handleCancel}
            >
              Cancel
            </button>
            
            <button
              type="submit"
              className="submit-button"
              disabled={isCreating || isUploading}
            >
              {isCreating ? (
                <>
                  <span className="loading-spinner">
                    <span className="spinner-circle"></span>
                  </span>
                  Creating NFT...
                </>
              ) : 'Create NFT'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateNFT;