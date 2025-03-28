const config = {
  // Contract addresses
  CONTRACTS: {
    SWAP_CONTRACT: '0xe233d75ce6f04c04610947188dec7c55790bef3b',
    POOL_CONTRACT: '0x62DF0E43e599a279015fFCFf70c2cF82bD19D69A',
    APPROVE_CONTRACT: '0x1E0D871472973c562650E991ED8006549F8CBEfc'
  },
  
  // RPC endpoints
  RPC: {
    PRIMARY: 'https://evmrpc-testnet.0g.ai',
    SECONDARY: 'https://og-testnet-evm.itrocket.net'
  },

  LEADERBOARD_API_URL: '/leaderboard',

  // Blok startowy dla skanowania
  START_BLOCK: 3630076,
  
  // Wersja aplikacji
  VERSION: "1.2.0"
};

export default config; 