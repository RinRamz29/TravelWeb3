import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import nftService from '../services/nftService';
import { useNotification } from '../context/NotificationContext';

const CreateNFT = ({ onSuccess }) => {
  const navigate = useNavigate();
  const { showSuccess, showError, showInfo } = useNotification();
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    year: '',
    culturalSignificance: '',
    mainImage: null,
    document: null
  });
  const [submitting, setSubmitting] = useState(false);
  const [formState, setFormState] = useState({
    error: null
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.files[0]
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    showInfo('Creating new NFT...');
    
    try {
      // Prepare metadata object
      const metadata = {
        name: formData.name,
        description: `Historical place NFT - ${formData.name}`,
        attributes: {
          location: formData.location,
          year: formData.year,
          culturalSignificance: formData.culturalSignificance
        },
        image: await nftService.uploadFile(formData.mainImage),
        document: formData.document ? await nftService.uploadFile(formData.document) : null
      };
      
      await nftService.mintNFT(metadata);
      showSuccess('NFT created successfully!');
      
      // Call the onSuccess callback if provided
      if (onSuccess) onSuccess();
      
      // Redirect to home page
      navigate('/');
    } catch (error) {
      console.error('Error creating NFT:', error);
      setFormState({
        error: error.message || 'Failed to create NFT. Please try again.'
      });
      setSubmitting(false);
      showError('Failed to create NFT: ' + (error.message || 'Unknown error'));
    }
  };
  
  return (
    <div className="create-nft-page">
      <h1>Create New Historical Place NFT</h1>
      <p className="subtitle">Add a new historical place to the collection</p>
      
      {formState.error && (
        <div className="error-message">{formState.error}</div>
      )}
      
      <form onSubmit={handleSubmit} className="create-nft-form">
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="name">Place Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter the name of the historical place"
              required
            />
          </div>
          
          <div className="form-group wide">
            <label htmlFor="location">Location</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="Enter the location of the historical place"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="year">Year</label>
            <input
              type="number"
              id="year"
              name="year"
              value={formData.year}
              onChange={handleInputChange}
              placeholder="Enter the year the historical place was established"
              required
            />
          </div>
          
          <div className="form-group wide">
            <label htmlFor="culturalSignificance">Cultural Significance</label>
            <textarea
              id="culturalSignificance"
              name="culturalSignificance"
              value={formData.culturalSignificance}
              onChange={handleInputChange}
              placeholder="Describe the cultural significance of this place"
              required
            />
          </div>
        </div>
        
        <div className="file-uploads">
          <h3>Media Files</h3>
          
          <div className="form-group">
            <label htmlFor="mainImage">Main Image</label>
            <input
              type="file"
              id="mainImage"
              name="mainImage"
              accept="image/*"
              onChange={handleFileChange}
              required
            />
            {formData.mainImage && (
              <div className="image-preview">
                <img src={URL.createObjectURL(formData.mainImage)} alt="Main preview" />
                <span>{formData.mainImage.name}</span>
              </div>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="document">Historical Document</label>
            <input
              type="file"
              id="document"
              name="document"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
            />
            {formData.document && (
              <div className="document-preview">
                <span>{formData.document.name}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="form-actions">
          <button type="button" className="cancel-button" onClick={() => navigate('/')}>
            Cancel
          </button>
          <button type="submit" className="submit-button" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create NFT'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateNFT;
