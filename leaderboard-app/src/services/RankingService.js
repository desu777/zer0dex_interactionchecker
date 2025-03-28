/**
 * Usługa do zarządzania rankingiem portfeli
 */
const DatabaseService = require('./DatabaseService');

class RankingService {
  constructor() {
    this.dbService = new DatabaseService();
    this.rankingCache = new Map(); // Cache na pozycje w rankingu (adres -> dane rankingowe)
    this.lastUpdateTime = null;
  }

  /**
   * Inicjalizacja usługi rankingowej
   */
  async initialize() {
    try {
      await this.dbService.initialize();
      console.log('Usługa rankingowa zainicjalizowana');
      
      // Sprawdź, czy tabela sorted_wallet_rankings istnieje
      const tableExists = await this.checkIfSortedTableExists();
      
      if (!tableExists) {
        console.log('Tabela sorted_wallet_rankings nie istnieje - używam standardowego mechanizmu rankingowego');
      } else {
        console.log('Tabela sorted_wallet_rankings znaleziona - używam zoptymalizowanego mechanizmu rankingowego');
      }
      
      return true;
    } catch (error) {
      console.error('Błąd podczas inicjalizacji usługi rankingowej:', error);
      throw error;
    }
  }

  /**
   * Sprawdza, czy tabela sorted_wallet_rankings istnieje
   */
  async checkIfSortedTableExists() {
    try {
      const result = await this.dbService.getQuery(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='sorted_wallet_rankings'
      `);
      
      return result && result.name === 'sorted_wallet_rankings';
    } catch (error) {
      console.error('Błąd podczas sprawdzania tabeli sorted_wallet_rankings:', error);
      return false;
    }
  }

  /**
   * Aktualizuje ranking wszystkich portfeli
   * Zapisuje dane rankingowe w cache dla szybkiego dostępu
   */
  async updateRankings() {
    try {
      console.log('Aktualizacja rankingu portfeli...');
      
      // Sprawdź, czy tabela sorted_wallet_rankings istnieje
      const useSortedTable = await this.checkIfSortedTableExists();
      
      if (useSortedTable) {
        // Jeśli tabela istnieje, pobierz rankingi z tabeli
        const wallets = await this.dbService.allQuery(`
          SELECT 
            ranking_position,
            address, 
            total_interactions,
            total_wallets
          FROM sorted_wallet_rankings 
          ORDER BY ranking_position ASC
        `);
        
        console.log(`Pobrano ${wallets.length} portfeli do cache z posortowanej tabeli rankingowej`);
        
        // Wyczyść poprzedni cache
        this.rankingCache.clear();
        
        // Zapisz dane w cache
        wallets.forEach(wallet => {
          const position = wallet.ranking_position;
          const totalWallets = wallet.total_wallets;
          const percentile = (position / totalWallets * 100).toFixed(2);
          const betterThan = totalWallets - position;
          
          // Zapisz w cache
          this.rankingCache.set(wallet.address.toLowerCase(), {
            position,
            percentile,
            totalWallets,
            betterThan,
            totalInteractions: wallet.total_interactions
          });
        });
      } else {
        // Jeśli tabela nie istnieje, użyj standardowego mechanizmu
        const wallets = await this.dbService.allQuery(`
          SELECT 
            address, 
            total_interactions,
            (SELECT COUNT(*) FROM wallet_stats) as total_wallets
          FROM wallet_stats 
          ORDER BY total_interactions DESC
        `);
        
        console.log(`Pobrano ${wallets.length} portfeli do rankingu`);
        
        // Wyczyść poprzedni cache
        this.rankingCache.clear();
        
        // Oblicz pozycje rankingowe i zapisz w cache
        wallets.forEach((wallet, index) => {
          const position = index + 1; // Pozycja rankingowa (1-based)
          const totalWallets = wallet.total_wallets;
          const percentile = (position / totalWallets * 100).toFixed(2);
          const betterThan = totalWallets - position;
          
          // Zapisz w cache
          this.rankingCache.set(wallet.address.toLowerCase(), {
            position,
            percentile,
            totalWallets,
            betterThan,
            totalInteractions: wallet.total_interactions
          });
        });
      }
      
      this.lastUpdateTime = new Date();
      console.log(`Ranking zaktualizowany, ${this.rankingCache.size} pozycji w cache`);
      
      return true;
    } catch (error) {
      console.error('Błąd podczas aktualizacji rankingu:', error);
      return false;
    }
  }

  /**
   * Pobiera dane rankingowe dla określonego portfela
   * @param {string} walletAddress - Adres portfela
   * @returns {Object|null} Dane rankingowe lub null, jeśli portfel nie istnieje w rankingu
   */
  async getWalletRanking(walletAddress) {
    try {
      const normalizedAddress = walletAddress.toLowerCase();
      
      // Sprawdź, czy tabela sorted_wallet_rankings istnieje
      const useSortedTable = await this.checkIfSortedTableExists();
      
      // Jeśli dane są w cache, zwróć je natychmiast
      if (this.rankingCache.has(normalizedAddress)) {
        return this.rankingCache.get(normalizedAddress);
      }
      
      if (useSortedTable) {
        // Pobierz ranking bezpośrednio z posortowanej tabeli
        const ranking = await this.dbService.getQuery(`
          SELECT 
            ranking_position as position,
            total_interactions,
            total_wallets,
            (ranking_position * 100.0 / total_wallets) as percentile,
            (total_wallets - ranking_position) as better_than
          FROM sorted_wallet_rankings 
          WHERE address = ?
        `, [normalizedAddress]);
        
        if (!ranking) {
          console.log(`Portfel ${normalizedAddress} nie znaleziony w tabeli rankingowej`);
          return null;
        }
        
        // Przygotuj dane rankingowe
        const result = {
          position: ranking.position,
          percentile: ranking.percentile.toFixed(2),
          totalWallets: ranking.total_wallets,
          betterThan: ranking.better_than,
          totalInteractions: ranking.total_interactions
        };
        
        // Zapisz w cache i zwróć
        this.rankingCache.set(normalizedAddress, result);
        return result;
      } else {
        // Jeśli nie ma posortowanej tabeli, użyj standardowego mechanizmu
        
        // Jeśli nie ma w cache, sprawdź, czy portfel istnieje w bazie
        const wallet = await this.dbService.getQuery(
          'SELECT address, total_interactions FROM wallet_stats WHERE address = ?',
          [normalizedAddress]
        );
        
        if (!wallet) {
          console.log(`Portfel ${normalizedAddress} nie znaleziony w bazie`);
          return null;
        }
        
        // Pobierz pozycję rankingową portfela
        const rankData = await this.dbService.getQuery(`
          SELECT 
            COUNT(*) as position,
            (SELECT COUNT(*) FROM wallet_stats) as total_wallets
          FROM wallet_stats 
          WHERE total_interactions > (
            SELECT total_interactions FROM wallet_stats WHERE address = ?
          )
        `, [normalizedAddress]);
        
        if (!rankData) {
          console.log(`Nie można określić rankingu dla ${normalizedAddress}`);
          return null;
        }
        
        // Pozycja to liczba portfeli z większą liczbą interakcji + 1
        const position = rankData.position + 1;
        const totalWallets = rankData.total_wallets;
        const percentile = (position / totalWallets * 100).toFixed(2);
        const betterThan = totalWallets - position;
        
        // Zapisz w cache i zwróć
        const result = {
          position,
          percentile,
          totalWallets,
          betterThan,
          totalInteractions: wallet.total_interactions
        };
        
        this.rankingCache.set(normalizedAddress, result);
        return result;
      }
    } catch (error) {
      console.error(`Błąd podczas pobierania rankingu dla ${walletAddress}:`, error);
      return null;
    }
  }

  /**
   * Pobiera pozycję portfela w rankingu
   * @param {string} walletAddress - Adres portfela
   * @returns {number|null} Pozycja w rankingu lub null, jeśli portfel nie istnieje
   */
  async getWalletPosition(walletAddress) {
    const ranking = await this.getWalletRanking(walletAddress);
    return ranking ? ranking.position : null;
  }

  /**
   * Pobiera globalną liczbę portfeli
   * @returns {number} Całkowita liczba portfeli
   */
  async getTotalWalletsCount() {
    try {
      const result = await this.dbService.getQuery('SELECT COUNT(*) as count FROM wallet_stats');
      return result ? result.count : 0;
    } catch (error) {
      console.error('Błąd podczas pobierania liczby portfeli:', error);
      return 0;
    }
  }

  /**
   * Zamyka połączenie z bazą danych
   */
  async close() {
    await this.dbService.close();
  }
}

module.exports = RankingService; 