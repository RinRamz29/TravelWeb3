import { backendActor, frontendActor, checkActorsAvailable, createBackendActor, createFrontendActor, createActorWithOptions, FRONTEND_CANISTER_ID, BACKEND_CANISTER_ID } from "./dfinity-imports";
// Use named import to avoid circular dependency issues
import { authService } from "./authService";
import { Principal } from "@dfinity/principal";

class NFTService {
  constructor() {
    // Get canister IDs from environment variables if not already defined
    this.BACKEND_CANISTER_ID = BACKEND_CANISTER_ID || process.env.CANISTER_ID_BACKEND;
    this.FRONTEND_CANISTER_ID = FRONTEND_CANISTER_ID || process.env.CANISTER_ID_FRONTEND;

    this.nftCanister = backendActor;
    this.assetCanister = frontendActor;
    
    // Get network from environment variables
    this.network = process.env.DFX_NETWORK || "local";
    this.isLocalDevelopment = this.network !== "ic" || 
                             window.location.hostname.includes('localhost') || 
                             window.location.hostname.includes('127.0.0.1');

    // Log canister availability status and IDs
    console.log("NFT Service initialization:",
      checkActorsAvailable ? checkActorsAvailable() : "checkActorsAvailable not available",
      "Backend Canister ID:", this.BACKEND_CANISTER_ID,
      "Frontend Canister ID:", this.FRONTEND_CANISTER_ID,
      "Local development mode:", this.isLocalDevelopment);

    // Initialize actors immediately but with proper options for local development
    this.initializeActors();
    this.batchId = null;
  }

  async getAllNFTs() {
    if (!this.nftCanister) {
      console.error("NFT canister is not available");
      await this.initializeActors();

      // If still not available, return mock data for development
      if (!this.nftCanister) {
        return this.getMockNFTs();
      }
    }

    try {
      console.log("Fetching all NFTs from backend canister");
      const tokens = await this.nftCanister.getAllTokens();
      console.log("Received tokens:", tokens);

      return tokens.map(token => this.formatNFTData(token));
    } catch (error) {
      console.error("Error fetching all NFTs:", error);
      
      // Check if this is a certificate verification error
      if (this.isCertificateError(error) && this.isLocalDevelopment) {
        console.log("Certificate verification error detected in local development - reinitializing with disabled verification");
        await this.initializeActorsWithDisabledVerification();
        
        try {
          // Retry after reinitialization
          const tokens = await this.nftCanister.getAllTokens();
          return tokens.map(token => this.formatNFTData(token));
        } catch (retryError) {
          console.error("Retry failed after disabling certificate verification:", retryError);
        }
      }
      
      // Fallback to mock data if there's an error
      return this.getMockNFTs();
    }
  }

  // Helper to check if an error is related to certificate verification
  isCertificateError(error) {
    const errorString = error.toString().toLowerCase();
    return errorString.includes('certificate') && 
           (errorString.includes('verification') || 
            errorString.includes('verify') || 
            errorString.includes('signature'));
  }

  // Initialize actors with certificate verification disabled for local development
  async initializeActorsWithDisabledVerification() {
    console.log("Initializing actors with certificate verification disabled");
    
    try {
      const identity = await authService.getIdentity();
      
      if (!identity) {
        console.warn("No identity available for actor initialization");
        return;
      }
      
      const host = "http://localhost:8000";
      const options = {
        host: host,
        fetchOptions: {
          disableCertificateVerification: true
        }
      };
      
      // Create backend actor with certificate verification disabled
      if (this.BACKEND_CANISTER_ID) {
        this.nftCanister = await createActorWithOptions(
          identity, 
          { ...options, canisterId: this.BACKEND_CANISTER_ID }
        );
        console.log("NFT canister initialized with certificate verification disabled");
      }
      
      // Create frontend actor with certificate verification disabled
      if (this.FRONTEND_CANISTER_ID) {
        this.assetCanister = await createActorWithOptions(
          identity, 
          { ...options, canisterId: this.FRONTEND_CANISTER_ID }
        );
        console.log("Asset canister initialized with certificate verification disabled");
      }
    } catch (error) {
      console.error("Error initializing actors with disabled verification:", error);
    }
  }

  async initializeActors() {
    // If in local development, initialize with certificate verification disabled by default
    if (this.isLocalDevelopment) {
      console.log("Local development detected - initializing actors with certificate verification disabled");
      return this.initializeActorsWithDisabledVerification();
    }
    
    // Regular initialization for production
    if (!this.nftCanister) {
      console.log("NFT canister not available, attempting to initialize...");

      try {
        const status = checkActorsAvailable ? checkActorsAvailable() : null;
        console.log("Actor availability status:", status);

        // Check if authService has getIdentity method
        let identity = null;
        if (authService.identity) {
          // Direct property access if it exists
          identity = authService.identity;
          console.log("Got identity directly from authService property");
        } else if (typeof authService.getIdentity === 'function') {
          // Use getIdentity method if it exists
          identity = await authService.getIdentity();
          console.log("Got identity from getIdentity method");
        } else if (typeof authService.getLoggedInIdentity === 'function') {
          // Try alternative method name if it exists
          identity = await authService.getLoggedInIdentity();
          console.log("Got identity from getLoggedInIdentity method");
        } else {
          console.warn("Could not get identity from authService");
        }

        if (status && status.backendActor) {
          this.nftCanister = backendActor;
          console.log("NFT canister initialized from global actor");
        } else {
          // Try to create a new actor instance with proper canister ID
          try {
            // Ensure we have the backend canister ID
            if (!this.BACKEND_CANISTER_ID) {
              throw new Error("Backend canister ID is not available in environment variables");
            }

            if (identity) {
              this.nftCanister = await createBackendActor(identity, {
                canisterId: this.BACKEND_CANISTER_ID,
              });
              console.log("NFT canister initialized with new actor instance");
            } else {
              console.error("Cannot create backend actor without identity");
            }
          } catch (error) {
            console.error("Failed to create backend actor:", error);
          }
        }

        // Initialize asset canister if needed
        if (!this.assetCanister) {
          if (status && status.frontendActor) {
            this.assetCanister = frontendActor;
            console.log("Asset canister initialized from global actor");
          } else {
            try {
              // Ensure we have the frontend canister ID
              if (!this.FRONTEND_CANISTER_ID) {
                throw new Error("Frontend canister ID is not available in environment variables");
              }
              
              if (identity) {
                this.assetCanister = await createFrontendActor(identity, {
                  canisterId: this.FRONTEND_CANISTER_ID,
                });
                console.log("Asset canister initialized with new actor instance");
              } else {
                console.error("Cannot create asset canister without identity");
              }
            } catch (error) {
              console.error("Failed to create frontend actor:", error);
            }
          }
        }
      } catch (error) {
        console.error("Error during actor initialization:", error);
      }
    }
  }

  formatNFTData(token) {
    const metadata = token.metadata[0];
    return {
      id: token.index.toString(),
      tokenId: token.index.toString(),
      owner: token.owner.toString(),
      highlighted: false,
      metadata: {
        mainImageUrl: metadata?.mainImageLocation?.icp || "",
        documentUrl: metadata?.documentLocation?.icp || "",
        attributes: {
          name: metadata?.attributes?.name || "Unnamed NFT",
          location: metadata?.attributes?.location || "Unknown Location",
          year: metadata?.attributes?.year || "Unknown Year",
          culturalSignificance: metadata?.attributes?.culturalSignificance || ""
        }
      }
    };
  }

  async getUserNFTs() {
    if (!this.nftCanister) {
      console.error("NFT canister is not available for getUserNFTs");
      await this.initializeActors();
      
      // If still not available, return mock data
      if (!this.nftCanister) {
        return this.getMockNFTs();
      }
    }

    try {
      // Check if we have a valid principal
      if (!authService.isAuthenticated) {
        console.warn("User is not authenticated, returning empty NFT list");
        return [];
      }

      // Get the user's principal
      console.log("Getting principal for NFT query");
      const principal = await authService.getPrincipal();
      console.log("Fetching NFTs for principal:", principal.toString());
      const nfts = await this.nftCanister.getUserTokens(principal);
      return nfts;
    } catch (error) {
      console.error("Error fetching user NFTs:", error);
      
      // Check if this is a certificate verification error
      if (this.isCertificateError(error) && this.isLocalDevelopment) {
        console.log("Certificate verification error detected in local development - reinitializing");
        await this.initializeActorsWithDisabledVerification();
        
        try {
          // Retry after reinitialization
          const principal = await authService.getPrincipal();
          return await this.nftCanister.getUserTokens(principal);
        } catch (retryError) {
          console.error("Retry failed after disabling certificate verification:", retryError);
        }
      }
      
      // Return mock data for local development
      if (this.isLocalDevelopment) {
        return this.getMockNFTs();
      }
      
      throw error;
    }
  }

  async getNFTDetails(tokenId) {
    if (!this.nftCanister) {
      console.error("NFT canister is not available");
      await this.initializeActors();
      
      if (!this.nftCanister && this.isLocalDevelopment) {
        // Return mock data for local development
        return this.getMockNFTs().find(nft => nft.id === tokenId.toString());
      }
    }

    try {
      const nftDetails = await this.nftCanister.getTokenInfo(BigInt(tokenId));
      return nftDetails;
    } catch (error) {
      console.error("Error fetching NFT details:", error);
      
      // Check if this is a certificate verification error
      if (this.isCertificateError(error) && this.isLocalDevelopment) {
        console.log("Certificate verification error detected in local development - reinitializing");
        await this.initializeActorsWithDisabledVerification();
        
        try {
          // Retry after reinitialization
          return await this.nftCanister.getTokenInfo(BigInt(tokenId));
        } catch (retryError) {
          console.error("Retry failed after disabling certificate verification:", retryError);
        }
      }
      
      throw error;
    }
  }

  async mintNFT(metadata) {
    // For local development, use mock minting
    if (this.isLocalDevelopment) {
      console.log("Local development mode detected - using mock minting");
      return this.mockMintNFT(metadata);
    }
    
    if (!this.nftCanister) {
      console.error("NFT canister is not available");
      await this.initializeActors();
      
      if (!this.nftCanister) {
        if (this.isLocalDevelopment) {
          return this.mockMintNFT(metadata);
        }
        throw new Error("NFT canister is not available for minting");
      }
    }

    try {
      const principal = await authService.getPrincipal();
      console.log("Minting NFT for principal:", principal.toString());

      // Prepare the TokenMetadata object according to the canister's expected format
      const tokenMetadata = {
        mainImageLocation: { icp: metadata.mainImageUrl, ipfs: "" },
        documentLocation: { icp: metadata.documentUrl || "", ipfs: "" },
        mainImageType: metadata.mainImageType || "image/jpeg",
        documentType: metadata.documentType || "",
        thumbnailLocation: { icp: metadata.mainImageUrl, ipfs: "" },
        thumbnailType: metadata.mainImageType || "image/jpeg",
        additionalImagesLocation: [],
        additionalImagesType: "",
        tokenIdentifier: "",
        attributes: {
          name: metadata.name,
          location: metadata.location || "Unknown Location",
          coordinates: "",
          year: "2023",
          category: "Historical Place",
          collection: "Travel3",
          historicalPeriod: "",
          culturalSignificance: metadata.description || "",
          architecturalStyle: []
        }
      };

      console.log("Minting with metadata:", JSON.stringify(tokenMetadata));

      // Call the mint function with the principal and metadata
      const result = await this.nftCanister.mint(principal, [tokenMetadata]);
      console.log("Mint result:", result);
      return result;
    } catch (error) {
      console.error("Error minting NFT:", error);
      
      // Check if this is a certificate verification error
      if (this.isCertificateError(error) && this.isLocalDevelopment) {
        console.log("Certificate verification error detected during minting - reinitializing");
        await this.initializeActorsWithDisabledVerification();
        
        try {
          // Retry after reinitialization
          const principal = await authService.getPrincipal();
          const result = await this.nftCanister.mint(principal, [tokenMetadata]);
          return result;
        } catch (retryError) {
          console.error("Retry failed after disabling certificate verification:", retryError);
          // Fall back to mock minting
          return this.mockMintNFT(metadata);
        }
      }
      
      // For local development, fall back to mock minting
      if (this.isLocalDevelopment) {
        console.log("Error in production minting flow, falling back to mock minting");
        return this.mockMintNFT(metadata);
      }
      
      throw error;
    }
  }
  
  // Mock NFT minting for local development
  async mockMintNFT(metadata) {
    console.log("Using mock mint for local development with metadata:", metadata);
    
    // Generate a random token ID
    const tokenId = Math.floor(Math.random() * 10000) + 1000;
    
    // Create a mock result that resembles what the canister would return
    const mockResult = {
      ok: {
        tokenIndex: BigInt(tokenId),
        id: `${tokenId}`,
        timestamp: BigInt(Date.now()),
        owner: authService.principal ? authService.principal.toString() : "anonymous-user",
        metadata: {
          mainImageLocation: { icp: metadata.mainImageUrl },
          attributes: {
            name: metadata.name,
            location: metadata.location || "Mock Location",
            year: "2023",
            culturalSignificance: metadata.description || "Mock description"
          }
        }
      }
    };
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    console.log("Mock minting result:", mockResult);
    return mockResult;
  }

  // Add createNFT method that calls mintNFT with the appropriate parameters
  async createNFT(metadata) {
    console.log("Creating NFT with metadata:", metadata);
    try {
      // For local development, no need to initialize actors
      if (this.isLocalDevelopment) {
        const nftMetadata = {
          name: metadata.title,
          location: metadata.location,
          description: metadata.description,
          mainImageUrl: metadata.mainImageUrl,
          documentUrl: metadata.documentUrl || "",
          mainImageType: metadata.mainImageType || "image/jpeg",
        };
        return await this.mintNFT(nftMetadata);
      }
      
      // Make sure we have initialized actors
      if (!this.nftCanister) {
        const identity = await authService.getIdentity();
        
        if (!identity) {
          throw new Error("User is not authenticated");
        }
        
        this.nftCanister = await createBackendActor(identity, {
          canisterId: this.BACKEND_CANISTER_ID
        });
        console.log("Initialized NFT canister for createNFT");
      }
      
      const nftMetadata = {
        name: metadata.title,
        location: metadata.location,
        description: metadata.description,
        mainImageUrl: metadata.mainImageUrl,
        documentUrl: metadata.documentUrl || "",
        mainImageType: metadata.mainImageType || "image/jpeg",
      };
      return await this.mintNFT(nftMetadata);
    } catch (error) {
      console.error("Error in createNFT:", error);
      
      // For local development, use mock minting as fallback
      if (this.isLocalDevelopment) {
        console.log("Error in createNFT, falling back to mock minting");
        const nftMetadata = {
          name: metadata.title,
          location: metadata.location,
          description: metadata.description,
          mainImageUrl: metadata.mainImageUrl,
          documentUrl: metadata.documentUrl || "",
        };
        return this.mockMintNFT(nftMetadata);
      }
      
      throw error;
    }
  }

  async uploadFile(file, progressCallback = null) {
    if (!file) return "";

    try {
      // Ensure we have an identity and asset canister
      const identity = await authService.getIdentity();
      
      // For local development, use base64 encoding
      if (this.isLocalDevelopment) {
        console.log("Local development mode: Using base64 encoding for file upload");
        
        // Simulate upload progress
        if (progressCallback) {
          let progress = 0;
          const interval = setInterval(() => {
            progress += 10;
            if (progress > 90) clearInterval(interval);
            progressCallback(progress);
          }, 300);
          
          // After 3 seconds, complete the progress
          setTimeout(() => {
            clearInterval(interval);
            progressCallback(100);
          }, 3000);
        }
        
        try {
          const base64 = await this.fileToBase64(file);
          return base64;
        } catch (error) {
          console.error("Base64 encoding failed:", error);
          throw new Error(`Failed to encode file: ${error.message}`);
        }
      }

      if (!this.assetCanister) {
        console.log("Asset canister not available, attempting to create one");

        // For local development, create an actor with certificate verification disabled
        if (this.isLocalDevelopment) {
          console.log("Creating asset canister with certificate verification disabled");

          try {
            // Create the actor with certificate verification explicitly disabled
            const host = "http://localhost:8000";
            this.assetCanister = await createActorWithOptions(identity, {
              host: host,
              canisterId: this.FRONTEND_CANISTER_ID,
              // IMPORTANT: This is the key fix for local development
              fetchOptions: {
                disableCertificateVerification: true
              }
            });

            if (!this.assetCanister) {
              throw new Error("Failed to create asset canister with options");
            }

            console.log("Successfully created asset canister for local development");
          } catch (actorError) {
            console.error("Error creating actor with options:", actorError);

            // Additional fallback: try to use the global actor if available
            if (frontendActor) {
              console.log("Falling back to global frontendActor");
              this.assetCanister = frontendActor;
            } else {
              // For local development, use base64 encoding as fallback
              const base64 = await this.fileToBase64(file);
              return base64;
            }
          }
        } else {
          // Production mode - use normal actor creation
          try {
            this.assetCanister = await createFrontendActor(identity, {
              canisterId: this.FRONTEND_CANISTER_ID
            });
          } catch (error) {
            console.error("Failed to create frontend actor:", error);
            throw error;
          }
        }
      }

      // If still no asset canister, try fallback methods
      if (!this.assetCanister) {
        console.error("Asset canister is still not available for file uploads");

        if (this.isLocalDevelopment) {
          // Fallback to base64 encoding for development
          console.log("Falling back to base64 encoding for development");
          const base64 = await this.fileToBase64(file);
          return base64;
        } else {
          throw new Error("Asset canister not available and no fallback method available");
        }
      }

      console.log("Starting file upload process for:", file.name, "type:", file.type);

      // For now, use the simpler store method instead of the batch API
      const assetKey = `assets/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

      try {
        const arrayBuffer = await this.readFileAsArrayBuffer(file);
        console.log(`Uploading file of size: ${arrayBuffer.byteLength} bytes`);

        // Update progress
        if (progressCallback) progressCallback(10);

        const result = await this.assetCanister.store({
          key: assetKey,
          content: Array.from(new Uint8Array(arrayBuffer)),
          content_type: file.type,
          content_encoding: "identity",
          sha256: []
        });

        // Update progress
        if (progressCallback) progressCallback(100);

        console.log("Store operation result:", result);
      } catch (storeError) {
        console.error("Store operation failed:", storeError);
        
        // Check if this is a certificate verification error
        if (this.isCertificateError(storeError) && this.isLocalDevelopment) {
          console.log("Certificate verification error detected during file upload - reinitializing");
          await this.initializeActorsWithDisabledVerification();
          
          try {
            // Retry after reinitialization
            const arrayBuffer = await this.readFileAsArrayBuffer(file);
            await this.assetCanister.store({
              key: assetKey,
              content: Array.from(new Uint8Array(arrayBuffer)),
              content_type: file.type,
              content_encoding: "identity",
              sha256: []
            });
          } catch (retryError) {
            console.error("Retry failed after disabling certificate verification:", retryError);
            // For local development, fallback to base64
            if (this.isLocalDevelopment) {
              console.log("Store failed, falling back to base64 encoding");
              const base64 = await this.fileToBase64(file);
              return base64;
            }
          }
        } else if (this.isLocalDevelopment) {
          // For local development, fallback to base64
          console.log("Store failed, falling back to base64 encoding");
          const base64 = await this.fileToBase64(file);
          return base64;
        } else {
          throw storeError;
        }
      }

      // Construct the URL for the uploaded asset
      const canisterId = this.FRONTEND_CANISTER_ID;
      const baseUrl = this.isLocalDevelopment
        ? `http://${canisterId}.localhost:8000`
        : `https://${canisterId}.icp0.io`;
      const fileUrl = `${baseUrl}/assets/${assetKey}`;
      console.log("File uploaded successfully:", fileUrl);
      return fileUrl;
    } catch (error) {
      console.error("Failed to upload file:", error);

      // For local development, try base64 fallback
      if (this.isLocalDevelopment) {
        try {
          console.log("Upload error, using base64 fallback");
          return await this.fileToBase64(file);
        } catch (fallbackError) {
          console.error("Base64 fallback also failed:", fallbackError);
        }
      }

      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  // Fallback method: Convert file to base64 for development
  async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  }

  // Read file as ArrayBuffer
  async readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  // Create a batch for uploading
  async createBatch() {
    try {
      const result = await this.assetCanister.create_batch();
      return result.batch_id;
    } catch (error) {
      console.error("Failed to create batch:", error);
      throw error;
    }
  }

  // Upload file content in chunks
  async uploadChunks(batchId, fileContent, progressCallback = null) {
    const MAX_CHUNK_SIZE = 1900000; // ~1.9MB to stay under message size limit
    const arrayBuffer = new Uint8Array(fileContent);
    const totalChunks = Math.ceil(arrayBuffer.length / MAX_CHUNK_SIZE);
    const chunkIds = [];

    for (let i = 0; i < totalChunks; i++) {
      const start = i * MAX_CHUNK_SIZE;
      const end = Math.min(start + MAX_CHUNK_SIZE, arrayBuffer.length);
      const chunk = arrayBuffer.slice(start, end);

      try {
        // Upload the chunk
        const result = await this.assetCanister.create_chunk({
          batch_id: batchId,
          content: Array.from(chunk),
        });

        chunkIds.push(result.chunk_id);

        // Report progress if callback provided
        if (progressCallback) {
          const progress = Math.round(((i + 1) / totalChunks) * 100);
          progressCallback(progress);
        }

        console.log(`Uploaded chunk ${i + 1}/${totalChunks} (${chunk.length} bytes)`);
      } catch (error) {
        console.error(`Failed to upload chunk ${i + 1}/${totalChunks}:`, error);
        throw error;
      }
    }

    console.log(`Completed uploading ${chunkIds.length} chunks`);
    return chunkIds;
  }

  // Retry mechanism for canister operations
  async retryOperation(operation, maxRetries = 3, delay = 1000) {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        console.warn(`Operation failed (attempt ${i + 1}/${maxRetries}):`, error);
        lastError = error;
        
        // If this is a certificate error in local development, try to reinitialize
        if (this.isCertificateError(error) && this.isLocalDevelopment && i === 0) {
          console.log("Certificate error detected, reinitializing actors with disabled verification");
          await this.initializeActorsWithDisabledVerification();
        }
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw lastError;
  }

  // Mock data for development when canister is not available
  getMockNFTs() {
    console.log("Using mock NFT data for development");
    return Array.from({ length: 24 }, (_, index) => ({
      id: `${index + 1237}`,
      tokenId: `${index + 1237}`,
      owner: `principal-${index}`,
      highlighted: index % 7 === 3,
      metadata: {
        mainImageUrl: `/assets/mock-nft-${index % 5 + 1}.jpg`,
        attributes: {
          name: `Historical Place ${index + 1}`,
          location: ['Paris, France', 'Rome, Italy', 'Athens, Greece', 'Cairo, Egypt', 'Beijing, China'][index % 5],
          year: (1800 + (index * 10)).toString(),
          culturalSignificance: "This historical place has significant cultural importance."
        }
      }
    }));
  }

  // Method to check if a string is a valid URL
  isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }
}

export default new NFTService();