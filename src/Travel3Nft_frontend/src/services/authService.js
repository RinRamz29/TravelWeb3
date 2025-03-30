// authService.js
import { AuthClient } from "@dfinity/auth-client";
import { Principal } from "@dfinity/principal";

// Create a singleton instance variable but don't initialize it yet
let instance = null;

class AuthService {
  constructor() {
    this.authClient = null;
    this.identity = null;
    this.principal = null;
    this.isAuthenticated = false;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return true;
    
    try {
      console.log("Initializing AuthService...");
      this.authClient = await AuthClient.create();
      
      // Check if the user is already authenticated
      const isAuthenticated = await this.authClient.isAuthenticated();
      this.isAuthenticated = isAuthenticated;
      
      if (isAuthenticated) {
        this.identity = this.authClient.getIdentity();
        this.principal = this.identity.getPrincipal();
        console.log("User is already authenticated with principal:", this.principal.toString());
      } else {
        console.log("User is not authenticated");
      }
      
      this.initialized = true;
      return true;
    } catch (error) {
      console.error("Error initializing auth service:", error);
      throw error;
    }
  }

  async isLoggedIn() {
    if (!this.authClient) {
      await this.initialize();
    }
    
    try {
      const isAuthenticated = await this.authClient.isAuthenticated();
      this.isAuthenticated = isAuthenticated;
      return isAuthenticated;
    } catch (error) {
      console.error("Error checking authentication status:", error);
      return false;
    }
  }

  async login() {
    if (!this.authClient) {
      await this.initialize();
    }
    
    try {
      return new Promise((resolve) => {
        this.authClient.login({
          identityProvider: process.env.II_URL || "https://identity.ic0.app",
          onSuccess: async () => {
            this.identity = this.authClient.getIdentity();
            this.principal = this.identity.getPrincipal();
            this.isAuthenticated = true;
            console.log("Login successful. Principal:", this.principal.toString());
            resolve(true);
          },
          onError: (error) => {
            console.error("Login error:", error);
            resolve(false);
          }
        });
      });
    } catch (error) {
      console.error("Error during login:", error);
      return false;
    }
  }

  async logout() {
    if (!this.authClient) {
      await this.initialize();
    }
    
    try {
      await this.authClient.logout();
      this.identity = null;
      this.principal = null;
      this.isAuthenticated = false;
      console.log("Logout successful");
      
      // Reload the page to reset the application state
      window.location.reload();
      return true;
    } catch (error) {
      console.error("Error during logout:", error);
      return false;
    }
  }

  // Method for getting the identity (used by NFTService)
  async getIdentity() {
    if (!this.authClient) {
      await this.initialize();
    }
    
    if (await this.isLoggedIn()) {
      this.identity = this.authClient.getIdentity();
      return this.identity;
    }
    
    return null;
  }
  
  // Alternative method name for backward compatibility
  async getLoggedInIdentity() {
    return this.getIdentity();
  }
  
  // Method for getting the principal directly
  async getPrincipal() {
    if (!this.identity) {
      const identity = await this.getIdentity();
      if (!identity) return null;
    }
    
    this.principal = this.identity.getPrincipal();
    return this.principal;
  }

  // Synchronous method to get the current principal (used by NFTService)
  getLoggedInPrincipal() {
    if (this.identity) {
      return this.identity.getPrincipal();
    }
    return null;
  }
}

// Create the singleton instance only once
const getInstance = () => {
  if (!instance) {
    instance = new AuthService();
  }
  return instance;
};

// Create a pre-initialized singleton instance
const authService = getInstance();

// Export the instance as default and as a named export
export default authService;
export { authService };