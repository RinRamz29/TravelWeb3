// This file sets up polyfills needed for DFINITY libraries to work in the browser

// Buffer polyfill
import { Buffer } from 'buffer';
window.Buffer = Buffer;

// Process polyfill
import process from 'process';
window.process = process;

// Other globals that might be needed
window.global = window;
window.globalThis.process = process;

// Fix for TextEncoder/TextDecoder if needed
if (typeof window.TextEncoder === 'undefined') {
  window.TextEncoder = TextEncoder;
}

if (typeof window.TextDecoder === 'undefined') {
  window.TextDecoder = TextDecoder;
}

// Console message to confirm polyfills are loaded
console.log('Polyfills loaded successfully');
