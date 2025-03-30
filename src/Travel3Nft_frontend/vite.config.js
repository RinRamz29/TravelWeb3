import { resolve } from 'path';
import react from '@vitejs/plugin-react';
import nodePolyfills from 'rollup-plugin-polyfill-node';
import { defineConfig, loadEnv } from 'vite';
import environment from 'vite-plugin-environment';
import dotenv from 'dotenv';

// Load environment variables from project root and local .env files
dotenv.config({ path: '../../.env' }); 
dotenv.config({ path: './.env.local' });

export default defineConfig({
  optimizeDeps: {
    esbuildOptions: {
      // Node.js global to browser globalThis
      define: {
        global: "globalThis",
      },
    },
    // Add all DFINITY packages to be pre-bundled
    include: [
      '@dfinity/auth-client', 
      '@dfinity/agent', 
      '@dfinity/principal', 
      '@dfinity/identity', 
      '@dfinity/candid'
    ]
  },
  // Define global variables
  define: {
    // Buffer is used by DFINITY libraries
    'global.Buffer': ['buffer', 'Buffer'], 
    // Explicitly define environment variables
    'process.env.CANISTER_ID_TRAVEL3NFT_BACKEND': JSON.stringify(process.env.CANISTER_ID_TRAVEL3NFT_BACKEND || process.env.VITE_CANISTER_ID_TRAVEL3NFT_BACKEND),
    'process.env.CANISTER_ID_TRAVEL3NFT_FRONTEND': JSON.stringify(process.env.CANISTER_ID_TRAVEL3NFT_FRONTEND || process.env.VITE_CANISTER_ID_TRAVEL3NFT_FRONTEND),
    'process.env.DFX_NETWORK': JSON.stringify(process.env.DFX_NETWORK || process.env.VITE_DFX_NETWORK || 'local'),
    // Empty object for other process.env references
    'process.env': {}
  },
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:4943",
        changeOrigin: true,
      },
    },
  },
  // Configure path aliases
  resolve: {
    alias: {
      '@dfinity/identity': resolve(__dirname, 'node_modules/@dfinity/identity'),
      declarations: resolve(__dirname, '../declarations'),
      buffer: 'buffer/',
      stream: 'stream-browserify',
      util: 'util',
      events: 'events',
    },
  },
  plugins: [
    react(),
    environment("all", { prefix: "CANISTER_" }), 
    environment("all", { prefix: "VITE_" }),
    environment("all", { prefix: "DFX_" }),
  ],
  build: {
    rollupOptions: {
      plugins: [
        // Enable Node.js polyfills for browser
        nodePolyfills()
      ]
    }
  }
});
