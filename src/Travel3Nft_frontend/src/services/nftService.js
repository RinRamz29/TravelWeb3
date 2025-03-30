import { Travel3Nft_backend } from "../../../declarations/Travel3Nft_backend";
import { Travel3Nft_frontend } from "../../../declarations/Travel3Nft_frontend";
import authService from "./authService";

class NFTService {
  constructor() {
    this.nftCanister = Travel3Nft_backend;
    this.assetCanister = Travel3Nft_frontend;
  }

  async getUserNFTs() {
    if (!authService.isAuthenticated) {
      return [];
    }
    
    const principal = authService.getPrincipal();
    return await this.nftCanister.getUserTokens(principal);
  }

  async getNFTDetails(tokenId) {
    try {
      return await this.nftCanister.getTokenInfo(tokenId);
    } catch (error) {
      console.error("Error fetching NFT details:", error);
      throw new Error("Failed to fetch NFT details");
    }
  }
   
  async mintNFT(metadata) {
    if (!authService.isAuthenticated) {
      throw new Error("Authentication required to mint NFTs");
    }
    
    const principal = authService.getPrincipal();
    
    // Format the metadata according to the canister's expected format
    const formattedMetadata = {
      tokenIdentifier: `place_${Date.now()}`,
      mainImageType: metadata.mainImageType || "image/jpeg",
      mainImageLocation: {
        icp: metadata.mainImageUrl || "",
        ipfs: ""
      },
      documentType: metadata.documentType || "application/pdf",
      documentLocation: {
        icp: metadata.documentUrl || "",
        ipfs: ""
      },
      thumbnailType: "image/jpeg",
      thumbnailLocation: {
        icp: metadata.thumbnailUrl || metadata.mainImageUrl || "",
        ipfs: ""
      },
      additionalImagesType: "image/jpeg",
      additionalImagesLocation: [],
      attributes: {
        name: metadata.name || "",
        location: metadata.location || "",
        coordinates: metadata.coordinates || "",
        year: metadata.year || "",
        collection: metadata.collection || "Travel3 Historical Places",
        category: metadata.category || "Historical",
        historicalPeriod: metadata.historicalPeriod || "",
        culturalSignificance: metadata.culturalSignificance || "",
        architecturalStyle: metadata.architecturalStyle || null
      }
    };
    
    try {
      const result = await this.nftCanister.mint(principal, [formattedMetadata]);
      if ('Err' in result) {
        throw new Error(`Minting failed: ${JSON.stringify(result.Err)}`);
      }
      return {
        tokenId: result.Ok[0],
        txId: result.Ok[1]
      };
    } catch (error) {
      console.error("Error minting NFT:", error);
      throw new Error(`Failed to mint NFT: ${error.message}`);
    }
  }
   
  async uploadFile(file) {
    if (!file) return "";
    
    try {
      // Create a batch for the file upload
      const batchResponse = await this.assetCanister.create_batch({});
      const batchId = batchResponse.batch_id;
      
      // Convert file to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      const content = new Uint8Array(arrayBuffer);
      
      // Create a chunk with the file content
      const chunkResponse = await this.assetCanister.create_chunk({
        batch_id: batchId,
        content: content
      });
      
      // Store the file in the asset canister
      const key = `${Date.now()}_${file.name}`;
      await this.assetCanister.commit_batch({
        batch_id: batchId,
        operations: [{
          CreateAsset: {
            key,
            content_type: file.type,
            max_age: [31536000n], // 1 year in seconds
            headers: [],
            enable_aliasing: [true],
            allow_raw_access: [true]
          }
        }, {
          SetAssetContent: {
            key,
            content_encoding: "identity",
            chunk_ids: [chunkResponse.chunk_id],
            sha256: null
          }
        }]
      });
      
      // Return the URL to the uploaded file
      return `/assets/${key}`;
    } catch (error) {
      console.error("Error uploading file:", error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }
}

const nftService = new NFTService();
export default nftService;
