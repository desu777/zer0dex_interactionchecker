const config = {
  // Contract addresses from original app
  CONTRACTS: {
    SWAP_CONTRACT: '0xe233d75ce6f04c04610947188dec7c55790bef3b',
    POOL_CONTRACT: '0x62DF0E43e599a279015fFCFf70c2cF82bD19D69A',
    APPROVE_CONTRACT: '0x1E0D871472973c562650E991ED8006549F8CBEfc'
  },
  
  // RPC endpoints
  RPC: {
    PRIMARY: 'https://rpc.0g.ai',
    SECONDARY: 'https://newton-rpc.serv.run'
  },
  
  // Database configuration (SQLite)
  DATABASE: {
    file: './leaderboard.sqlite'
  },
  
  // Blockchain data retrieval settings
  BLOCKCHAIN: {
    START_OFFSET: 8999900,
    PAGES_PER_UPDATE: 100
  },
  
  // Update settings
  UPDATE_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  TOP_USERS_COUNT: 100
};

module.exports = config; 