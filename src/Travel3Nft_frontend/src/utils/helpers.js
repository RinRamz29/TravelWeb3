/**
 * Formats a date object to a human-readable string.
 * @param {Date} date - The date to format.
 * @returns {string} The formatted date string.
 */
export const formatDate = (date) => {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(date).toLocaleDateString('en-US', options);
};

/**
 * Truncates a string to a specified length, adding an ellipsis if necessary.
 * @param {string} text - The text to truncate.
 * @param {number} length - The maximum length of the string.
 * @returns {string} The truncated string.
 */
export const truncateText = (text, length = 25) => {
  if (text.length <= length) return text;
  return `${text.substring(0, length)}...`;
};

/**
 * Formats a principal ID to a shortened version.
 * @param {string} principal - The principal ID
 * @returns {string} Formatted principal ID
 */
export const formatPrincipal = (principal = '') => {
  if (!principal) return '';
  if (principal.length <= 10) return principal;
  return `${principal.substring(0, 5)}...${principal.substring(principal.length - 5)}`;
};
