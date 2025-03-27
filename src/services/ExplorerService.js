import axios from 'axios';

class ExplorerService {
  constructor() {
    this.apiBaseUrl = 'https://chainscan-newton.0g.ai/v1';
    this.contracts = {
      swap: '0xe233d75ce6f04c04610947188dec7c55790bef3b',
      pool: '0x62DF0E43e599a279015fFCFf70c2cF82bD19D69A',
      approve: '0x1E0D871472973c562650E991ED8006549F8CBEfc'
    };
  }

  async getWalletInteractionCounts(walletAddress) {
    try {
      const normalizedAddress = walletAddress.toLowerCase();
      
      const [swapResponse, poolResponse, approveResponse, allResponse] = await Promise.all([
        axios.get(`${this.apiBaseUrl}/transaction`, {
          params: {
            accountAddress: normalizedAddress,
            to: this.contracts.swap,
            limit: 1
          }
        }),
        axios.get(`${this.apiBaseUrl}/transaction`, {
          params: {
            accountAddress: normalizedAddress,
            to: this.contracts.pool,
            limit: 1
          }
        }),
        axios.get(`${this.apiBaseUrl}/transaction`, {
          params: {
            accountAddress: normalizedAddress,
            to: this.contracts.approve,
            limit: 1
          }
        }),
        axios.get(`${this.apiBaseUrl}/transaction`, {
          params: {
            accountAddress: normalizedAddress,
            limit: 1
          }
        })
      ]);
      
      console.log('DEBUG - Raw API responses:');
      console.log('Swap response data structure:', Object.keys(swapResponse.data));
      console.log('Sample swap response:', JSON.stringify(swapResponse.data, null, 2));
      
      function extractCount(response) {
        if (!response || !response.data) return 0;
        
        // Sprawdzenie poprawnej struktury (response.data.result.total)
        if (response.data.result && typeof response.data.result.total === 'number') {
          return response.data.result.total;
        }
        // Alternatywne struktury odpowiedzi
        else if (typeof response.data.total === 'number') {
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
      
      const swapCount = extractCount(swapResponse);
      const poolCount = extractCount(poolResponse);
      const approveCount = extractCount(approveResponse);
      const totalCount = extractCount(allResponse);
      
      console.log('Wyodrębnione liczby transakcji:', {
        swap: swapCount,
        pool: poolCount,
        approve: approveCount,
        total: totalCount
      });
      
      const swapPercentage = totalCount > 0 ? Math.round((swapCount / totalCount) * 100) : 0;
      const poolPercentage = totalCount > 0 ? Math.round((poolCount / totalCount) * 100) : 0;
      const approvePercentage = totalCount > 0 ? Math.round((approveCount / totalCount) * 100) : 0;
      
      return {
        totalCount,
        swapCount,
        poolCount,
        approveCount,
        swapPercentage,
        poolPercentage,
        approvePercentage
      };
    } catch (error) {
      console.error("Error fetching interaction counts:", error);
      throw error;
    }
  }

  async getWalletTransactions(walletAddress, limit = 10) {
    try {
      const normalizedAddress = walletAddress.toLowerCase();
      
      const [swapTxs, poolTxs, approveTxs] = await Promise.all([
        this.getTransactionsWithContract(normalizedAddress, this.contracts.swap, limit),
        this.getTransactionsWithContract(normalizedAddress, this.contracts.pool, limit),
        this.getTransactionsWithContract(normalizedAddress, this.contracts.approve, limit)
      ]);
      
      const allTransactions = [...swapTxs, ...poolTxs, ...approveTxs]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit);
      
      return allTransactions;
    } catch (error) {
      console.error("Error fetching wallet transactions:", error);
      throw error;
    }
  }

  async getTransactionsWithContract(walletAddress, contractAddress, limit = 10) {
    try {
      console.log(`Pobieranie transakcji dla ${walletAddress} z kontraktem ${contractAddress}`);
      
      const response = await axios.get(`${this.apiBaseUrl}/transaction`, {
        params: {
          accountAddress: walletAddress,
          to: contractAddress,
          limit,
          skip: 0
        }
      });
      
      console.log(`Struktura odpowiedzi dla kontraktu ${contractAddress}:`, Object.keys(response.data));
      if (response.data.result) {
        console.log('Struktura response.data.result:', Object.keys(response.data.result));
      }
      
      let txType;
      switch (contractAddress.toLowerCase()) {
        case this.contracts.swap: txType = 'swap'; break;
        case this.contracts.pool: txType = 'pool'; break;
        case this.contracts.approve: txType = 'approve'; break;
        default: txType = 'unknown';
      }
      
      // Funkcja pomocnicza do wydobycia listy transakcji z różnych formatów odpowiedzi
      function extractTransactions(response) {
        if (!response || !response.data) return [];
        
        // Sprawdzanie różnych możliwych struktur odpowiedzi
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
        
        console.warn(`Nie udało się znaleźć listy transakcji w odpowiedzi dla ${contractAddress}`, response.data);
        return [];
      }
      
      const transactions = extractTransactions(response);
      console.log(`Znaleziono ${transactions.length} transakcji dla kontraktu ${contractAddress}`);
      
      // Jeśli znaleziono jakieś transakcje, wyświetl przykład pierwszej
      if (transactions.length > 0) {
        console.log(`Przykładowa transakcja dla ${contractAddress}:`, JSON.stringify(transactions[0], null, 2));
        console.log(`Pola przykładowej transakcji:`, Object.keys(transactions[0]));
      }
      
      // Mapowanie transakcji na jednolity format
      return transactions.map(tx => {
        try {
          // Obsługa różnych formatów czasu
          let timestamp;
          let formattedDate;
          
          if (tx.timestamp) {
            // Jeśli timestamp to liczba sekund od epoki
            timestamp = typeof tx.timestamp === 'number' ? tx.timestamp * 1000 : new Date(tx.timestamp).getTime();
          } else if (tx.timeStamp) {
            timestamp = typeof tx.timeStamp === 'number' ? tx.timeStamp * 1000 : new Date(tx.timeStamp).getTime();
          } else if (tx.time) {
            timestamp = typeof tx.time === 'number' ? tx.time * 1000 : new Date(tx.time).getTime();
          } else if (tx.date) {
            timestamp = new Date(tx.date).getTime();
          } else {
            // Brak pola z datą - używamy aktualnej daty
            timestamp = Date.now();
          }
          
          formattedDate = new Date(timestamp).toLocaleDateString();
          
          return {
            hash: tx.hash || tx.txHash || tx.transactionHash || tx.id || '',
            blockNumber: tx.epochNumber || tx.blockNumber || tx.block || 0,
            timestamp: timestamp,
            formattedDate: formattedDate,
            from: tx.from || tx.sender || tx.fromAddress || '',
            to: tx.to || tx.receiver || tx.toAddress || '',
            value: tx.value || tx.amount || '0',
            data: tx.method || tx.data || tx.input || tx.inputData || '',
            type: txType,
            functionType: this.getFunctionType(tx.method || tx.data || tx.input || tx.inputData || '', txType)
          };
        } catch (error) {
          console.error(`Błąd podczas przetwarzania transakcji:`, error);
          return {
            hash: tx.hash || 'unknown',
            type: txType,
            functionType: txType,
            formattedDate: new Date().toLocaleDateString(),
            error: true
          };
        }
      });
    } catch (error) {
      console.error(`Error fetching transactions with contract ${contractAddress}:`, error);
      return [];
    }
  }

  getFunctionType(data, defaultType) {
    if (!data || data.length < 10) return defaultType;
    
    const signature = data.slice(0, 10).toLowerCase();
    
    const functionSignatures = {
      '0x414bf389': 'swapExactTokensForTokensSupportingFeeOnTransferTokens',
      '0xdb3e2198': 'swapTokens',
      '0x38ed1739': 'swapExactTokensForTokens',
      '0x8803dbee': 'swapTokensForExactTokens',
      '0x5c11d795': 'swapExactTokensForTokensSupportingFeeOnTransferTokens',
      '0xe8e33700': 'addLiquidity',
      '0xf305d719': 'addLiquidityETH',
      '0xbaa2abde': 'removeLiquidity',
      '0x02751cec': 'removeLiquidityETH',
      '0x88316456': 'Pool Operation',
      '0x095ea7b3': 'approve'
    };
    
    return functionSignatures[signature] || defaultType;
  }
}

export default new ExplorerService(); 