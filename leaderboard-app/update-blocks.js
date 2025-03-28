const axios = require('axios');
const DatabaseService = require('./src/services/DatabaseService');

// Konfiguracja
const API_BASE_URL = 'https://chainscan-newton.0g.ai/v1';
const CONTRACTS = {
  swap: '0xe233d75ce6f04c04610947188dec7c55790bef3b',
  pool: '0x62DF0E43e599a279015fFCFf70c2cF82bD19D69A',
  approve: '0x1E0D871472973c562650E991ED8006549F8CBEfc'
};
const TX_BATCH_SIZE = 100;

// Funkcja sprawdzająca, czy transakcja dotyczy interesujących nas kontraktów
function isContractInteraction(tx) {
  const toAddress = tx.to?.toLowerCase();
  return toAddress === CONTRACTS.swap.toLowerCase() ||
         toAddress === CONTRACTS.pool.toLowerCase() ||
         toAddress === CONTRACTS.approve.toLowerCase();
}

// Funkcja do sprawdzania nowych interakcji
async function checkNewInteractions(lastCheckedBlock) {
  console.log(`Sprawdzam transakcje od bloku ${lastCheckedBlock} w górę...`);
  
  let skip = 0;
  let foundLastBlock = false;
  let latestBlock = 0;
  let firstBlock = 0; // Zapamiętujemy pierwszy znaleziony blok
  const newInteractions = [];
  
  try {
    while (!foundLastBlock) {
      console.log(`Pobieram batch transakcji (skip=${skip}, limit=${TX_BATCH_SIZE})...`);
      
      const response = await axios.get(`${API_BASE_URL}/transaction`, {
        params: {
          limit: TX_BATCH_SIZE,
          order: 'desc',
          skip: skip
        }
      });
      
      // Sprawdź czy mamy dane
      if (!response.data || !response.data.result || !response.data.result.list || 
          !Array.isArray(response.data.result.list) || response.data.result.list.length === 0) {
        console.log('Brak dalszych transakcji lub nieprawidłowa odpowiedź API.');
        break;
      }
      
      const transactions = response.data.result.list;
      console.log(`Pobrano ${transactions.length} transakcji.`);
      
      // Jeśli to pierwszy batch, ustaw najnowszy blok
      if (skip === 0 && transactions.length > 0 && transactions[0].epochNumber) {
        latestBlock = transactions[0].epochNumber;
        firstBlock = latestBlock; // Zapisujemy pierwszy blok do późniejszego użycia
        console.log(`Najnowszy blok: ${latestBlock}`);
      }
      
      // Sprawdź każdą transakcję
      for (const tx of transactions) {
        // Jeśli znaleźliśmy transakcję ze starszego lub równego bloku, kończymy
        if (tx.epochNumber <= lastCheckedBlock) {
          console.log(`Znaleziono transakcję z bloku ${tx.epochNumber} <= ${lastCheckedBlock}, kończymy.`);
          foundLastBlock = true;
          break;
        }
        
        // Jeśli to interakcja z interesującym nas kontraktem, dodaj do listy
        if (isContractInteraction(tx)) {
          console.log(`Znaleziono nową interakcję w bloku ${tx.epochNumber}: ${tx.hash} (${tx.to})`);
          newInteractions.push(tx);
        }
      }
      
      // Jeśli znaleźliśmy już punkt końcowy, przerwij pętlę
      if (foundLastBlock) break;
      
      // Jeśli nie mamy pełnego batcha, oznacza to, że doszliśmy do końca
      if (transactions.length < TX_BATCH_SIZE) {
        console.log('Doszliśmy do końca dostępnych transakcji.');
        break;
      }
      
      // Zwiększ offset dla następnej paczki
      skip += TX_BATCH_SIZE;
    }
    
    console.log(`Znaleziono ${newInteractions.length} nowych interakcji z kontraktami.`);
    
    if (newInteractions.length > 0) {
      // Tutaj w przyszłości będziemy przetwarzać znalezione interakcje
      // i aktualizować dane w bazie
      console.log('Przetwarzanie nowych interakcji będzie zaimplementowane w przyszłości.');
    }
    
    return {
      success: true,
      firstBlock: firstBlock,
      latestBlock: latestBlock,
      interactionsCount: newInteractions.length
    };
  } catch (error) {
    console.error('Błąd podczas sprawdzania nowych interakcji:', error.message);
    return {
      success: false,
      firstBlock: 0,
      latestBlock: 0,
      interactionsCount: 0
    };
  }
}

// Główna funkcja
async function main() {
  console.log('==== ROZPOCZYNAM SPRAWDZANIE NOWYCH TRANSAKCJI ====');
  
  const dbService = new DatabaseService();
  
  try {
    await dbService.initialize();
    
    // Pobierz ostatni sprawdzony blok
    const lastCheckedBlock = await dbService.getLastCheckedBlock();
    console.log(`Ostatni sprawdzony blok: ${lastCheckedBlock}`);
    
    // Sprawdź nowe interakcje
    const result = await checkNewInteractions(lastCheckedBlock);
    
    if (result.success && result.firstBlock > 0) {
      // Najpierw zapisujemy nowy blok - od którego zaczynamy synchronizować
      if (result.firstBlock > lastCheckedBlock) {
        await dbService.saveLastCheckedBlock(result.firstBlock);
        console.log(`Zapisano początkowy blok synchronizacji: ${result.firstBlock}`);
      }
      
      // Tutaj będzie implementacja przetwarzania zebranych transakcji
      // ...
      
      // Po zakończeniu synchronizacji aktualizujemy blok na najnowszy znaleziony
      if (result.latestBlock > result.firstBlock) {
        await dbService.saveLastCheckedBlock(result.latestBlock);
        console.log(`Zaktualizowano ostatni sprawdzony blok na ${result.latestBlock}`);
      }
      
      console.log(`Znaleziono ${result.interactionsCount} nowych interakcji.`);
    } else {
      console.error('Nie udało się przetworzyć nowych bloków lub nie znaleziono najnowszego bloku.');
    }
    
    await dbService.close();
    console.log('==== ZAKOŃCZONO SPRAWDZANIE NOWYCH TRANSAKCJI ====');
  } catch (error) {
    console.error('Wystąpił błąd:', error);
    try {
      await dbService.close();
    } catch (closeError) {
      console.error('Błąd podczas zamykania połączenia:', closeError);
    }
  }
}

// Uruchom główną funkcję
main(); 