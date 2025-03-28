/**
 * Pobiera dane rankingowe dla portfela z API leaderboard
 * @param {string} walletAddress - Adres portfela
 * @returns {Promise<Object|null>} Dane rankingowe lub null w przypadku błędu
 */
async getWalletRanking(walletAddress) {
  try {
    // Najpierw sprawdź czy portfel miał interakcje
    const interactions = await this.checkWalletInteractions(walletAddress);
    if (!interactions || interactions.total === 0) {
      console.log('Portfel nie ma interakcji, nie pobierano rankingu');
      return null;
    }
    
    console.log(`Pobieranie danych rankingowych dla ${walletAddress}`);
    const response = await fetch(`${this.apiBaseUrl}/wallet-ranking/${walletAddress}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log('Portfel nie znaleziony w rankingu');
        return null;
      }
      throw new Error(`API zwróciło status ${response.status}`);
    }
    
    const data = await response.json();
    return data.ranking;
  } catch (error) {
    console.error('Błąd podczas pobierania rankingu:', error);
    return null;
  }
} 