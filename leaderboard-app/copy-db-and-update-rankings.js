/**
 * Skrypt do tworzenia kopii bazy danych i aktualizacji rankingów
 * Tworzy kopię głównej bazy danych i aktualizuje ranking na kopii,
 * aby nie ingerować w proces synchronizacji z blockchainem.
 */
const fs = require('fs');
const path = require('path');
const RankingService = require('./src/services/RankingService');
const sqlite3 = require('sqlite3').verbose();
const config = require('./src/config/config');

// Włącz tryb debugowania
sqlite3.verbose();

// Funkcja pomocnicza do debugowania
function debug(message) {
  console.log(`[DEBUG] ${message}`);
  // Zapisz też do pliku dla pewności
  fs.appendFileSync('debug.log', `${new Date().toISOString()} - ${message}\n`);
}

// Ścieżki do baz danych - bezpośrednio w katalogu aplikacji
const MAIN_DB_PATH = path.resolve(__dirname, './leaderboard.sqlite');
const RANKING_DB_PATH = path.resolve(__dirname, './ranking-leaderboard.sqlite');

debug('=== SKRYPT SYNCHRONIZACJI I RANKINGU ===');
debug(`Główna baza danych: ${MAIN_DB_PATH}`);
debug(`Baza rankingowa: ${RANKING_DB_PATH}`);
debug('=======================================');

async function copyDatabase() {
  return new Promise((resolve, reject) => {
    console.log(`Sprawdzanie bazy rankingowej ${RANKING_DB_PATH}...`);
    
    // Sprawdź, czy plik źródłowy istnieje
    if (!fs.existsSync(MAIN_DB_PATH)) {
      return reject(new Error(`Główna baza danych nie istnieje: ${MAIN_DB_PATH}`));
    }
    
    // Sprawdź, czy plik docelowy już istnieje
    if (fs.existsSync(RANKING_DB_PATH)) {
      console.log(`Baza rankingowa już istnieje: ${RANKING_DB_PATH}`);
      console.log('Synchronizuję dane z bazą macierzystą...');
      
      // Zamiast usuwać bazę, zaktualizujemy dane w istniejącej bazie
      try {
        // Otwórz połączenia do obu baz
        const mainDb = new sqlite3.Database(MAIN_DB_PATH, sqlite3.OPEN_READONLY);
        const rankingDb = new sqlite3.Database(RANKING_DB_PATH, sqlite3.OPEN_READWRITE);
        
        // Synchronizuj dane
        mainDb.serialize(() => {
          mainDb.all("SELECT * FROM wallet_stats", [], (err, mainRows) => {
            if (err) {
              mainDb.close();
              rankingDb.close();
              return reject(new Error(`Błąd odczytu danych z głównej bazy: ${err.message}`));
            }
            
            rankingDb.serialize(() => {
              // Rozpocznij transakcję dla szybszego działania
              rankingDb.run("BEGIN TRANSACTION");
              
              // Aktualizuj lub wstaw dane dla każdego portfela
              const stmt = rankingDb.prepare(`
                INSERT OR REPLACE INTO wallet_stats 
                (address, total_interactions, swap_interactions, pool_interactions, approve_interactions, update_time)
                VALUES (?, ?, ?, ?, ?, datetime('now'))
              `);
              
              mainRows.forEach(row => {
                stmt.run(
                  row.address,
                  row.total_interactions,
                  row.swap_interactions,
                  row.pool_interactions,
                  row.approve_interactions
                );
              });
              
              stmt.finalize();
              
              // Zakończ transakcję
              rankingDb.run("COMMIT", err => {
                mainDb.close();
                rankingDb.close();
                
                if (err) {
                  return reject(new Error(`Błąd podczas aktualizacji bazy rankingowej: ${err.message}`));
                }
                
                console.log(`Zsynchronizowano dane ${mainRows.length} portfeli z bazą macierzystą.`);
                resolve(true);
              });
            });
          });
        });
      } catch (err) {
        return reject(new Error(`Nie można zsynchronizować baz danych: ${err.message}`));
      }
    } else {
      console.log(`Tworzenie nowej kopii bazy danych z ${MAIN_DB_PATH} do ${RANKING_DB_PATH}...`);
      
      const sourceStream = fs.createReadStream(MAIN_DB_PATH);
      const destStream = fs.createWriteStream(RANKING_DB_PATH);
      
      sourceStream.on('error', err => {
        reject(new Error(`Błąd odczytu głównej bazy: ${err.message}`));
      });
      
      destStream.on('error', err => {
        reject(new Error(`Błąd zapisu kopii bazy: ${err.message}`));
      });
      
      destStream.on('finish', () => {
        console.log('Kopia bazy danych utworzona pomyślnie.');
        resolve(true);
      });
      
      // Kopiuj bazę
      sourceStream.pipe(destStream);
    }
  });
}

async function createSortedRankingTable() {
  return new Promise((resolve, reject) => {
    console.log('Tworzenie posortowanej tabeli rankingowej...');
    
    const db = new sqlite3.Database(RANKING_DB_PATH, sqlite3.OPEN_READWRITE, (err) => {
      if (err) {
        return reject(new Error(`Nie można otworzyć kopii bazy danych: ${err.message}`));
      }
      
      // Usuń poprzednią tabelę rankingową, jeśli istnieje
      db.run('DROP TABLE IF EXISTS sorted_wallet_rankings', (err) => {
        if (err) {
          db.close();
          return reject(new Error(`Nie można usunąć poprzedniej tabeli rankingowej: ${err.message}`));
        }
        
        // Utwórz nową posortowaną tabelę rankingową
        const createTableSql = `
          CREATE TABLE sorted_wallet_rankings AS
          SELECT 
            ROW_NUMBER() OVER (ORDER BY total_interactions DESC) as ranking_position,
            address,
            total_interactions,
            swap_interactions,
            pool_interactions,
            approve_interactions,
            (SELECT COUNT(*) FROM wallet_stats) as total_wallets
          FROM wallet_stats
          ORDER BY total_interactions DESC
        `;
        
        db.run(createTableSql, (err) => {
          if (err) {
            db.close();
            return reject(new Error(`Nie można utworzyć posortowanej tabeli rankingowej: ${err.message}`));
          }
          
          console.log('Posortowana tabela rankingowa utworzona pomyślnie.');
          
          // Utwórz indeks na kolumnie address dla szybkich wyszukiwań
          db.run('CREATE INDEX idx_sorted_address ON sorted_wallet_rankings(address)', (err) => {
            db.close();
            
            if (err) {
              return reject(new Error(`Nie można utworzyć indeksu na tabeli rankingowej: ${err.message}`));
            }
            
            console.log('Indeks na adresie portfela utworzony pomyślnie.');
            resolve(true);
          });
        });
      });
    });
  });
}

async function updateRankingsOnCopy() {
  console.log('Inicjalizacja aktualizacji rankingu portfeli na kopii bazy...');
  
  // Tymczasowo zmień ścieżkę bazy dla RankingService
  const originalDbPath = config.DATABASE.file;
  config.DATABASE.file = RANKING_DB_PATH;
  
  const rankingService = new RankingService();
  
  try {
    // Inicjalizacja usługi rankingowej
    await rankingService.initialize();
    console.log('Usługa rankingowa zainicjalizowana z kopią bazy danych');
    
    // Aktualizacja rankingów
    const success = await rankingService.updateRankings();
    
    if (success) {
      console.log('Ranking portfeli zaktualizowany pomyślnie na kopii bazy');
    } else {
      console.error('Nie udało się zaktualizować rankingu portfeli na kopii bazy');
    }
    
    // Wyświetl przykładową pozycję rankingową (jeśli istnieją portfele)
    const totalWallets = await rankingService.getTotalWalletsCount();
    
    if (totalWallets > 0) {
      // Pobierz pierwszy portfel do przykładu
      const topWallet = await rankingService.dbService.getQuery(
        'SELECT address FROM wallet_stats ORDER BY total_interactions DESC LIMIT 1'
      );
      
      if (topWallet) {
        const ranking = await rankingService.getWalletRanking(topWallet.address);
        console.log('Przykładowe dane rankingowe dla top portfela (z kopii bazy):');
        console.log(`Adres: ${topWallet.address}`);
        console.log(`Pozycja: ${ranking.position} z ${ranking.totalWallets} portfeli`);
        console.log(`Percentyl: TOP ${ranking.percentile}%`);
        console.log(`Lepszy niż ${ranking.betterThan} portfeli`);
      }
    }
    
    // Przywróć oryginalną ścieżkę
    config.DATABASE.file = originalDbPath;
    return success;
    
  } catch (error) {
    console.error('Wystąpił błąd podczas aktualizacji rankingu na kopii:', error);
    // Przywróć oryginalną ścieżkę w przypadku błędu
    config.DATABASE.file = originalDbPath;
    throw error;
  } finally {
    try {
      await rankingService.close();
      console.log('Połączenie z kopią bazy danych zamknięte');
    } catch (err) {
      console.error('Błąd podczas zamykania połączenia z kopią bazy:', err);
    }
  }
}

// Funkcja główna
async function copyDbAndUpdateRankings() {
  try {
    debug('=== ROZPOCZĘCIE PROCESU ===');
    
    // Sprawdź, czy pliki baz danych istnieją
    debug(`Główna baza: ${fs.existsSync(MAIN_DB_PATH) ? 'ISTNIEJE' : 'NIE ISTNIEJE'}`);
    debug(`Baza rankingowa: ${fs.existsSync(RANKING_DB_PATH) ? 'ISTNIEJE' : 'NIE ISTNIEJE'}`);
    
    // Krok 1: Utwórz kopię bazy danych
    debug('Krok 1: Tworzenie kopii/synchronizacja bazy danych...');
    try {
      await copyDatabase();
      debug('Krok 1: Zakończony.');
    } catch (err) {
      debug(`Krok 1: BŁĄD - ${err.message}`);
      throw err;
    }
    
    // Krok 2: Utwórz posortowaną tabelę rankingową
    debug('Krok 2: Tworzenie posortowanej tabeli rankingowej...');
    try {
      await createSortedRankingTable();
      debug('Krok 2: Zakończony.');
    } catch (err) {
      debug(`Krok 2: BŁĄD - ${err.message}`);
      throw err;
    }
    
    // Krok 3: Zaktualizuj rankingi na kopii
    debug('Krok 3: Aktualizacja rankingów...');
    try {
      await updateRankingsOnCopy();
      debug('Krok 3: Zakończony.');
    } catch (err) {
      debug(`Krok 3: BŁĄD - ${err.message}`);
      throw err;
    }
    
    debug('=== PROCES ZAKOŃCZONY POMYŚLNIE ===');
    debug(`Baza rankingowa z posortowanymi danymi: ${RANKING_DB_PATH}`);
    return true;
  } catch (error) {
    debug('=== BŁĄD PROCESU ===');
    debug(`Wystąpił błąd: ${error.message}`);
    debug(`Szczegóły błędu: ${error.stack}`);
    return false;
  }
}

// Uruchomienie skryptu
if (require.main === module) {
  debug('Uruchamianie skryptu kopiowania i aktualizacji rankingów...');
  
  copyDbAndUpdateRankings().then(success => {
    if (success) {
      debug('Skrypt zakończony pomyślnie');
      process.exit(0);
    } else {
      debug('Skrypt zakończony z błędami');
      process.exit(1);
    }
  }).catch(err => {
    debug(`Krytyczny błąd podczas wykonywania skryptu: ${err.message}`);
    debug(`Stack trace: ${err.stack}`);
    process.exit(1);
  });
}

module.exports = copyDbAndUpdateRankings; 