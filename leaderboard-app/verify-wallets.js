const axios = require('axios');
const LeaderboardUpdater = require('./src/services/UpdateLeaderboard');
const { sleep } = require('./src/utils/helpers');

// Parametry weryfikacji
const BATCH_SIZE = 25; // Zwiększamy rozmiar paczki
const DELAY_BETWEEN_REQUESTS = 500; // Zmniejszamy opóźnienie między zapytaniami
const MAX_RETRIES = 3; // Maksymalna liczba prób dla nieudanych zapytań

// Konfiguracja API i kontraktów
const API_BASE_URL = 'https://chainscan-newton.0g.ai/v1';
const CONTRACTS = {
    swap: '0xe233d75ce6f04c04610947188dec7c55790bef3b',
    pool: '0x62DF0E43e599a279015fFCFf70c2cF82bD19D69A',
    approve: '0x1E0D871472973c562650E991ED8006549F8CBEfc'
};

// Cache dla wyników
const resultsCache = new Map();

// Funkcja pomocnicza do wydobycia liczby transakcji z różnych formatów odpowiedzi
function extractCount(response) {
    if (!response || !response.data) return 0;
    
    if (response.data.result && typeof response.data.result.total === 'number') {
        return response.data.result.total;
    } else if (typeof response.data.total === 'number') {
        return response.data.total;
    } else if (response.data.meta && typeof response.data.meta.total === 'number') {
        return response.data.meta.total;
    } else if (response.data.count !== undefined) {
        return response.data.count;
    } else if (response.data.result && response.data.result.list && Array.isArray(response.data.result.list)) {
        return response.data.result.list.length;
    } else if (response.data.list && Array.isArray(response.data.list)) {
        return response.data.list.length;
    } else if (Array.isArray(response.data)) {
        return response.data.length;
    }
    
    console.warn('Nie udało się znaleźć liczby transakcji w odpowiedzi:', response.data);
    return 0;
}

async function checkContractInteractions(walletAddress, contractAddress, contractType, retryCount = 0) {
    const cacheKey = `${walletAddress}-${contractAddress}`;
    if (resultsCache.has(cacheKey)) {
        return resultsCache.get(cacheKey);
    }

    try {
        const response = await axios.get(`${API_BASE_URL}/transaction`, {
            params: {
                accountAddress: walletAddress,
                to: contractAddress.toLowerCase(),
                limit: 1,
                skip: 0
            }
        });
        
        const count = extractCount(response);
        resultsCache.set(cacheKey, count);
        return count;
    } catch (error) {
        if (error.response?.status === 429 && retryCount < MAX_RETRIES) {
            console.log(`Rate limit dla ${contractType}, czekam i próbuję ponownie...`);
            await sleep(DELAY_BETWEEN_REQUESTS * (retryCount + 1));
            return checkContractInteractions(walletAddress, contractAddress, contractType, retryCount + 1);
        }
        console.error(`Błąd podczas sprawdzania ${contractType}:`, error.message);
        return 0;
    }
}

async function processWalletBatch(batch, updater) {
    const results = [];
    
    for (const wallet of batch) {
        const normalizedAddress = wallet.address.toLowerCase();
        console.log(`\nSprawdzam portfel: ${normalizedAddress}`);
        
        try {
            // Sprawdzamy wszystkie kontrakty dla portfela
            const [swapCount, poolCount, approveCount] = await Promise.all([
                checkContractInteractions(normalizedAddress, CONTRACTS.swap, 'SWAP'),
                checkContractInteractions(normalizedAddress, CONTRACTS.pool, 'POOL'),
                checkContractInteractions(normalizedAddress, CONTRACTS.approve, 'APPROVE')
            ]);
            
            results.push({
                address: normalizedAddress,
                stats: {
                    swap: swapCount,
                    pool: poolCount,
                    approve: approveCount,
                    total: swapCount + poolCount + approveCount
                }
            });
            
            await sleep(DELAY_BETWEEN_REQUESTS);
        } catch (error) {
            console.error(`Błąd dla portfela ${normalizedAddress}:`, error.message);
        }
    }
    
    return results;
}

async function updateDatabase(results, updater) {
    for (const result of results) {
        try {
            const currentStats = await updater.dbService.getQuery(
                'SELECT * FROM wallet_stats WHERE address = ?',
                [result.address]
            );
            
            if (currentStats.swap_interactions !== result.stats.swap ||
                currentStats.pool_interactions !== result.stats.pool ||
                currentStats.approve_interactions !== result.stats.approve ||
                currentStats.total_interactions !== result.stats.total) {
                
                const totalCount = result.stats.total;
                const swapPercentage = totalCount > 0 ? Math.round((result.stats.swap / totalCount) * 100) : 0;
                const poolPercentage = totalCount > 0 ? Math.round((result.stats.pool / totalCount) * 100) : 0;
                const approvePercentage = totalCount > 0 ? Math.round((result.stats.approve / totalCount) * 100) : 0;
                
                console.log(`\nZnaleziono różnice dla portfela ${result.address}:`);
                console.log(`Swap: ${currentStats.swap_interactions} -> ${result.stats.swap} (${swapPercentage}%)`);
                console.log(`Pool: ${currentStats.pool_interactions} -> ${result.stats.pool} (${poolPercentage}%)`);
                console.log(`Approve: ${currentStats.approve_interactions} -> ${result.stats.approve} (${approvePercentage}%)`);
                console.log(`Total: ${currentStats.total_interactions} -> ${result.stats.total}`);
                
                await updater.dbService.runQuery(
                    `UPDATE wallet_stats SET 
                    swap_interactions = ?,
                    pool_interactions = ?,
                    approve_interactions = ?,
                    total_interactions = ?,
                    update_time = datetime('now')
                    WHERE address = ?`,
                    [
                        result.stats.swap,
                        result.stats.pool,
                        result.stats.approve,
                        result.stats.total,
                        result.address
                    ]
                );
                
                console.log('Zaktualizowano statystyki w bazie');
            }
        } catch (error) {
            console.error(`Błąd podczas aktualizacji bazy dla ${result.address}:`, error);
        }
    }
}

(async () => {
    console.log('========================================');
    console.log('ROZPOCZYNAM TURBO WERYFIKACJĘ INTERAKCJI');
    console.log('========================================');
    console.log(`Rozmiar paczki: ${BATCH_SIZE}`);
    console.log(`Opóźnienie między zapytaniami: ${DELAY_BETWEEN_REQUESTS}ms`);
    console.log(`Maksymalna liczba prób: ${MAX_RETRIES}`);

    const updater = new LeaderboardUpdater();
    let processedWallets = 0;
    let startTime = Date.now();
    
    try {
        await updater.initialize();
        
        const wallets = await updater.dbService.allQuery('SELECT address FROM wallet_stats');
        const totalWallets = wallets.length;
        console.log(`\nZnaleziono ${totalWallets} portfeli do weryfikacji`);
        
        for (let i = 0; i < wallets.length; i += BATCH_SIZE) {
            const batch = wallets.slice(i, i + BATCH_SIZE);
            console.log(`\nPrzetwarzanie paczki ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(totalWallets/BATCH_SIZE)}`);
            
            const results = await processWalletBatch(batch, updater);
            await updateDatabase(results, updater);
            
            processedWallets += batch.length;
            const elapsedMinutes = (Date.now() - startTime) / 60000;
            const walletsPerMinute = processedWallets / elapsedMinutes;
            const remainingWallets = totalWallets - processedWallets;
            const estimatedRemainingMinutes = remainingWallets / walletsPerMinute;
            
            console.log(`\nPostęp: ${processedWallets}/${totalWallets} (${Math.round(processedWallets/totalWallets*100)}%)`);
            console.log(`Średnia prędkość: ${Math.round(walletsPerMinute)} portfeli/minutę`);
            console.log(`Szacowany pozostały czas: ${Math.round(estimatedRemainingMinutes)} minut`);
            
            await sleep(DELAY_BETWEEN_REQUESTS);
        }
        
        const totalTime = (Date.now() - startTime) / 60000;
        console.log('\n========================================');
        console.log('WERYFIKACJA ZAKOŃCZONA');
        console.log(`Całkowity czas: ${Math.round(totalTime)} minut`);
        console.log(`Średnia prędkość: ${Math.round(totalWallets/totalTime)} portfeli/minutę`);
        console.log('========================================');
        
        await updater.close();
        process.exit(0);
    } catch (error) {
        console.error('BŁĄD PODCZAS WERYFIKACJI:', error);
        try {
            await updater.close();
        } catch (closeError) {
            console.error('Błąd podczas zamykania połączeń:', closeError);
        }
        process.exit(1);
    }
})(); 