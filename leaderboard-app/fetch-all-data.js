const LeaderboardUpdater = require('./src/services/UpdateLeaderboard');

// Parametry turbo-pobierania
const START_OFFSET = 750000;  // Kontynuujemy od miejsca gdzie się zatrzymało
const BATCH_SIZE = 500;       // Liczba offsetów przetwarzanych jednocześnie w paczce
const CONCURRENT_REQUESTS = 10; // Liczba równoległych zapytań do API

(async () => {
    console.log('========================================');
    console.log('ROZPOCZYNAM TURBO-POBIERANIE WSZYSTKICH DANYCH');
    console.log('========================================');
    console.log(`Początkowy offset: ${START_OFFSET}`);
    console.log(`Rozmiar paczki: ${BATCH_SIZE}`);
    console.log(`Równoległe zapytania: ${CONCURRENT_REQUESTS}`);

    const updater = new LeaderboardUpdater();
    
    try {
        // Inicjalizacja
        await updater.initialize();
        
        // Sprawdź liczbę portfeli w bazie
        const walletCount = await updater.dbService.getWalletCount();
        console.log(`\nLiczba portfeli w bazie danych: ${walletCount}`);
        
        // Wyczyść ostatni offset z bazy danych
        await updater.dbService.clearLastUpdateInfo();
        console.log('Wyczyszczono informację o ostatnim offsetcie z bazy danych');
        
        // Używamy turbo-pobierania
        await updater.turboPobieranieAllData(
            START_OFFSET,
            BATCH_SIZE,
            CONCURRENT_REQUESTS
        );
        
        console.log('========================================');
        console.log('TURBO-POBIERANIE WSZYSTKICH DANYCH ZAKOŃCZONE');
        console.log('========================================');
        
        // Zamknij połączenia i zakończ
        await updater.close();
        process.exit(0);
    } catch (error) {
        console.error('BŁĄD PODCZAS TURBO-POBIERANIA DANYCH:', error);
        try {
            await updater.close();
        } catch (closeError) {
            console.error('Błąd podczas zamykania połączeń:', closeError);
        }
        process.exit(1);
    }
})(); 