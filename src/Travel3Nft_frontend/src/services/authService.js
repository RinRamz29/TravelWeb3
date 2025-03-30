import { AuthClient, HttpAgent } from "./dfinity-imports";

// Get the Internet Identity canister ID from environment variables or use the default local one
let LOCAL_II_CANISTER;
try {
  LOCAL_II_CANISTER = process.env.CANISTER_ID_INTERNET_IDENTITY || "bkyz2-fmaaa-aaaaa-qaaaq-cai";
} catch (e) {
  LOCAL_II_CANISTER = "bkyz2-fmaaa-aaaaa-qaaaq-cai";
}

// Configuration for auth client
const AUTH_IDLE_TIMEOUT = 1000 * 60 * 30; // 30 minutes
const AUTH_HOST = process.env.NODE_ENV !== "production" ? "http://localhost:8000" : undefined;

class AuthService {
  constructor() {
    this.authClient = null;
    this.identity = null;
    this.agent = null;
    this.isAuthenticated = false;
    this.principal = null;
  }

  async initialize() {
    this.authClient = await AuthClient.create({
      idleOptions: { idleTimeout: AUTH_IDLE_TIMEOUT },
      host: AUTH_HOST
    });
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

  getIdentityProviderUrl() {
    if (process.env.NODE_ENV === "production") {
      return "https://identity.ic0.app";
    } else {
      // For local development
      return `http://${LOCAL_II_CANISTER}.localhost:8000`;
    }
  }

  async login() {
    return new Promise((resolve) => {
      const identityProvider = this.getIdentityProviderUrl();
      console.log("Using identity provider:", identityProvider);
      
      this.authClient.login({
        identityProvider,
        onSuccess: () => {
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
