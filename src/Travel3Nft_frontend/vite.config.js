import { resolve } from 'path';
import react from '@vitejs/plugin-react';
import nodePolyfills from 'rollup-plugin-polyfill-node';
import { defineConfig, normalizePath } from 'vite';
import environment from 'vite-plugin-environment';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

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
