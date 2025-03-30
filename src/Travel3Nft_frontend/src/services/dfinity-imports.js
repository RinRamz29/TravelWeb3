import { Actor, HttpAgent } from "@dfinity/agent";
import { AuthClient } from "@dfinity/auth-client";
import { idlFactory as backendIdlFactory } from "../../../declarations/Travel3Nft_backend/Travel3Nft_backend.did.js";
import { idlFactory as frontendIdlFactory } from "../../../declarations/Travel3Nft_frontend/Travel3Nft_frontend.did.js";
import { canisterId as backendCanisterId } from "../../../declarations/Travel3Nft_backend";
import { canisterId as frontendCanisterId } from "../../../declarations/Travel3Nft_frontend";

export const BACKEND_CANISTER_ID = backendCanisterId;
export const FRONTEND_CANISTER_ID = frontendCanisterId;

// Global actors
let globalAgent = null;
export let backendActor = null;
export let frontendActor = null;

export function checkActorsAvailable() {
  return {
    backendActor: backendActor !== null,
    frontendActor: frontendActor !== null,
    backendCanisterId: BACKEND_CANISTER_ID,
    frontendCanisterId: FRONTEND_CANISTER_ID
  };
}

export async function createBackendActor(identity) {
  try {
    const agent = new HttpAgent({ identity });
    globalAgent = agent;
    
    // When not on the IC, we need to fetch the root key
    if (process.env.DFX_NETWORK !== "ic") {
      try {
        await agent.fetchRootKey().catch(err => console.warn("Unable to fetch root key. Check to ensure that your local replica is running", err));
      } catch (error) {
        console.error("Error fetching root key:", error);
      }
    }
    
    backendActor = await Actor.createActor(backendIdlFactory, { agent, canisterId: BACKEND_CANISTER_ID });
    return backendActor;
  } catch (error) {
    console.error("Error creating backend actor:", error);
    throw error;
  }
}

export async function createFrontendActor(identity) {
  try {
    const agent = new HttpAgent({ identity });
    globalAgent = agent;
    
    // When not on the IC, we need to fetch the root key
    if (process.env.DFX_NETWORK !== "ic") {
      try {
        await agent.fetchRootKey().catch(err => console.warn("Unable to fetch root key. Check to ensure that your local replica is running", err));
      } catch (error) {
        console.error("Error fetching root key:", error);
      }
    }
    
    frontendActor = await Actor.createActor(frontendIdlFactory, { agent, canisterId: FRONTEND_CANISTER_ID });
    return frontendActor;
  } catch (error) {
    console.error("Error creating frontend actor:", error);
    throw error;
  }
}

/**
 * Create an actor with custom options, particularly useful for disabling certificate verification in local development
 * @param {Identity} identity - The user's identity
 * @param {Object} options - Custom options for the actor
 * @param {string} options.host - The host URL (default: localhost:8000)
 * @param {boolean} options.disableCertificateVerification - Whether to disable certificate verification
 * @returns {Promise<Actor>} The created actor
 */
export async function createActorWithOptions(identity, options = {}) {
  try {
    const agentOptions = { identity };
    
    // If a host is specified, use it
    if (options.host) {
      agentOptions.host = options.host;
    }
    
    const agent = new HttpAgent(agentOptions);
    globalAgent = agent;
    
    // When not on the IC, we need to fetch the root key
    if (process.env.DFX_NETWORK !== "ic") {
      if (options.disableCertificateVerification) {
        agent.fetchRootKey = () => Promise.resolve(new Uint8Array(32).fill(0));
      } else {
        await agent.fetchRootKey().catch(err => console.warn("Unable to fetch root key. Check to ensure that your local replica is running", err));
      }
    }
    
    return Actor.createActor(frontendIdlFactory, { agent, canisterId: FRONTEND_CANISTER_ID });
  } catch (error) {
    console.error("Error creating actor with custom options:", error);
    throw error;
  }
}

// Initialize actors on module load
(async () => {
  try {
    const authClient = await AuthClient.create();
    const identity = await authClient.getIdentity();
    
    backendActor = await createBackendActor(identity);
    frontendActor = await createFrontendActor(identity);
  } catch (error) {
    console.error("Error initializing actors:", error);
  }
})();
