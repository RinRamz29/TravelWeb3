// Import Buffer for DFINITY libraries
import { Buffer } from 'buffer';
import process from 'process';

// Make Buffer available globally
window.Buffer = Buffer;

// Ensure process.env is available
window.process = process;

// Add a fallback for certificate verification in development
if (process.env.DFX_NETWORK !== 'ic') {
  // This is a development-only workaround
  const originalFetch = window.fetch;
  window.fetch = (...args) => {
    return originalFetch(...args).catch(err => {
      console.warn('Fetch error:', err);
      throw err;
    });
  };
}
