import { Travel3Nft_backend } from '../../../declarations/Travel3Nft_backend';
import authService from './authService';

class NftService {
  async getAllTokens() {
    try {
      return await Travel3Nft_backend.getAllTokens();
    } catch (error) {
      console.error('Error fetching all tokens:', error);
      throw error;
    }
  }

  async getTokenById(tokenId) {
    try {
      return await Travel3Nft_backend.getTokenById(tokenId);
    } catch (error) {
      console.error(`Error fetching token #${tokenId}:`, error);
      throw error;
    }
  }

  async getTokensByOwner(owner) {
    try {
      return await Travel3Nft_backend.getTokensByOwner(owner);
    } catch (error) {
      console.error(`Error fetching tokens for owner ${owner}:`, error);
      throw error;
    }
  }

  async getUserTokens() {
    if (!authService.isAuthenticated) {
      throw new Error('User is not authenticated');
    }

    try {
      const principal = authService.getPrincipal();
      return await this.getTokensByOwner(principal);
    } catch (error) {
      console.error('Error fetching user tokens:', error);
      throw error;
    }
  }

  // This would be implemented when the backend supports it
  async transferToken(tokenId, to) {
    if (!authService.isAuthenticated) {
      throw new Error('User is not authenticated');
    }

    try {
      // This is a placeholder for when the backend implements token transfer
      // return await Travel3Nft_backend.transferToken(tokenId, to);
      throw new Error('Transfer functionality not yet implemented');
    } catch (error) {
      console.error(`Error transferring token #${tokenId}:`, error);
      throw error;
    }
  }

  // This would be implemented when the backend supports it
  async makeOffer(tokenId, price) {
    if (!authService.isAuthenticated) {
      throw new Error('User is not authenticated');
    }

    try {
      // This is a placeholder for when the backend implements marketplace functionality
      // return await Travel3Nft_backend.makeOffer(tokenId, price);
      throw new Error('Marketplace functionality not yet implemented');
    } catch (error) {
      console.error(`Error making offer for token #${tokenId}:`, error);
      throw error;
    }
  }
}

// Create a singleton instance
const nftService = new NftService();

export default nftService;
