import { AuthClient, HttpAgent, identity } from "./dfinity-imports";

// Local development canister ID
const LOCAL_II_CANISTER = "rdmx6-jaaaa-aaaaa-aaadq-cai";

class AuthService {
  constructor() {
    this.authClient = null;
    this.identity = null;
    this.agent = null;
    this.isAuthenticated = false;
    this.principal = null;
  }

  async initialize() {
    this.authClient = await AuthClient.create();
    this.isAuthenticated = await this.authClient.isAuthenticated();
    
    if (this.isAuthenticated) {
      this.identity = this.authClient.getIdentity();
      this.principal = this.identity.getPrincipal();
      this.agent = new HttpAgent({ identity: this.identity });
      
      // When in development, we need to fetch the root key
      if (process.env.NODE_ENV !== "production") {
        this.agent.fetchRootKey();
      }
    }
    
    return this.isAuthenticated;
  }

  async login() {
    return new Promise((resolve) => {
      this.authClient.login({
        identityProvider: process.env.NODE_ENV === "production" 
          ? "https://identity.ic0.app" 
          : `http://localhost:8000?canisterId=${LOCAL_II_CANISTER}`,
        onSuccess: async () => {
          this.isAuthenticated = true;
          this.identity = this.authClient.getIdentity();
          this.principal = this.identity.getPrincipal();
          this.agent = new HttpAgent({ identity: this.identity });
          
          if (process.env.NODE_ENV !== "production") {
            this.agent.fetchRootKey();
          }
          
          resolve(true);
        },
        onError: (error) => {
          console.error("Login failed:", error);
          resolve(false);
        }
      });
    });
  }

  async logout() {
    await this.authClient.logout();
    this.isAuthenticated = false;
    this.identity = null;
    this.principal = null;
    this.agent = null;
    
    // Reload the page to reset the application state
    window.location.reload();
  }

  getPrincipal() {
    return this.principal;
  }

  getIdentity() {
    return this.identity;
  }

  getAgent() {
    return this.agent;
  }
}

// Create a singleton instance
const authService = new AuthService();

export default authService;
