const BlockchainDataService = require('./BlockchainDataService');
const DatabaseService = require('./DatabaseService');
const cron = require('node-cron');
const config = require('../config/config');

// Pobieramy dane z 17 marca 2025
const MARCH_17_2025 = new Date('2025-03-17T00:00:00Z');

/**
 * Klasa odpowiedzialna za aktualizację danych leaderboardu
 */
class LeaderboardUpdater {
  constructor() {
    this.blockchainService = new BlockchainDataService();
    this.dbService = new DatabaseService();
    this.isUpdating = false;
  }

  /**
   * Inicjalizacja usługi
   */
  async initialize() {
    try {
      console.log('Inicjalizacja usługi aktualizacji leaderboardu');
      await this.dbService.initialize();
      console.log('Inicjalizacja zakończona pomyślnie');
      return true;
    } catch (error) {
      console.error('Błąd podczas inicjalizacji:', error);
      throw error;
    }
  }

  /**
   * Uruchamia harmonogram aktualizacji (co 24h)
   */
  schedule() {
    // Uruchamiamy zadanie codziennie o północy
    cron.schedule('0 0 * * *', async () => {
      console.log('Uruchamianie zaplanowanej aktualizacji leaderboardu');
      try {
        await this.updateLeaderboard();
        console.log('Zaplanowana aktualizacja zakończona pomyślnie');
      } catch (error) {
        console.error('Błąd podczas zaplanowanej aktualizacji:', error);
      }
    });
    
    console.log('Zaplanowano aktualizację leaderboardu (codziennie o północy)');
  }

  /**
   * Pobiera wszystkie dane od określonego offsetu do 0
   * @param {number} startOffset - początkowy offset (domyślnie 9999900)
   * @param {number} batchSize - liczba stron pobieranych w jednej partii (domyślnie 100)
   */
  async fetchAllData(startOffset = 9999900, batchSize = 100) {
    if (this.isUpdating) {
      console.log('Aktualizacja już w toku, pomijam...');
      return;
    }
    
    this.isUpdating = true;
    
    try {
      console.log(`Rozpoczynam pobieranie wszystkich danych od offsetu ${startOffset} do 0`);
      
      // Aktualna data i czas
      const updateTime = new Date();
      
      // Pobierz ostatni przetworzony offset z bazy danych lub użyj startOffset
      const lastUpdate = await this.dbService.getLastUpdateInfo();
      
      let currentOffset = startOffset;
      if (lastUpdate && lastUpdate.last_processed_offset !== null) {
        currentOffset = lastUpdate.last_processed_offset;
        console.log(`Kontynuuję od ostatniego przetworzonego offsetu: ${currentOffset}`);
      }
      
      let totalTransactions = 0;
      let totalWallets = 0;
      
      // Pobieraj dane w pętli aż do offsetu 0
      while (currentOffset > 0) {
        console.log(`\n=== PRZETWARZANIE PARTII: OFFSET ${currentOffset} ===\n`);
        
        // Pobieramy transakcje w paczce
        const result = await this.blockchainService.fetchTransactionPages(currentOffset, batchSize);
        
        const transactions = result.transactions;
        const lastProcessedOffset = result.lastProcessedOffset;
        const nextOffset = result.nextOffset;
        
        console.log(`Pobrano ${transactions.length} transakcji w tej partii`);
        console.log(`Ostatni przetworzony offset: ${lastProcessedOffset}`);
        console.log(`Następny offset do pobrania: ${nextOffset}`);
        
        if (transactions.length === 0) {
          console.log('Brak transakcji do przetworzenia w tej partii, przechodzę do następnej');
          currentOffset = nextOffset;
          continue;
        }
        
        // Analizujemy transakcje i identyfikujemy interakcje z kontraktami
        const walletStats = this.blockchainService.analyzeTransactions(transactions);
        console.log(`Zidentyfikowano ${walletStats.size} portfeli z interakcjami w tej partii`);
        
        // Zapisujemy statystyki do bazy danych wraz z ostatnim przetworzonym offsetem
        await this.dbService.saveWalletStats(walletStats, updateTime, lastProcessedOffset);
        
        totalTransactions += transactions.length;
        totalWallets += walletStats.size;
        
        console.log(`\n=== PODSUMOWANIE POSTĘPU ===`);
        console.log(`Łącznie przetworzono ${totalTransactions} transakcji`);
        console.log(`Łącznie znaleziono ${totalWallets} unikalnych portfeli`);
        console.log(`Pozostało do offsetu 0: ${lastProcessedOffset}`);
        
        // Aktualizuj offset na następną partię
        currentOffset = nextOffset;
        
        // Krótka przerwa między partiami
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Jeśli offset jest 0 lub mniejszy, kończymy
        if (currentOffset <= 0) {
          console.log('\n=== ZAKOŃCZONO POBIERANIE WSZYSTKICH DANYCH ===');
          break;
        }
      }
      
      console.log(`\n=== PODSUMOWANIE KOŃCOWE ===`);
      console.log(`Całkowita liczba przetworzonych transakcji: ${totalTransactions}`);
      console.log(`Całkowita liczba unikalnych portfeli: ${totalWallets}`);
      console.log('Pobieranie wszystkich danych zakończone pomyślnie');
      
    } catch (error) {
      console.error('Błąd podczas pobierania wszystkich danych:', error);
      throw error;
    } finally {
      this.isUpdating = false;
    }
  }

  /**
   * TURBO-pobieranie wszystkich danych używając równoległego przetwarzania
   * @param {number} startOffset - Początkowy offset (domyślnie 9999900)
   * @param {number} batchSize - Ilość offsetów przetwarzanych w jednej paczce
   * @param {number} concurrentRequests - Liczba równoległych zapytań
   */
  async turboPobieranieAllData(startOffset = 9999900, batchSize = 1000, concurrentRequests = 10) {
    if (this.isUpdating) {
      console.log('Aktualizacja już w toku, pomijam...');
      return;
    }
    
    this.isUpdating = true;
    
    try {
      console.log(`==================================================`);
      console.log(`ROZPOCZYNAM TURBO-POBIERANIE WSZYSTKICH DANYCH`);
      console.log(`Początkowy offset: ${startOffset}`);
      console.log(`Rozmiar paczki: ${batchSize}`);
      console.log(`Równoległe zapytania: ${concurrentRequests}`);
      console.log(`==================================================`);
      
      // Aktualna data i czas
      const updateTime = new Date();
      
      // Pobierz ostatni przetworzony offset z bazy danych lub użyj startOffset
      const lastUpdate = await this.dbService.getLastUpdateInfo();
      
      let currentOffset = startOffset;
      if (lastUpdate && lastUpdate.last_processed_offset !== null) {
        // Zaczynamy od ostatniego offstu + 100, aby nie powtarzać
        currentOffset = lastUpdate.last_processed_offset;
        console.log(`Kontynuuję od ostatniego przetworzonego offsetu: ${currentOffset}`);
      }
      
      let totalTransactions = 0;
      let totalWallets = 0;
      let processedChunks = 0;
      const chunkSize = 100000; // Będziemy przetwarzać chunki po 100k offsetów
      
      // Pobieramy dane w większych partiach aż dojdziemy do offsetu 0
      while (currentOffset > 0) {
        processedChunks++;
        const endOffset = Math.max(0, currentOffset - chunkSize);
        
        console.log(`\n==================================================`);
        console.log(`CHUNK ${processedChunks}: Offsety od ${currentOffset} do ${endOffset}`);
        console.log(`==================================================\n`);
        
        // Używamy turboPagingFetch dla szybszego pobierania
        const result = await this.blockchainService.turboPagingFetch(
          currentOffset,
          endOffset,
          batchSize,
          concurrentRequests
        );
        
        const transactions = result.transactions;
        const lastProcessedOffset = result.lastProcessedOffset;
        const nextOffset = result.nextOffset;
        
        console.log(`\nPobrano ${transactions.length} transakcji w chunku ${processedChunks}`);
        console.log(`Ostatni przetworzony offset: ${lastProcessedOffset}`);
        console.log(`Następny offset do pobrania: ${nextOffset}`);
        
        if (transactions.length === 0) {
          console.log('Brak transakcji do przetworzenia w tym chunku, przechodzę do następnego');
          currentOffset = nextOffset;
          continue;
        }
        
        // Analizujemy transakcje i identyfikujemy interakcje z kontraktami
        console.log(`\nAnalizowanie ${transactions.length} transakcji...`);
        const walletStats = this.blockchainService.analyzeTransactions(transactions);
        console.log(`Zidentyfikowano ${walletStats.size} portfeli z interakcjami`);
        
        // Zapisujemy statystyki do bazy danych wraz z ostatnim przetworzonym offsetem
        console.log(`Zapisywanie danych do bazy...`);
        await this.dbService.saveWalletStats(walletStats, updateTime, lastProcessedOffset);
        
        totalTransactions += transactions.length;
        totalWallets += walletStats.size;
        
        console.log(`\n==================================================`);
        console.log(`PODSUMOWANIE PO CHUNKU ${processedChunks}:`);
        console.log(`Łącznie przetworzono ${totalTransactions} transakcji`);
        console.log(`Łącznie znaleziono ${totalWallets} unikalnych portfeli`);
        console.log(`Przetworzono ${currentOffset - endOffset} offsetów z ${currentOffset} całości`);
        console.log(`Pozostało offsetów do offsetu 0: ${endOffset}`);
        console.log(`==================================================`);
        
        // Aktualizuj offset na następną partię
        currentOffset = nextOffset;
        
        // Krótka przerwa między chunkami
        console.log(`\nPrzerwa między chunkami (5 sekund)...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Jeśli offset jest 0, kończymy
        if (currentOffset <= 0) {
          console.log('\n==================================================');
          console.log('ZAKOŃCZONO TURBO-POBIERANIE WSZYSTKICH DANYCH');
          console.log('==================================================');
          break;
        }
      }
      
      console.log(`\n==================================================`);
      console.log(`PODSUMOWANIE KOŃCOWE TURBO-POBIERANIA:`);
      console.log(`Całkowita liczba przetworzonych transakcji: ${totalTransactions}`);
      console.log(`Całkowita liczba unikalnych portfeli: ${totalWallets}`);
      console.log(`Liczba przetworzonych chunków: ${processedChunks}`);
      console.log(`==================================================`);
      
    } catch (error) {
      console.error('Błąd podczas turbo-pobierania wszystkich danych:', error);
      throw error;
    } finally {
      this.isUpdating = false;
    }
  }

  /**
   * Aktualizuje dane leaderboardu używając określonego offsetu
   */
  async updateLeaderboard() {
    if (this.isUpdating) {
      console.log('Aktualizacja już w toku, pomijam...');
      return;
    }
    
    this.isUpdating = true;
    
    try {
      console.log('Rozpoczynam aktualizację leaderboardu');
      
      // Pobieramy informacje o ostatniej aktualizacji
      const lastUpdate = await this.dbService.getLastUpdateInfo();
      
      // Aktualna data i czas
      const updateTime = new Date();
      
      // Określamy offset początkowy
      let startOffset = config.BLOCKCHAIN.START_OFFSET;
      if (lastUpdate && lastUpdate.last_processed_offset) {
        // Jeśli mamy zapisany offset z poprzedniej aktualizacji, użyjmy go
        // Dodajemy 100 do offsetu, aby przejść do następnej strony
        startOffset = lastUpdate.last_processed_offset + 100;
        console.log(`Kontynuuję od ostatniego przetworzonego offsetu: ${startOffset}`);
      } else {
        console.log(`Używam początkowego offsetu z konfiguracji: ${startOffset}`);
      }
      
      console.log('Pobieranie transakcji z określonego offsetu...');
      
      // Pobieramy transakcje zaczynając od offsetu i ograniczamy do określonej liczby stron
      const pagesToFetch = config.BLOCKCHAIN.PAGES_PER_UPDATE;
      
      console.log(`Pobieranie ${pagesToFetch} stron transakcji od offsetu ${startOffset}`);
      const result = await this.blockchainService.fetchTransactionPages(startOffset, pagesToFetch);
      
      const transactions = result.transactions;
      const lastProcessedOffset = result.lastProcessedOffset;
      
      console.log(`Pobrano ${transactions.length} transakcji`);
      console.log(`Ostatni przetworzony offset: ${lastProcessedOffset}`);
      console.log(`Następny offset do pobrania: ${result.nextOffset}`);
      
      if (transactions.length === 0) {
        console.log('Brak transakcji do przetworzenia');
        this.isUpdating = false;
        return;
      }
      
      // Analizujemy transakcje i identyfikujemy interakcje z kontraktami
      const walletStats = this.blockchainService.analyzeTransactions(transactions);
      console.log(`Zidentyfikowano ${walletStats.size} portfeli z interakcjami`);
      
      // Zapisujemy statystyki do bazy danych wraz z ostatnim przetworzonym offsetem
      await this.dbService.saveWalletStats(walletStats, updateTime, lastProcessedOffset);
      
      console.log('Aktualizacja leaderboardu zakończona pomyślnie');
    } catch (error) {
      console.error('Błąd podczas aktualizacji leaderboardu:', error);
      throw error;
    } finally {
      this.isUpdating = false;
    }
  }

  /**
   * Zapisuje zebrane dane do bazy danych
   * @param {Map} walletStats - Mapa ze statystykami portfeli
   * @param {number} lastProcessedOffset - Ostatni przetworzony offset
   */
  async save(walletStats, lastProcessedOffset) {
    const updateTime = new Date();
    
    try {
      // Zapisujemy statystyki portfeli
      await this.dbService.saveWalletStats(walletStats, updateTime, lastProcessedOffset);
      
      // Obliczamy całkowitą liczbę interakcji
      let totalInteractions = 0;
      for (const stats of walletStats.values()) {
        totalInteractions += stats.totalInteractions;
      }
      
      // Aktualizujemy tabelę stats_summary
      await this.dbService.updateStatsSummary(walletStats.size, totalInteractions);
      
      console.log(`Zapisano dane do bazy. Portfele: ${walletStats.size}, Interakcje: ${totalInteractions}`);
    } catch (error) {
      console.error('Błąd podczas zapisywania danych:', error);
      throw error;
    }
  }

  /**
   * Zamyka połączenia
   */
  async close() {
    await this.dbService.close();
  }
}

// Bezpośrednie uruchomienie skryptu
if (require.main === module) {
  (async () => {
    const updater = new LeaderboardUpdater();
    
    try {
      // Inicjalizacja
      await updater.initialize();
      
      // Sprawdź parametry uruchomienia
      const args = process.argv.slice(2);
      if (args.includes('--fetch-all')) {
        // Pobierz wszystkie dane
        await updater.fetchAllData();
        process.exit(0);
      } else {
        // Standardowa aktualizacja
        await updater.updateLeaderboard();
        
        // Ustaw harmonogram dalszych aktualizacji
        updater.schedule();
        
        console.log('Skrypt uruchomiony pomyślnie, czekam na zaplanowane aktualizacje...');
      }
      
      // Nie zamykamy procesu, aby cron mógł działać
      // process.exit() jest wywoływane tylko w przypadku błędu lub przy --fetch-all
    } catch (error) {
      console.error('Błąd podczas uruchamiania skryptu:', error);
      process.exit(1);
    }
  })();
}

module.exports = LeaderboardUpdater; 