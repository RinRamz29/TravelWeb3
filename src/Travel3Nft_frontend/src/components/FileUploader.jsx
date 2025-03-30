import React, { useState, useRef, useEffect } from 'react';
import { useNotification } from '../context/NotificationContext';

/**
 * FileUploader component that automatically uses base64 encoding in local development
 * and attempts canister uploads in production environments.
 */
const FileUploader = ({ onFileUploaded, label = "Upload File", accept = "image/*", className = "" }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isLocalMode, setIsLocalMode] = useState(false);
  const fileInputRef = useRef(null);
  const { showNotification } = useNotification();

  // Check if we're in local development mode
  useEffect(() => {
    const checkEnvironment = () => {
      const isLocal = window.location.hostname.includes('localhost') || 
                     window.location.hostname.includes('127.0.0.1');
      setIsLocalMode(isLocal);
      console.log("Environment check: running in", isLocal ? "local mode" : "production mode");
    };
    
    checkEnvironment();
  }, []);

  // File to base64 converter
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // Simulate upload progress
  const simulateProgress = () => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 10) + 5;
      if (progress > 95) {
        progress = 95;
        clearInterval(interval);
      }
      setUploadProgress(progress);
    }, 300);
    
    return () => clearInterval(interval);
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    await handleUpload(file);
  };

  const handleUpload = async (file) => {
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Start simulating progress
      const stopProgress = simulateProgress();
      
      // For local development, always use base64
      if (isLocalMode) {
        try {
          console.log("Local mode: Using base64 encoding");
          const base64 = await fileToBase64(file);
          
          // Complete progress simulation
          clearTimeout(stopProgress);
          setUploadProgress(100);
          
          // Short delay to show 100% before completion
          await new Promise(r => setTimeout(r, 300));
          
          onFileUploaded(base64);
          showNotification('success', 'File encoded successfully (local mode)');
        } catch (error) {
          console.error("Base64 encoding failed:", error);
          showNotification('error', `Failed to encode file: ${error.message}`);
        }
      } 
      // For production, try the normal upload
      else {
        // Import nftService dynamically to avoid initialization issues
        const nftService = (await import('../services/nftService')).default;
        
        try {
          const fileUrl = await nftService.uploadFile(file, (progress) => {
            setUploadProgress(progress);
          });
          
          if (fileUrl) {
            onFileUploaded(fileUrl);
            showNotification('success', 'File uploaded successfully');
          } else {
            throw new Error("No file URL returned");
          }
        } catch (error) {
          console.error("Upload failed, falling back to base64:", error);
          
          // Fallback to base64 even in production if needed
          const base64 = await fileToBase64(file);
          onFileUploaded(base64);
          showNotification('warning', 'Using local encoding (file will not be persistent)');
        }
      }
    } catch (error) {
      console.error("All upload methods failed:", error);
      showNotification('error', `Failed to process file: ${error.message}`);
    } finally {
      setIsUploading(false);
      // Reset progress after a delay
      setTimeout(() => setUploadProgress(0), 500);
    }
  };

  const handleClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div className={`file-uploader ${className}`}>
      <button
        type="button"
        className={`btn btn-primary ${isUploading ? 'disabled' : ''}`}
        onClick={handleClick}
        disabled={isUploading}
      >
        {isUploading ? (
          <>
            <div className="spinner-border spinner-border-sm me-2" role="status">
              <span className="visually-hidden">Uploading...</span>
            </div>
            {uploadProgress < 100 ? `Uploading... ${uploadProgress}%` : 'Processing...'}
          </>
        ) : (
          label
        )}
      </button>
      
      {isLocalMode && !isUploading && (
        <div className="text-warning small mt-1">
          <i className="bi bi-info-circle me-1"></i>
          Local development mode (using file encoder)
        </div>
      )}
      
      {isUploading && (
        <div className="progress mt-2">
          <div
            className="progress-bar"
            role="progressbar"
            aria-valuenow={uploadProgress}
            aria-valuemin="0"
            aria-valuemax="100"
            style={{ width: `${uploadProgress}%` }}
          >
            {uploadProgress}%
          </div>
        </div>
      )}
      
      <input
        type="file"
        ref={fileInputRef}
        className="d-none"
        onChange={handleFileChange}
        accept={accept}
      />
    </div>
  );
};

export default FileUploader;