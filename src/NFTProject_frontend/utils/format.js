// utils/format.js
export const shortenPrincipal = (principal) => {
    if (!principal) return '';
    if (principal.length <= 10) return principal;
    return `${principal.slice(0, 5)}...${principal.slice(-5)}`;
  };
  
  export const formatDate = (timestamp) => {
    if (!timestamp) return '';
    
    // Convert nanoseconds to milliseconds
    const date = new Date(Number(timestamp) / 1000000);
    
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };