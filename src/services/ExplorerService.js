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
      
      const swapCount = swapResponse.data.total || 0;
      const poolCount = poolResponse.data.total || 0;
      const approveCount = approveResponse.data.total || 0;
      const totalCount = allResponse.data.total || 0;
      
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
      const response = await axios.get(`${this.apiBaseUrl}/transaction`, {
        params: {
          accountAddress: walletAddress,
          to: contractAddress,
          limit,
          skip: 0
        }
      });
      
      let txType;
      switch (contractAddress.toLowerCase()) {
        case this.contracts.swap: txType = 'swap'; break;
        case this.contracts.pool: txType = 'pool'; break;
        case this.contracts.approve: txType = 'approve'; break;
        default: txType = 'unknown';
      }
      
      return (response.data.list || []).map(tx => ({
        hash: tx.hash,
        blockNumber: tx.blockNumber,
        timestamp: tx.timestamp * 1000,
        formattedDate: new Date(tx.timestamp * 1000).toLocaleDateString(),
        from: tx.from,
        to: tx.to,
        value: tx.value,
        data: tx.data,
        type: txType,
        functionType: this.getFunctionType(tx.data, txType)
      }));
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