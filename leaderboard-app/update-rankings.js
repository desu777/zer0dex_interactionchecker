/**
 * Skrypt do aktualizacji rankingu portfeli
 * Ten skrypt może być uruchamiany cyklicznie (np. co godzinę) w celu aktualizacji rankingów
 */
const RankingService = require('./src/services/RankingService');

async function updateRankings() {
  console.log('Inicjalizacja aktualizacji rankingu portfeli...');
  const rankingService = new RankingService();
  
  try {
    // Inicjalizacja usługi rankingowej
    await rankingService.initialize();
    console.log('Usługa rankingowa zainicjalizowana');
    
    // Aktualizacja rankingów (ta funkcja jest też wywoływana przez initialize,
    // ale wywołujemy ją ponownie aby zapewnić, że ranking jest aktualny)
    const success = await rankingService.updateRankings();
    
    if (success) {
      console.log('Ranking portfeli zaktualizowany pomyślnie');
    } else {
      console.error('Nie udało się zaktualizować rankingu portfeli');
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
        console.log('Przykładowe dane rankingowe dla top portfela:');
        console.log(`Adres: ${topWallet.address}`);
        console.log(`Pozycja: ${ranking.position} z ${ranking.totalWallets} portfeli`);
        console.log(`Percentyl: TOP ${ranking.percentile}%`);
        console.log(`Lepszy niż ${ranking.betterThan} portfeli`);
      }
    }
    
  } catch (error) {
    console.error('Wystąpił błąd podczas aktualizacji rankingu:', error);
  } finally {
    try {
      await rankingService.close();
      console.log('Połączenie z bazą danych zamknięte');
    } catch (err) {
      console.error('Błąd podczas zamykania połączenia:', err);
    }
  }
}

// Uruchomienie skryptu
updateRankings().then(() => {
  console.log('Skrypt zakończony');
  process.exit(0);
}).catch(err => {
  console.error('Błąd podczas wykonywania skryptu:', err);
  process.exit(1);
}); 