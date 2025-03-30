import { Travel3Nft_backend } from '../../../declarations/Travel3Nft_backend';
import authService from './authService';
import { Principal } from '@dfinity/principal';

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

  async transferToken(tokenId, to) {
    if (!authService.isAuthenticated) {
      throw new Error('User is not authenticated');
    }

    try {
      throw new Error('Transfer functionality not yet implemented');
    } catch (error) {
      console.error(`Error transferring token #${tokenId}:`, error);
      throw error;
    }
  }

  async makeOffer(tokenId, price) {
    if (!authService.isAuthenticated) {
      throw new Error('User is not authenticated');
    }

    try {
      throw new Error('Marketplace functionality not yet implemented');
    } catch (error) {
      console.error(`Error making offer for token #${tokenId}:`, error);
      throw error;
    }
  }

  async setImageLocation(tokenId, location) {
    try {
      return await Travel3Nft_backend.setImageLocation(tokenId, location);
    } catch (error) {
      console.error(`Error setting image location for token #${tokenId}:`, error);
      throw error;
    }
  }

  async setDocumentLocation(tokenId, location) {
    try {
      return await Travel3Nft_backend.setDocumentLocation(tokenId, location);
    } catch (error) {
      console.error(`Error setting document location for token #${tokenId}:`, error);
      throw error;
    }
  }

  async mintNFT(metadata) {
    if (!authService.isAuthenticated) {
      throw new Error('User is not authenticated');
    }

    try {
      const principal = authService.getPrincipal();
      const result = await Travel3Nft_backend.mint(Principal.fromText(principal), metadata);
      if ('Ok' in result) {
        const [tokenId, txId] = result.Ok;
        return { tokenId, txId };
      } else {
        throw new Error(result.Err);
      }
    } catch (error) {
      console.error('Error minting NFT:', error);
      throw error;
    }
  }
}

// Create a singleton instance
const nftService = new NftService();

export default nftService;
