// services/custodianService.js

import { Travel3Nft_backend } from '../../../declarations/Travel3Nft_backend';
import authService from './authService';

class CustodianService {
  constructor() {
    this.isCustodianCache = null;
    this.custodianListCache = null;
    this.lastCacheTime = null;
    this.cacheExpiration = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Check if the current user is a custodian
   * @returns {Promise<boolean>} True if user is a custodian, false otherwise
   */
  async isCustodian() {
    if (!authService.isAuthenticated) {
      return false;
    }

    // Use cached result if available and not expired
    if (this.isCustodianCache !== null && this.lastCacheTime && 
        (Date.now() - this.lastCacheTime < this.cacheExpiration)) {
      return this.isCustodianCache;
    }

    try {
      const principal = authService.getPrincipal();
      const custodians = await this.getAllCustodians();
      
      this.isCustodianCache = custodians.some(
        custodian => custodian.toText() === principal
      );
      this.lastCacheTime = Date.now();
      
      return this.isCustodianCache;
    } catch (error) {
      console.error('Error checking custodian status:', error);
      return false;
    }
  }

  /**
   * Get all custodians
   * @returns {Promise<Principal[]>} Array of custodian principals
   */
  async getAllCustodians() {
    // Use cached result if available and not expired
    if (this.custodianListCache && this.lastCacheTime && 
        (Date.now() - this.lastCacheTime < this.cacheExpiration)) {
      return this.custodianListCache;
    }

    try {
      this.custodianListCache = await Travel3Nft_backend.who_are_custodians();
      this.lastCacheTime = Date.now();
      return this.custodianListCache;
    } catch (error) {
      console.error('Error fetching custodians:', error);
      throw error;
    }
  }

  /**
   * Add a new custodian
   * @param {string} principalId - Principal ID to add as custodian
   * @returns {Promise<Object>} Result of the operation
   */
  async addCustodian(principalId) {
    if (!authService.isAuthenticated) {
      throw new Error('User is not authenticated');
    }

    try {
      const result = await Travel3Nft_backend.addCustodian(principalId);
      // Invalidate cache after modification
      this.custodianListCache = null;
      this.lastCacheTime = null;
      return result;
    } catch (error) {
      console.error('Error adding custodian:', error);
      throw error;
    }
  }

  /**
   * Remove a custodian
   * @param {string} principalId - Principal ID to remove from custodians
   * @returns {Promise<Object>} Result of the operation
   */
  async removeCustodian(principalId) {
    if (!authService.isAuthenticated) {
      throw new Error('User is not authenticated');
    }

    try {
      const result = await Travel3Nft_backend.removeCustodian(principalId);
      // Invalidate cache after modification
      this.custodianListCache = null;
      this.lastCacheTime = null;
      return result;
    } catch (error) {
      console.error('Error removing custodian:', error);
      throw error;
    }
  }
}

// Create a singleton instance
const custodianService = new CustodianService();
export default custodianService;