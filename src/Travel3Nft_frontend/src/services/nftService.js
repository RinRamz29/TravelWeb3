import { Travel3Nft_backend } from "../../../declarations/Travel3Nft_backend";
import authService from "./authService";

class NFTService {
  constructor() {
    this.nftCanister = Travel3Nft_backend;
  }

  async getUserNFTs() {
    if (!authService.isAuthenticated) {
      return [];
    }
    
    const principal = authService.getPrincipal();
    return await this.nftCanister.getUserTokens(principal);
  }

  async getNFTDetails(tokenId) {
    // This will be replaced with actual canister call
    // For now, return mock data
    return null;
  }
  
  async mintNFT(metadata) {
    if (!authService.isAuthenticated) {
      throw new Error("Authentication required to mint NFTs");
    }
    
    const principal = authService.getPrincipal();
    return await this.nftCanister.mint(principal, [metadata]);
  }
}

const nftService = new NFTService();
export default nftService;
