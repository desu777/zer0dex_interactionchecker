/**
 * API routes for the leaderboard application
 */
const express = require('express');
const router = express.Router();
const DatabaseService = require('../services/DatabaseService');
const RankingService = require('../services/RankingService');
const path = require('path');
const config = require('../config/config');

// Ścieżki do baz danych
const MAIN_DB_PATH = config.DATABASE.file;
const RANKING_DB_PATH = path.join(path.dirname(MAIN_DB_PATH), 'ranking-' + path.basename(MAIN_DB_PATH));

// Inicjalizacja usług
const dbService = new DatabaseService();
const rankingService = new RankingService();

let servicesInitialized = false;

// Middleware do inicjalizacji usług przy pierwszym żądaniu
const initializeServices = async (req, res, next) => {
  try {
    if (!servicesInitialized) {
      console.log('Inicjalizacja usług API...');
      
      // Inicjalizacja głównej bazy dla danych leaderboard
      await dbService.initialize();
      
      // Inicjalizacja usługi rankingowej z kopią bazy
      // Tymczasowo zmień ścieżkę bazy dla RankingService
      const originalDbPath = config.DATABASE.file;
      config.DATABASE.file = RANKING_DB_PATH;
      await rankingService.initialize();
      // Przywróć oryginalną ścieżkę
      config.DATABASE.file = originalDbPath;
      
      servicesInitialized = true;
      console.log('Usługi API zainicjalizowane pomyślnie');
    }
    next();
  } catch (error) {
    console.error('Błąd podczas inicjalizacji usług API:', error);
    res.status(500).json({ error: 'Błąd inicjalizacji serwera' });
  }
};

router.use(initializeServices);

/**
 * Endpoint pobierający dane leaderboard
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const timeRange = req.query.timeRange || 'all';
    console.log(`Pobieranie leaderboard dla zakresu: ${timeRange}`);
    
    // Pobierz dane portfeli z głównej bazy
    let wallets;
    if (timeRange === 'all') {
      wallets = await dbService.getTopWallets(100);
    } else {
      // W przyszłości: obsługa innych zakresów czasowych
      wallets = await dbService.getTopWallets(100);
    }
    
    // Pobierz statystyki z głównej bazy
    const stats = await dbService.getStatsSummary();
    
    res.json({
      wallets,
      stats
    });
  } catch (error) {
    console.error('Błąd podczas pobierania leaderboard:', error);
    res.status(500).json({ error: 'Wystąpił błąd podczas pobierania danych' });
  }
});

/**
 * Endpoint pobierający ranking dla określonego portfela
 */
router.get('/wallet-ranking/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!address || address.length < 10) {
      return res.status(400).json({ error: 'Nieprawidłowy adres portfela' });
    }
    
    const rankingService = new RankingService();
    await rankingService.initialize();
    
    const ranking = await rankingService.getWalletRanking(address);
    await rankingService.close();
    
    if (!ranking) {
      return res.status(404).json({ 
        error: 'Adres nie znaleziony w rankingu',
        message: 'Portfel nie ma żadnych interakcji lub nie jest jeszcze uwzględniony w rankingu.'
      });
    }
    
    return res.json({ ranking });
  } catch (error) {
    console.error('Błąd pobierania rankingu:', error);
    return res.status(500).json({ error: 'Błąd pobierania rankingu' });
  }
});

/**
 * Endpoint do aktualizacji rankingu (zabezpieczony - tylko dla adminów)
 * Ten endpoint uruchamia skrypt kopiowania bazy i aktualizacji rankingów
 */
router.post('/update-ranking', async (req, res) => {
  try {
    const adminKey = req.headers['admin-key'];
    
    if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
      return res.status(403).json({ error: 'Brak uprawnień do tej operacji' });
    }
    
    console.log('Manualna aktualizacja rankingu...');
    
    // Importuj skrypt kopiowania bazy i aktualizacji rankingów
    const copyDbAndUpdateRankings = require('../../copy-db-and-update-rankings');
    
    // Uruchom skrypt
    const success = await copyDbAndUpdateRankings();
    
    if (success) {
      res.json({ success: true, message: 'Ranking zaktualizowany pomyślnie' });
    } else {
      res.status(500).json({ error: 'Nie udało się zaktualizować rankingu' });
    }
  } catch (error) {
    console.error('Błąd podczas aktualizacji rankingu:', error);
    res.status(500).json({ error: 'Wystąpił błąd podczas aktualizacji rankingu' });
  }
});

module.exports = router; 