const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite3').verbose();
const config = require('../config/config');
const path = require('path');

class DatabaseService {
  constructor() {
    this.dbPath = config.DATABASE.file;
    this.db = null;
  }

  /**
   * Inicjalizacja połączenia z bazą danych SQLite
   */
  async initialize() {
    try {
      return new Promise((resolve, reject) => {
        this.db = new sqlite3.Database(this.dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, async (err) => {
          if (err) {
            console.error('Błąd podczas otwierania bazy SQLite:', err);
            reject(err);
            return;
          }
          
          console.log('Połączenie z bazą SQLite ustanowione pomyślnie');
          
          // Włączamy tryb foreign keys
          this.db.run('PRAGMA foreign_keys = ON');
          
          // Inicjalizujemy tabele
          try {
            await this.initializeTables();
            resolve(true);
          } catch (tableErr) {
            reject(tableErr);
          }
        });
      });
    } catch (error) {
      console.error('Błąd podczas inicjalizacji bazy danych:', error);
      throw error;
    }
  }

  /**
   * Tworzy wymagane tabele w bazie danych
   */
  async initializeTables() {
    try {
      // Utwórz tabelę update_info
      await this.runQuery(`
        CREATE TABLE IF NOT EXISTS update_info (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          key TEXT UNIQUE,
          value TEXT,
          update_time DATETIME DEFAULT CURRENT_TIMESTAMP,
          total_wallets INTEGER NOT NULL DEFAULT 0,
          total_interactions INTEGER NOT NULL DEFAULT 0,
          last_processed_offset INTEGER DEFAULT NULL
        )
      `);
      console.log('Tabela update_info utworzona pomyślnie');

      // Utwórz tabelę stats_summary dla przechowywania ogólnych statystyk
      await this.runQuery(`
        CREATE TABLE IF NOT EXISTS stats_summary (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          total_wallets INTEGER NOT NULL DEFAULT 0,
          total_interactions INTEGER NOT NULL DEFAULT 0,
          last_update DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('Tabela stats_summary utworzona pomyślnie');

      // Utwórz osobną tabelę dla ostatniego sprawdzonego bloku
      await this.db.run(`
        CREATE TABLE IF NOT EXISTS last_checked_block (
          block_number INTEGER NOT NULL,
          check_time DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('Tabela last_checked_block utworzona pomyślnie');

      // Następnie utwórz tabelę wallet_stats
      await this.db.run(`
        CREATE TABLE IF NOT EXISTS wallet_stats (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          address TEXT NOT NULL,
          swap_interactions INTEGER NOT NULL DEFAULT 0,
          pool_interactions INTEGER NOT NULL DEFAULT 0,
          approve_interactions INTEGER NOT NULL DEFAULT 0,
          total_interactions INTEGER NOT NULL DEFAULT 0,
          total_gas_used TEXT DEFAULT '0',
          first_interaction_date TEXT,
          last_interaction_date TEXT,
          create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
          update_time DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('Tabela wallet_stats utworzona pomyślnie');

      // Następnie utwórz indeks dla adresu portfela
      await this.db.run(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_wallet_address ON wallet_stats (address)
      `);
      console.log('Indeks dla adresu portfela utworzony pomyślnie');
    } catch (error) {
      console.error('Błąd podczas inicjalizacji tabel:', error);
      throw error;
    }
  }

  /**
   * Wykonuje zapytanie SQL, które nie zwraca wyników
   * @param {string} query - Zapytanie SQL
   * @param {Array} params - Parametry zapytania
   * @returns {Promise<void>}
   */
  runQuery(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(query, params, function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }

  /**
   * Wykonuje zapytanie SQL, które zwraca wszystkie pasujące wiersze
   * @param {string} query - Zapytanie SQL
   * @param {Array} params - Parametry zapytania
   * @returns {Promise<Array>}
   */
  allQuery(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows);
      });
    });
  }

  /**
   * Wykonuje zapytanie SQL, które zwraca pierwszy pasujący wiersz
   * @param {string} query - Zapytanie SQL
   * @param {Array} params - Parametry zapytania
   * @returns {Promise<Object>}
   */
  getQuery(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(query, params, (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(row);
      });
    });
  }

  /**
   * Zapisuje statystyki portfeli
   * @param {Map} walletStats - Mapa statystyk portfeli
   * @param {Date} updateTime - Czas aktualizacji
   * @param {number} lastProcessedOffset - Ostatni przetworzony offset
   */
  async saveWalletStats(walletStats, updateTime, lastProcessedOffset) {
    try {
      console.log(`Zapisywanie statystyk ${walletStats.size} portfeli`);
      
      let totalInteractions = 0;
      const updateTimeStr = updateTime.toISOString();
      
      // Używamy transakcji
      await this.runQuery('BEGIN TRANSACTION');
      
      try {
        for (const [address, stats] of walletStats.entries()) {
          totalInteractions += stats.totalInteractions;
          
          // Konwertujemy wartości BigInt na stringi do zapisania w bazie danych
          const totalGasUsedStr = stats.totalGasUsed.toString();
          const firstInteractionDate = stats.firstInteractionDate ? stats.firstInteractionDate.toISOString() : null;
          const lastInteractionDate = stats.lastInteractionDate ? stats.lastInteractionDate.toISOString() : null;
          
          // Próbujemy zaktualizować istniejący rekord
          const result = await this.runQuery(
            `UPDATE wallet_stats SET 
            total_interactions = ?,
            swap_interactions = ?,
            pool_interactions = ?,
            approve_interactions = ?,
            total_gas_used = ?,
            first_interaction_date = ?,
            last_interaction_date = ?,
            update_time = ?
            WHERE address = ?`,
            [
              stats.totalInteractions,
              stats.swapInteractions,
              stats.poolInteractions,
              stats.approveInteractions,
              totalGasUsedStr,
              firstInteractionDate,
              lastInteractionDate,
              updateTimeStr,
              address
            ]
          );
          
          // Jeśli nie zaktualizowano żadnego wiersza, dodajemy nowy
          if (result.changes === 0) {
            await this.runQuery(
              `INSERT INTO wallet_stats (
                address,
                total_interactions,
                swap_interactions,
                pool_interactions,
                approve_interactions,
                total_gas_used,
                first_interaction_date,
                last_interaction_date,
                update_time
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                address,
                stats.totalInteractions,
                stats.swapInteractions,
                stats.poolInteractions,
                stats.approveInteractions,
                totalGasUsedStr,
                firstInteractionDate,
                lastInteractionDate,
                updateTimeStr
              ]
            );
          }
        }
        
        // Zapisujemy informacje o aktualizacji
        await this.runQuery(
          `INSERT INTO update_info (
            last_update_time,
            from_date,
            to_date,
            total_wallets,
            total_interactions,
            last_processed_offset
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            updateTimeStr,
            updateTimeStr, // Zamienimy na rzeczywistą datę początkową
            updateTimeStr, // Data końcowa (teraz)
            walletStats.size,
            totalInteractions,
            lastProcessedOffset
          ]
        );
        
        await this.runQuery('COMMIT');
        console.log('Zapisano statystyki portfeli pomyślnie');
        return true;
      } catch (error) {
        await this.runQuery('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('Błąd podczas zapisywania statystyk portfeli:', error);
      throw error;
    }
  }

  /**
   * Pobiera listę top portfeli według liczby interakcji
   * @param {number} limit - Liczba portfeli do pobrania
   * @returns {Promise<Array>} Lista top portfeli
   */
  async getTopWallets(limit = 100) {
    try {
      const rows = await this.allQuery(
        `SELECT * FROM wallet_stats 
        ORDER BY total_interactions DESC 
        LIMIT ?`,
        [limit]
      );
      
      return rows;
    } catch (error) {
      console.error('Błąd podczas pobierania top portfeli:', error);
      throw error;
    }
  }

  /**
   * Pobiera informacje o ostatniej aktualizacji
   * @returns {Promise<Object>} Informacje o ostatniej aktualizacji
   */
  async getLastUpdateInfo() {
    try {
      const row = await this.getQuery(
        `SELECT * FROM update_info 
        ORDER BY last_update_time DESC 
        LIMIT 1`
      );
      
      return row;
    } catch (error) {
      console.error('Błąd podczas pobierania informacji o ostatniej aktualizacji:', error);
      throw error;
    }
  }

  /**
   * Czyści informację o ostatniej aktualizacji
   */
  async clearLastUpdateInfo() {
    try {
      await this.db.run('DELETE FROM update_info');
      console.log('Wyczyszczono informację o ostatniej aktualizacji');
    } catch (error) {
      console.error('Błąd podczas czyszczenia informacji o aktualizacji:', error);
      throw error;
    }
  }

  /**
   * Zamyka połączenia z bazą danych
   */
  async close() {
    if (this.db) {
      return new Promise((resolve, reject) => {
        this.db.close(err => {
          if (err) {
            console.error('Błąd podczas zamykania połączenia z bazą danych:', err);
            reject(err);
            return;
          }
          console.log('Połączenie z bazą danych zamknięte');
          resolve();
        });
      });
    }
  }

  /**
   * Pobiera liczbę wszystkich portfeli w bazie
   */
  async getWalletCount() {
    try {
      const result = await this.db.get('SELECT COUNT(*) as count FROM wallet_stats');
      return result.count;
    } catch (error) {
      console.error('Błąd podczas pobierania liczby portfeli:', error);
      throw error;
    }
  }

  /**
   * Zapisuje ostatni sprawdzony blok
   * @param {number} blockNumber - Numer ostatniego sprawdzonego bloku
   */
  async saveLastCheckedBlock(blockNumber) {
    try {
      // Usuń wszystkie istniejące rekordy
      await this.runQuery(`DELETE FROM last_checked_block`);
      
      // Wstaw nowy rekord
      await this.runQuery(
        `INSERT INTO last_checked_block (block_number, check_time) VALUES (?, datetime('now'))`,
        [blockNumber]
      );
      console.log(`Zapisano ostatni sprawdzony blok: ${blockNumber}`);
    } catch (error) {
      console.error('Błąd podczas zapisywania ostatniego bloku:', error);
      throw error;
    }
  }

  /**
   * Pobiera ostatni sprawdzony blok
   * @returns {number} Numer ostatniego sprawdzonego bloku lub 0 jeśli nie znaleziono
   */
  async getLastCheckedBlock() {
    try {
      const result = await this.getQuery(`SELECT block_number FROM last_checked_block LIMIT 1`);
      
      if (result && result.block_number !== undefined) {
        return result.block_number;
      }
      return 0;
    } catch (error) {
      console.error('Błąd podczas pobierania ostatniego bloku:', error);
      return 0;
    }
  }

  /**
   * Aktualizuje lub tworzy wpis w tabeli stats_summary
   * @param {number} totalWallets - Całkowita liczba portfeli
   * @param {number} totalInteractions - Całkowita liczba interakcji
   */
  async updateStatsSummary(totalWallets, totalInteractions) {
    try {
      // Sprawdź, czy istnieje już jakiś rekord
      const record = await this.getQuery('SELECT id FROM stats_summary LIMIT 1');
      
      if (record) {
        // Aktualizuj istniejący rekord
        await this.runQuery(`
          UPDATE stats_summary 
          SET total_wallets = ?, total_interactions = ?, last_update = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [totalWallets, totalInteractions, record.id]);
      } else {
        // Dodaj nowy rekord
        await this.runQuery(`
          INSERT INTO stats_summary (total_wallets, total_interactions)
          VALUES (?, ?)
        `, [totalWallets, totalInteractions]);
      }
      
      console.log(`Zaktualizowano stats_summary: portfele=${totalWallets}, interakcje=${totalInteractions}`);
    } catch (error) {
      console.error('Błąd podczas aktualizacji stats_summary:', error);
      throw error;
    }
  }

  /**
   * Pobiera najnowszy wpis z tabeli stats_summary
   * @returns {Promise<Object|null>} Obiekt z danymi statystyk lub null
   */
  async getStatsSummary() {
    try {
      return await this.getQuery('SELECT * FROM stats_summary ORDER BY id DESC LIMIT 1');
    } catch (error) {
      console.error('Błąd podczas pobierania stats_summary:', error);
      return null;
    }
  }
}

module.exports = DatabaseService; 