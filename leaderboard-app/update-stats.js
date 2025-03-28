/**
 * Skrypt do ręcznego aktualizowania statystyk w tabeli stats_summary
 */
const DatabaseService = require('./src/services/DatabaseService');

async function updateStats() {
  console.log('Inicjalizacja aktualizacji statystyk...');
  const db = new DatabaseService();
  
  try {
    // Inicjalizacja bazy danych
    await db.initialize();
    console.log('Połączono z bazą danych');
    
    // Pobierz liczbę portfeli
    const walletCountResult = await db.getQuery('SELECT COUNT(*) as count FROM wallet_stats');
    const walletCount = walletCountResult && walletCountResult.count ? walletCountResult.count : 0;
    console.log(`Liczba znalezionych portfeli: ${walletCount}`);
    
    // Pobierz sumę wszystkich interakcji
    const interactionsResult = await db.getQuery(`
      SELECT SUM(total_interactions) as total FROM wallet_stats
    `);
    const totalInteractions = interactionsResult && interactionsResult.total ? interactionsResult.total : 0;
    console.log(`Liczba wszystkich interakcji: ${totalInteractions}`);
    
    // Aktualizuj stats_summary
    await db.updateStatsSummary(walletCount, totalInteractions);
    console.log('Statystyki zaktualizowane pomyślnie!');
    
    // Wyczytaj aktualne statystyki
    const currentStats = await db.getStatsSummary();
    console.log('Aktualne statystyki:', currentStats);
    
  } catch (error) {
    console.error('Wystąpił błąd podczas aktualizacji statystyk:', error);
  } finally {
    try {
      await db.close();
      console.log('Połączenie z bazą danych zamknięte');
    } catch (err) {
      console.error('Błąd podczas zamykania połączenia:', err);
    }
  }
}

// Uruchomienie skryptu
updateStats().then(() => {
  console.log('Skrypt zakończony');
  process.exit(0);
}).catch(err => {
  console.error('Błąd podczas wykonywania skryptu:', err);
  process.exit(1);
}); 