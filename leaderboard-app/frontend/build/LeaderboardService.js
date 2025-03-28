import axios from 'axios';

class LeaderboardService {
  constructor() {
    this.apiBaseUrl = '/api';
  }

  /**
   * Fetches leaderboard data from API
   * @param {string} timeRange - Time range for data ('day', 'week', 'month', 'all')
   * @returns {Promise<Array>} - Leaderboard data
   */
  async getLeaderboardData(timeRange = 'all') {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/leaderboard`, {
        params: { timeRange }
      });
      
      return response.data;
    } catch (error) {
      console.error("Error fetching leaderboard data:", error);
      throw error;
    }
  }

  /**
   * Fetches statistics about leaderboard data
   * @returns {Promise<Object>} - Stats object with counts and totals
   */
  async getLeaderboardStats() {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/leaderboard/stats`);
      return response.data;
    } catch (error) {
      console.error("Error fetching leaderboard stats:", error);
      throw error;
    }
  }

  /**
   * Gets detailed information for a specific wallet
   * @param {string} address - Wallet address
   * @returns {Promise<Object>} - Wallet details
   */
  async getWalletDetails(address) {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/wallet/${address}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching details for wallet ${address}:`, error);
      throw error;
    }
  }

  /**
   * Gets the current data update status
   * @returns {Promise<Object>} - Status object with last update time and sync status
   */
  async getDataUpdateStatus() {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/status`);
      return response.data;
    } catch (error) {
      console.error("Error fetching data update status:", error);
      throw error;
    }
  }
}

export default new LeaderboardService();