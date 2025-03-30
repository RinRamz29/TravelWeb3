import { Principal } from "@dfinity/principal";

/**
 * Retry an operation with exponential backoff
 * @param {Function} operation - The operation to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} initialDelay - Initial delay in ms
 * @returns {Promise<any>} - Result of the operation
 */
export async function retryOperation(operation, maxRetries = 3, initialDelay = 1000) {
  let lastError;
  let delay = initialDelay;
 
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.warn(`Operation failed (attempt ${attempt}/${maxRetries}):`, error);
      lastError = error;
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 1.5; // Exponential backoff
    }
  }
  throw lastError;
}

/**
 * Creates a debounced function that delays invoking the provided function
 * until after the specified wait time has elapsed since the last invocation
 * 
 * @param {Function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to delay
 * @returns {Function} - The debounced function
 */
export function debounce(func, wait = 300) {
  let timeout;
  
  return function(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Format a date string
export function formatDate(dateString) {
  const date = new Date(dateString);
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
}

/**
 * Format a Principal ID to a more readable format
 * @param {Principal|string} principal - The Principal to format
 * @param {Object} options - Formatting options
 * @param {number} options.shortLength - Length of the shortened principal (default: 5)
 * @returns {string} - Formatted principal string
 */
export function formatPrincipal(principal, options = { shortLength: 5 }) {
  if (!principal) return "Unknown";
 
  try {
    const principalStr = principal instanceof Principal ? principal.toString() : principal;
    const length = principalStr.length;
    return `${principalStr.slice(0, options.shortLength)}...${principalStr.slice(length - 4)}`;
  } catch (error) {
    return String(principal).slice(0, 10) + "...";
  }
}

/**
 * Gets a value from local storage with optional parsing
 * @param {string} key - The key to get from local storage
 * @param {any} defaultValue - The default value to return if key doesn't exist
 * @returns {any} - The stored value or default value
 */
export function getStorageItem(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error getting item ${key} from localStorage:`, error);
    return defaultValue;
  }
}

/**
 * Sets a value in local storage with automatic stringification
 * @param {string} key - The key to set in local storage
 * @param {any} value - The value to store
 * @returns {boolean} - Whether the operation was successful
 */
export function setStorageItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error setting item ${key} in localStorage:`, error);
    return false;
  }
}