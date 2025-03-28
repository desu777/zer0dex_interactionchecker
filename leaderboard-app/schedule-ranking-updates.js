/**
 * Skrypt do planowania cyklicznych aktualizacji kopii bazy danych i rankingów
 * Ten skrypt można uruchomić jako proces w tle lub jako zadanie cron
 */
const copyDbAndUpdateRankings = require('./copy-db-and-update-rankings');

// Domyślny interwał aktualizacji: co godzinę (w milisekundach)
const UPDATE_INTERVAL = process.env.RANKING_UPDATE_INTERVAL || 60 * 60 * 1000;

/**
 * Funkcja uruchamiająca aktualizację i planująca kolejną
 */
async function scheduleNextUpdate() {
  console.log(`[${new Date().toISOString()}] Rozpoczynam zaplanowaną aktualizację rankingów...`);
  
  try {
    // Wykonaj aktualizację
    const success = await copyDbAndUpdateRankings();
    
    if (success) {
      console.log(`[${new Date().toISOString()}] Aktualizacja rankingów zakończona pomyślnie`);
    } else {
      console.error(`[${new Date().toISOString()}] Aktualizacja rankingów zakończona błędem`);
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Błąd podczas aktualizacji rankingów:`, error);
  }
  
  // Zaplanuj następną aktualizację
  console.log(`[${new Date().toISOString()}] Planuję następną aktualizację za ${UPDATE_INTERVAL/1000} sekund`);
  setTimeout(scheduleNextUpdate, UPDATE_INTERVAL);
}

// Start procesu planowania aktualizacji
console.log(`[${new Date().toISOString()}] Uruchamiam proces cyklicznej aktualizacji rankingów...`);
console.log(`Interwał aktualizacji: ${UPDATE_INTERVAL/1000} sekund (${UPDATE_INTERVAL/1000/60} minut)`);

// Pierwsza aktualizacja od razu po uruchomieniu
scheduleNextUpdate();

// Obsługa zamknięcia procesu
process.on('SIGINT', () => {
  console.log(`[${new Date().toISOString()}] Otrzymano sygnał przerwania procesu, kończę działanie...`);
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log(`[${new Date().toISOString()}] Otrzymano sygnał zakończenia procesu, kończę działanie...`);
  process.exit(0);
}); 