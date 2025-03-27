/**
 * Formats wallet address for display by showing the first and last characters
 * @param {string} address - The full wallet address
 * @param {number} startChars - Number of starting characters to show (default: 6)
 * @param {number} endChars - Number of ending characters to show (default: 4)
 * @returns {string} Formatted address (e.g., "0x1234...abcd")
 */
export const formatWalletAddress = (address, startChars = 6, endChars = 4) => {
  if (!address || address.length < (startChars + endChars + 3)) {
    return address;
  }
  
  return `${address.substring(0, startChars)}...${address.substring(address.length - endChars)}`;
}; 