const express = require('express');
const cors = require('cors');
const DatabaseService = require('./DatabaseService');
const LeaderboardUpdater = require('./UpdateLeaderboard');
const config = require('../config/config');
const path = require('path');

/**
 * Serwer API dla aplikacji leaderboard
 */
class ApiServer {
  constructor(port = 3001) {
    this.port = port;
    this.app = express();
    this.dbService = new DatabaseService();
    this.leaderboardUpdater = new LeaderboardUpdater();
  }

  /**
   * Inicjalizacja serwera API
   */
  async initialize() {
    try {
      // Inicjalizacja bazy danych
      await this.dbService.initialize();
      
      // Konfiguracja middleware
      this.app.use(cors());
      this.app.use(express.json());
      
      // Serwowanie plików statycznych z frontendu (po zbudowaniu)
      this.app.use(express.static(path.join(__dirname, '../../frontend/build')));
      
      // Rejestracja endpointów
      this.registerEndpoints();
      
      // Przekierowanie wszystkich pozostałych zapytań do frontendu (SPA)
      this.app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../../frontend/build/index.html'));
      });
      
      console.log('Serwer API zainicjalizowany');
      return true;
    } catch (error) {
      console.error('Błąd podczas inicjalizacji serwera API:', error);
      throw error;
    }
  }

  /**
   * Rejestracja endpointów API
   */
  registerEndpoints() {
    // Endpoint do pobierania danych leaderboard
    this.app.get('/api/leaderboard', async (req, res) => {
      const { limit = 100 } = req.query;
      
      try {
        // Próbujemy pobrać dane z tabeli stats_summary
        let statsSummary = await this.dbService.getStatsSummary();
        
        if (!statsSummary) {
          // Jeśli brak danych w stats_summary, inicjalizujemy z wartościami domyślnymi
          statsSummary = {
            total_wallets: 0,
            total_interactions: 0,
            last_update: new Date().toISOString()
          };
        }
        
        // Pobieranie danych portfeli posortowanych według liczby interakcji
        let wallets = [];
        try {
          wallets = await this.dbService.allQuery(`
            SELECT 
              address, 
              total_interactions, 
              swap_interactions, 
              pool_interactions, 
              approve_interactions,
              first_interaction_date,
              last_interaction_date
            FROM wallet_stats 
            ORDER BY total_interactions DESC 
            LIMIT ?
          `, [parseInt(limit, 10)]);
        } catch (error) {
          console.log('Brak danych portfeli lub tabela jest pusta:', error.message);
        }
        
        res.json({
          wallets,
          stats: statsSummary
        });
      } catch (error) {
        console.error('Błąd podczas pobierania danych leaderboard:', error);
        res.status(500).json({ error: 'Błąd serwera podczas pobierania danych' });
      }
    });
    
    // Endpoint zdrowia (health check)
    this.app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
    
    // Endpoint do ręcznego wywołania aktualizacji (może być chroniony hasłem w prawdziwym środowisku)
    this.app.post('/api/trigger-update', async (req, res) => {
      try {
        // Sprawdzamy czy aktualizacja jest już w toku
        if (this.leaderboardUpdater.isUpdating) {
          return res.status(409).json({ error: 'Update already in progress' });
        }
        
        // Wywołujemy aktualizację w tle (bez czekania na zakończenie)
        this.leaderboardUpdater.updateLeaderboard().catch(err => {
          console.error('Błąd podczas aktualizacji:', err);
        });
        
        res.json({ success: true, message: 'Update triggered' });
      } catch (error) {
        console.error('Błąd podczas wywołania aktualizacji:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });
  }

  /**
   * Uruchamia serwer API
   */
  start() {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(this.port, () => {
          console.log(`Serwer API uruchomiony na porcie ${this.port}`);
          resolve(true);
        });
      } catch (error) {
        console.error('Błąd podczas uruchamiania serwera API:', error);
        reject(error);
      }
    });
  }

  /**
   * Zatrzymuje serwer API
   */
  stop() {
    return new Promise((resolve, reject) => {
      if (this.server) {
        this.server.close(async (err) => {
          if (err) {
            console.error('Błąd podczas zatrzymywania serwera API:', err);
            reject(err);
            return;
          }
          
          // Zamykamy połączenie z bazą danych
          try {
            await this.dbService.close();
            console.log('Serwer API zatrzymany');
            resolve(true);
          } catch (dbError) {
            console.error('Błąd podczas zamykania połączenia z bazą danych:', dbError);
            reject(dbError);
          }
        });
      } else {
        resolve(true);
      }
    });
  }
}

// Bezpośrednie uruchomienie skryptu
if (require.main === module) {
  (async () => {
    const apiServer = new ApiServer();
    
    try {
      // Inicjalizacja
      await apiServer.initialize();
      
      // Uruchomienie serwera
      await apiServer.start();
      
      // Obsługa zakończenia procesu
      process.on('SIGINT', async () => {
        console.log('Otrzymano sygnał SIGINT, zatrzymuję serwer...');
        try {
          await apiServer.stop();
          process.exit(0);
        } catch (error) {
          console.error('Błąd podczas zatrzymywania serwera:', error);
          process.exit(1);
        }
      });
      
      process.on('SIGTERM', async () => {
        console.log('Otrzymano sygnał SIGTERM, zatrzymuję serwer...');
        try {
          await apiServer.stop();
          process.exit(0);
        } catch (error) {
          console.error('Błąd podczas zatrzymywania serwera:', error);
          process.exit(1);
        }
      });
    } catch (error) {
      console.error('Błąd podczas uruchamiania serwera API:', error);
      process.exit(1);
    }
  })();
}

module.exports = ApiServer; 