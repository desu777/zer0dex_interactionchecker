const axios = require('axios');
const config = require('../config/config');

class BlockchainDataService {
  constructor() {
    this.apiBaseUrl = 'https://chainscan-newton.0g.ai/v1';
    this.contracts = {
      swap: config.CONTRACTS.SWAP_CONTRACT.toLowerCase(),
      pool: config.CONTRACTS.POOL_CONTRACT.toLowerCase(),
      approve: config.CONTRACTS.APPROVE_CONTRACT.toLowerCase()
    };
  }

  /**
   * Pobiera transakcje z określonego zakresu dat lub offsetu
   * @param {Date} startDate - Data początkowa
   * @param {Date} endDate - Data końcowa (opcjonalnie)
   * @param {number} initialOffset - Początkowy offset do paginacji (opcjonalnie)
   * @returns {Promise<Object>} Obiekt zawierający transakcje i ostatni przetworzony offset
   */
  async fetchTransactions(startDate, endDate = new Date(), initialOffset = 0) {
    try {
      const allTransactions = [];
      let hasMoreTransactions = true;
      let skip = initialOffset; // Używamy przekazanego offsetu lub 0
      const limit = 100;
      
      console.log(`Rozpoczynam pobieranie transakcji od offsetu=${skip}, limit=${limit}`);
      console.log(`Zakres dat: od ${startDate.toISOString()} do ${endDate.toISOString()}`);
      
      // Konwersja dat na timestamp w sekundach dla API
      const startTimestamp = Math.floor(startDate.getTime() / 1000);
      const endTimestamp = Math.floor(endDate.getTime() / 1000);
      
      while (hasMoreTransactions) {
        console.log(`Pobieranie strony transakcji: offset=${skip}, limit=${limit}`);
        
        try {
          const response = await axios.get(`${this.apiBaseUrl}/transaction`, {
            params: {
              limit,
              skip,
              reverse: true
            }
          });
          
          // Sprawdzamy strukturę odpowiedzi i wydobywamy listę transakcji
          const transactions = this._extractTransactionsFromResponse(response);
          
          if (transactions.length === 0) {
            hasMoreTransactions = false;
            console.log('Brak dalszych transakcji');
            break;
          }
          
          // Sprawdzamy czy ostatnia transakcja jest starsza niż data początkowa
          const oldestTxTimestamp = this._getTransactionTimestamp(transactions[transactions.length - 1]);
          if (oldestTxTimestamp < startTimestamp) {
            // Filtrujemy tylko transakcje z naszego zakresu dat
            const filteredTransactions = transactions.filter(tx => {
              const txTimestamp = this._getTransactionTimestamp(tx);
              return txTimestamp >= startTimestamp && txTimestamp <= endTimestamp;
            });
            
            allTransactions.push(...filteredTransactions);
            hasMoreTransactions = false;
            console.log(`Zakończono pobieranie - ostatnia transakcja jest starsza niż data początkowa`);
          } else {
            // Wszystkie transakcje są w zakresie dat, więc dodajemy je wszystkie
            allTransactions.push(...transactions);
            skip += limit;
            console.log(`Pobrano ${allTransactions.length} transakcji łącznie`);
          }
        } catch (error) {
          console.error(`Błąd podczas pobierania strony transakcji (offset=${skip}):`, error.message);
          
          // Jeśli to błąd HTTP, wyświetl więcej szczegółów
          if (error.response) {
            console.error(`Status: ${error.response.status}, Data:`, error.response.data);
          }
          
          // Spróbujmy ponowić zapytanie dla następnej strony (może to był tymczasowy błąd)
          skip += limit;
          
          // Jeśli mamy już jakieś transakcje, kontynuujemy, w przeciwnym razie rzucamy błąd
          if (allTransactions.length === 0) {
            throw error;
          }
        }
        
        // Dodajemy małe opóźnienie między zapytaniami, aby nie przeciążać API
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      console.log(`Zakończono pobieranie, znaleziono ${allTransactions.length} transakcji`);
      return {
        transactions: allTransactions,
        lastProcessedOffset: skip - limit // Zwracamy ostatni przetworzony offset
      };
    } catch (error) {
      console.error('Błąd podczas pobierania transakcji:', error);
      throw error;
    }
  }
  
  /**
   * Pobiera jedną stronę transakcji z określonym offsetem
   * @param {number} offset - Offset strony do pobrania
   * @param {number} limit - Limit transakcji na stronę
   * @returns {Promise<Array>} - Lista transakcji
   */
  async fetchTransactionPage(offset, limit = 100) {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/transaction`, {
        params: {
          limit,
          skip: offset,
          reverse: true
        }
      });
      
      return this._extractTransactionsFromResponse(response);
    } catch (error) {
      console.error(`Błąd podczas pobierania strony z offsetem ${offset}:`, error.message);
      if (error.response) {
        console.error(`Status: ${error.response.status}, Data:`, error.response.data);
      }
      return [];
    }
  }
  
  /**
   * Pobiera wiele stron transakcji równolegle z zachowaniem limitów zapytań
   * @param {number[]} offsets - Lista offsetów do pobrania
   * @param {number} concurrentRequests - Maksymalna liczba równoległych zapytań
   * @returns {Promise<Array>} - Lista transakcji ze wszystkich stron
   */
  async fetchMultiplePages(offsets, concurrentRequests = 5) {
    const allTransactions = [];
    const limit = 100;
    
    // Funkcja pomocnicza do obsługi grupy zapytań
    const processBatch = async (batch) => {
      console.log(`Przetwarzanie paczki ${batch.length} offsetów: [${batch[0]}...${batch[batch.length-1]}]`);
      
      const requests = batch.map(offset => 
        this.fetchTransactionPage(offset, limit)
          .then(transactions => {
            if (transactions.length > 0) {
              console.log(`Pobrano ${transactions.length} transakcji z offsetu ${offset}`);
              allTransactions.push(...transactions);
            } else {
              console.log(`Brak transakcji dla offsetu ${offset}`);
            }
            return { offset, count: transactions.length };
          })
          .catch(error => {
            console.error(`Błąd dla offsetu ${offset}:`, error.message);
            return { offset, count: 0, error: error.message };
          })
      );
      
      const results = await Promise.all(requests);
      return results.filter(r => r.count > 0).map(r => r.offset);
    };
    
    // Dzielimy offsety na grupy po concurrentRequests
    const batches = [];
    for (let i = 0; i < offsets.length; i += concurrentRequests) {
      batches.push(offsets.slice(i, i + concurrentRequests));
    }
    
    console.log(`Podzielono ${offsets.length} offsetów na ${batches.length} paczek po ${concurrentRequests}`);
    
    // Przetwarzamy każdą grupę sekwencyjnie
    for (let i = 0; i < batches.length; i++) {
      console.log(`Przetwarzanie paczki ${i+1}/${batches.length}`);
      await processBatch(batches[i]);
      
      // Krótkie opóźnienie między paczkami
      if (i < batches.length - 1) {
        console.log('Pauza między paczkami zapytań...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`Pobrano łącznie ${allTransactions.length} transakcji z ${offsets.length} stron`);
    return allTransactions;
  }
  
  /**
   * TURBO-szybkie pobieranie danych - równoległe zapytania z dużym zakresem
   * @param {number} startOffset - Początkowy offset
   * @param {number} endOffset - Końcowy offset (0 dla najnowszych transakcji)
   * @param {number} batchSize - Rozmiar paczki offsetów do równoległego przetwarzania
   * @param {number} concurrentRequests - Liczba równoległych zapytań
   * @returns {Promise<Object>} Wynik operacji z listą transakcji
   */
  async turboPagingFetch(startOffset = 9999900, endOffset = 0, batchSize = 100, concurrentRequests = 10) {
    console.log(`=== TURBO POBIERANIE ===`);
    console.log(`Zakres: ${startOffset} -> ${endOffset}`);
    console.log(`Rozmiar paczki: ${batchSize}, Równoległych zapytań: ${concurrentRequests}`);
    
    const allTransactions = [];
    let lastProcessedOffset = startOffset;
    const limit = 100; // Stały limit API
    
    try {
      // Generujemy wszystkie offsety od startOffset do endOffset z krokiem limit
      const allOffsets = [];
      for (let offset = startOffset; offset >= endOffset; offset -= limit) {
        allOffsets.push(offset);
      }
      
      console.log(`Wygenerowano ${allOffsets.length} offsetów do pobrania`);
      
      // Dzielimy wszystkie offsety na większe paczki (do osobnego zapisywania)
      const offsetChunks = [];
      for (let i = 0; i < allOffsets.length; i += batchSize) {
        offsetChunks.push(allOffsets.slice(i, i + batchSize));
      }
      
      console.log(`Podzielono na ${offsetChunks.length} paczek po około ${batchSize} offsetów każda`);
      
      // Przetwarzamy każdą paczkę offsetów
      for (let i = 0; i < offsetChunks.length; i++) {
        const chunk = offsetChunks[i];
        console.log(`\n=== PRZETWARZANIE PACZKI ${i+1}/${offsetChunks.length} ===`);
        console.log(`Zakres offsetów: ${chunk[0]} -> ${chunk[chunk.length-1]}`);
        
        // Pobieramy transakcje z bieżącej paczki offsetów
        const chunkTransactions = await this.fetchMultiplePages(chunk, concurrentRequests);
        
        console.log(`Pobrano ${chunkTransactions.length} transakcji w paczce ${i+1}`);
        
        // Aktualizujemy ostatni przetworzony offset
        if (chunkTransactions.length > 0) {
          lastProcessedOffset = Math.min(...chunk);
        }
        
        // Dodajemy transakcje do głównej listy
        allTransactions.push(...chunkTransactions);
        
        console.log(`Łącznie pobrano ${allTransactions.length} transakcji`);
        
        // Pauzujemy między paczkami
        if (i < offsetChunks.length - 1) {
          console.log('Pauza między paczkami...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      console.log(`\n=== ZAKOŃCZONO TURBO POBIERANIE ===`);
      console.log(`Pobrano łącznie ${allTransactions.length} transakcji`);
      console.log(`Ostatni przetworzony offset: ${lastProcessedOffset}`);
      
      return {
        transactions: allTransactions,
        lastProcessedOffset: lastProcessedOffset,
        nextOffset: Math.max(lastProcessedOffset - limit, 0)
      };
      
    } catch (error) {
      console.error('Błąd podczas turbo pobierania:', error);
      throw error;
    }
  }
  
  /**
   * Skróca pobieranie - pobiera określoną liczbę stron transakcji, zaczynając od określonego offsetu w kierunku początku blockchain
   * @param {number} startOffset - Początkowy offset 
   * @param {number} pages - Liczba stron do pobrania
   * @returns {Promise<Object>} Obiekt zawierający transakcje i ostatni przetworzony offset
   */
  async fetchTransactionPages(startOffset = 9999900, pages = 10) {
    try {
      const allTransactions = [];
      const limit = 100;
      let currentOffset = startOffset;
      let lastProcessedOffset = startOffset;
      
      console.log(`Rozpoczynam pobieranie ${pages} stron transakcji od offsetu ${startOffset} do bieżących transakcji`);
      
      for (let page = 0; page < pages; page++) {
        if (currentOffset < 0) {
          console.log('Osiągnięto początek blockchaina (offset < 0), kończę pobieranie');
          break;
        }
        
        console.log(`Pobieranie strony ${page+1}/${pages}, offset=${currentOffset}`);
        
        try {
          const response = await axios.get(`${this.apiBaseUrl}/transaction`, {
            params: {
              limit,
              skip: currentOffset,
              reverse: true
            }
          });
          
          const transactions = this._extractTransactionsFromResponse(response);
          
          if (transactions.length === 0) {
            console.log('Brak transakcji, kończę pobieranie');
            break;
          }
          
          allTransactions.push(...transactions);
          lastProcessedOffset = currentOffset;
          currentOffset -= limit; // Zmniejszamy offset o 100, aby przejść do nowszych transakcji
          
          console.log(`Pobrano stronę ${page+1}, łącznie ${allTransactions.length} transakcji`);
          
          // Dodajemy małe opóźnienie między zapytaniami
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
          console.error(`Błąd podczas pobierania strony ${page+1}:`, error.message);
          
          if (error.response) {
            console.error(`Status: ${error.response.status}, Data:`, error.response.data);
          }
          
          console.log(`Próba ponowienia po błędzie, zmniejszam offset...`);
          currentOffset -= limit;
          
          // Dodajemy większe opóźnienie po błędzie
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      console.log(`Zakończono pobieranie, znaleziono ${allTransactions.length} transakcji`);
      const nextOffset = currentOffset >= 0 ? currentOffset : 0; // Następny offset do pobrania przy kolejnej aktualizacji
      return {
        transactions: allTransactions,
        lastProcessedOffset: lastProcessedOffset,
        nextOffset: nextOffset
      };
    } catch (error) {
      console.error('Błąd podczas pobierania stron transakcji:', error);
      throw error;
    }
  }
  
  /**
   * Analizuje transakcje i identyfikuje interakcje z monitorowanymi kontraktami
   * @param {Array} transactions - Lista transakcji
   * @returns {Object} Mapa adresów portfeli i ich statystyk
   */
  analyzeTransactions(transactions) {
    const walletStats = new Map();
    
    console.log(`Analizowanie ${transactions.length} transakcji`);
    console.log(`Szukam interakcji z kontraktami: Swap=${this.contracts.swap}, Pool=${this.contracts.pool}, Approve=${this.contracts.approve}`);
    
    let swapFound = 0;
    let poolFound = 0;
    let approveFound = 0;
    
    transactions.forEach(tx => {
      // Pobierz adres portfela (nadawcy transakcji)
      const walletAddress = tx.from ? tx.from.toLowerCase() : null;
      if (!walletAddress) return;
      
      // Pobierz adres kontraktu docelowego
      const contractAddress = tx.to ? tx.to.toLowerCase() : null;
      if (!contractAddress) return;
      
      // Sprawdź czy transakcja jest do jednego z naszych kontraktów
      const isSwapInteraction = contractAddress === this.contracts.swap;
      const isPoolInteraction = contractAddress === this.contracts.pool;
      const isApproveInteraction = contractAddress === this.contracts.approve;
      
      if (isSwapInteraction) swapFound++;
      if (isPoolInteraction) poolFound++;
      if (isApproveInteraction) approveFound++;
      
      if (isSwapInteraction || isPoolInteraction || isApproveInteraction) {
        // Inicjalizuj statystyki portfela jeśli to pierwsza interakcja
        if (!walletStats.has(walletAddress)) {
          walletStats.set(walletAddress, {
            totalInteractions: 0,
            swapInteractions: 0,
            poolInteractions: 0,
            approveInteractions: 0,
            totalGasUsed: 0n, // Używamy BigInt dla dużych liczb
            firstInteractionDate: null,
            lastInteractionDate: null
          });
        }
        
        const stats = walletStats.get(walletAddress);
        
        // Aktualizuj statystyki
        stats.totalInteractions++;
        
        if (isSwapInteraction) stats.swapInteractions++;
        if (isPoolInteraction) stats.poolInteractions++;
        if (isApproveInteraction) stats.approveInteractions++;
        
        // Dodaj zużycie gazu
        let gasUsed = BigInt(0);
        if (tx.gasUsed && tx.gasPrice) {
          try {
            // Próbujemy obsłużyć różne formaty gasUsed/gasPrice w API
            const gasUsedBN = typeof tx.gasUsed === 'string' ? BigInt(tx.gasUsed) : BigInt(tx.gasUsed || 0);
            const gasPriceBN = typeof tx.gasPrice === 'string' ? BigInt(tx.gasPrice) : BigInt(tx.gasPrice || 0);
            gasUsed = gasUsedBN * gasPriceBN;
          } catch (e) {
            console.warn(`Błąd podczas konwersji gazu dla transakcji ${tx.hash}:`, e.message);
          }
        } else if (tx.gasFee) {
          try {
            // Niektóre API zwracają bezpośrednio gasFee
            gasUsed = typeof tx.gasFee === 'string' ? BigInt(tx.gasFee) : BigInt(tx.gasFee || 0);
          } catch (e) {
            console.warn(`Błąd podczas konwersji gasFee dla transakcji ${tx.hash}:`, e.message);
          }
        }
        
        stats.totalGasUsed += gasUsed;
        
        // Aktualizuj daty interakcji
        const txDate = this._getTransactionDate(tx);
        if (!stats.firstInteractionDate || txDate < stats.firstInteractionDate) {
          stats.firstInteractionDate = txDate;
        }
        if (!stats.lastInteractionDate || txDate > stats.lastInteractionDate) {
          stats.lastInteractionDate = txDate;
        }
      }
    });
    
    console.log(`Znaleziono interakcji: Swap=${swapFound}, Pool=${poolFound}, Approve=${approveFound}`);
    console.log(`Znaleziono ${walletStats.size} unikatowych portfeli z interakcjami`);
    return walletStats;
  }
  
  /**
   * Pomocnicza metoda do wydobywania listy transakcji z różnych formatów odpowiedzi API
   */
  _extractTransactionsFromResponse(response) {
    if (!response || !response.data) return [];
    
    // Sprawdzamy strukturę API na podstawie rzeczywistych danych z chainscan-newton.0g.ai
    if (response.data.result && response.data.result.list && Array.isArray(response.data.result.list)) {
      return response.data.result.list;
    } else if (response.data.list && Array.isArray(response.data.list)) {
      return response.data.list;
    } else if (response.data.items && Array.isArray(response.data.items)) {
      return response.data.items;
    } else if (response.data.results && Array.isArray(response.data.results)) {
      return response.data.results;
    } else if (response.data.data && Array.isArray(response.data.data)) {
      return response.data.data;
    } else if (Array.isArray(response.data)) {
      return response.data;
    }
    
    console.warn('Nie udało się znaleźć listy transakcji w odpowiedzi API:', 
                Object.keys(response.data));
    return [];
  }
  
  /**
   * Pomocnicza metoda do pobrania timestampu transakcji
   */
  _getTransactionTimestamp(tx) {
    if (tx.timestamp) {
      return typeof tx.timestamp === 'number' ? tx.timestamp : Math.floor(new Date(tx.timestamp).getTime() / 1000);
    } else if (tx.timeStamp) {
      return typeof tx.timeStamp === 'number' ? tx.timeStamp : Math.floor(new Date(tx.timeStamp).getTime() / 1000);
    } else if (tx.time) {
      return typeof tx.time === 'number' ? tx.time : Math.floor(new Date(tx.time).getTime() / 1000);
    } else if (tx.date) {
      return typeof tx.date === 'number' ? tx.date : Math.floor(new Date(tx.date).getTime() / 1000);
    }
    
    // Domyślnie zwracamy aktualny czas
    return Math.floor(Date.now() / 1000);
  }
  
  /**
   * Pomocnicza metoda do pobrania daty transakcji jako obiektu Date
   */
  _getTransactionDate(tx) {
    const timestamp = this._getTransactionTimestamp(tx);
    return new Date(timestamp * 1000);
  }
}

module.exports = BlockchainDataService; 