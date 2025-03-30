// Create a new service for custodian-related functionality
// services/custodianService.js

import { Actor, HttpAgent } from '@dfinity/agent';
import { idlFactory } from '../../../declarations/Travel3Nft_backend/index';
import { AuthClient } from '@dfinity/auth-client';

const NFT_CANISTER_ID = import.meta.env.VITE_NFT_CANISTER_ID || process.env.CANISTER_ID_TRAVEL3NFT_BACKEND;

class CustodianService {
  constructor() {
    this.agent = null;
    this.nftActor = null;
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    
    try {
      const authClient = await AuthClient.create();
      const identity = authClient.getIdentity();
      
      this.agent = new HttpAgent({ identity });
      // Don't forget to remove in production
      if (process.env.NODE_ENV !== 'production') {
        await this.agent.fetchRootKey();
      }
      
      this.nftActor = Actor.createActor(idlFactory, {
        agent: this.agent,
        canisterId: NFT_CANISTER_ID,
      });
      
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize CustodianService:', error);
      throw error;
    }
  }

  async isCustodian(principal) {
    try {
      await this.init();
      const custodians = await this.nftActor.who_are_custodians();
      return custodians.some(custodian => 
        custodian.toText() === principal.toText()
      );
    } catch (error) {
      console.error('Error checking custodian status:', error);
      return false;
    }
  }

  async getAllCustodians() {
    try {
      await this.init();
      return await this.nftActor.who_are_custodians();
    } catch (error) {
      console.error('Error getting custodians:', error);
      return [];
    }
  }
}

export default new CustodianService();
