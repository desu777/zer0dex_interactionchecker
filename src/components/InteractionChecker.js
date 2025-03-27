import React, { useState, useEffect } from 'react';
import { Sun, Moon, ArrowRightLeft, Droplets, Key } from 'lucide-react';
import axios from 'axios';
import ExplorerService from '../services/ExplorerService';

// Import blockchain service
import { Zer0BlockchainService } from '../services/Zer0BlockchainService';
// Import wallet utilities
import { formatWalletAddress } from '../utils/walletUtils';
// Import configuration
import config from '../config/config';

const InteractionChecker = () => {
  // Application state
  const [walletAddress, setWalletAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [interactions, setInteractions] = useState(null);
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [blockchainService, setBlockchainService] = useState(null);
  const [mockMode, setMockMode] = useState(false); // Default - real data
  const [searchProgress, setSearchProgress] = useState(0); // Search progress (0-100)
  const [searchStatus, setSearchStatus] = useState(''); // Text status of the search
  const [selectedTransaction, setSelectedTransaction] = useState(null); // Selected transaction for detailed view
  const [showTestData, setShowTestData] = useState(false); // Flag to indicate if test data is being shown
  const [showAllTransactions, setShowAllTransactions] = useState(false); // Flag to control showing all transactions

  // Interval for checking progress
  const [progressInterval, setProgressInterval] = useState(null);

  // Contracts to monitor
  const CONTRACTS = {
    swap: config.CONTRACTS.SWAP_CONTRACT,
    pool: config.CONTRACTS.POOL_CONTRACT,
    approve: config.CONTRACTS.APPROVE_CONTRACT
  };

  // Initialize blockchain service
  useEffect(() => {
    // Create service instance with main RPC (0g.ai) as priority endpoint
    const service = new Zer0BlockchainService([
      config.RPC.PRIMARY,
      config.RPC.SECONDARY
    ]);
    
    // Initialize service
    service.initialize().then(() => {
      setBlockchainService(service);
      console.log(`Blockchain service initialized - using ${config.RPC.PRIMARY} as primary`);
    }).catch(error => {
      console.error('Error initializing blockchain service:', error);
      setError('Failed to connect to blockchain network');
    });
  }, []);

  // Function to check interactions using real blockchain service
  const checkInteractionsReal = async () => {
    if (!walletAddress || walletAddress.trim() === '') {
      setError('Please enter a wallet address');
      return;
    }

    if (!walletAddress.startsWith('0x') || walletAddress.length !== 42) {
      setError('Invalid address format. Address should start with 0x and be 42 characters long.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSearchProgress(10);
    setSearchStatus('Connecting to blockchain explorer...');
    setShowTestData(false);
    
    try {
      // 1. Pobieramy liczby interakcji (statystyki)
      setSearchProgress(30);
      setSearchStatus('Getting interaction counts...');
      const stats = await ExplorerService.getWalletInteractionCounts(walletAddress);
      
      // 2. Pobieramy ostatnie 10 transakcji
      setSearchProgress(60);
      setSearchStatus('Retrieving transaction details...');
      const transactions = await ExplorerService.getWalletTransactions(walletAddress, 10);
      
      // 3. Łączymy dane
      setSearchProgress(100);
      setSearchStatus(`Found ${stats.totalCount} interactions!`);
      
      setInteractions({
        ...stats,
        transactions: transactions
      });
    } catch (error) {
      console.error("ERROR:", error);
      setSearchStatus('Error occurred!');
      setError(`Error occurred: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Function simulating data fetching (mock)
  const checkInteractionsMock = () => {
    if (!walletAddress || walletAddress.trim() === '') {
      setError('Please enter a wallet address');
      return;
    }

    if (!walletAddress.startsWith('0x') || walletAddress.length !== 42) {
      setError('Invalid address format. Address should start with 0x and be 42 characters long.');
      return;
    }

    setIsLoading(true);
    setError('');
    setShowTestData(true);
    
    // Simulate data fetching
    setTimeout(() => {
      const swapCount = Math.floor(Math.random() * 50) + 1;
      const poolCount = Math.floor(Math.random() * 20) + 1;
      const approveCount = Math.floor(Math.random() * 15) + 1;
      const totalCount = swapCount + poolCount + approveCount;
      
      const totalVolume = (Math.random() * 15 + 0.5).toFixed(4);
      const avgValue = (Number(totalVolume) / totalCount).toFixed(4);
      
      const today = new Date();
      const lastInteractionDate = new Date(today);
      lastInteractionDate.setDate(today.getDate() - Math.floor(Math.random() * 7));
      
      const firstInteractionDate = new Date(today);
      firstInteractionDate.setDate(today.getDate() - (30 + Math.floor(Math.random() * 60)));
      
      // Sample transaction history
      const transactions = [];
      
      // Add mock swap transactions
      for (let i = 0; i < Math.min(5, swapCount); i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - Math.floor(Math.random() * 30));
        
        transactions.push({
          hash: `swap-tx-${i}`,
          type: 'swap',
          functionType: 'Swap',
          date: date.toISOString(),
          formattedDate: date.toLocaleDateString(),
          blockNumber: 3760000 + Math.floor(Math.random() * 10000),
          from: walletAddress,
          to: CONTRACTS.swap
        });
      }
      
      // Add mock pool transactions
      for (let i = 0; i < Math.min(3, poolCount); i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - Math.floor(Math.random() * 30));
        
        transactions.push({
          hash: `pool-tx-${i}`,
          type: 'pool',
          functionType: 'Pool',
          date: date.toISOString(),
          formattedDate: date.toLocaleDateString(),
          blockNumber: 3760000 + Math.floor(Math.random() * 10000),
          from: walletAddress,
          to: CONTRACTS.pool
        });
      }
      
      // Add mock approve transactions
      for (let i = 0; i < Math.min(2, approveCount); i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - Math.floor(Math.random() * 30));
        
        transactions.push({
          hash: `approve-tx-${i}`,
          type: 'approve',
          functionType: 'Approve',
          date: date.toISOString(),
          formattedDate: date.toLocaleDateString(),
          blockNumber: 3760000 + Math.floor(Math.random() * 10000),
          from: walletAddress,
          to: CONTRACTS.approve
        });
      }
      
      // Sort by date
      transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      setInteractions({
        swapCount,
        poolCount,
        approveCount,
        totalCount,
        totalVolume,
        avgValue,
        lastInteraction: lastInteractionDate.toLocaleDateString(),
        firstInteraction: firstInteractionDate.toLocaleDateString(),
        swapPercentage: Math.round((swapCount / totalCount) * 100),
        poolPercentage: Math.round((poolCount / totalCount) * 100),
        approvePercentage: Math.round((approveCount / totalCount) * 100),
        transactions
      });
      
      setIsLoading(false);
    }, 1500);
  };

  // Function checking interactions - chooses between mock and real service
  const checkInteractions = () => {
    if (mockMode) {
      checkInteractionsMock();
    } else {
      checkInteractionsReal();
    }
  };

  // Function to display transaction details
  const showTransactionDetails = async (txHash) => {
    if (!blockchainService || !txHash) return;
    
    try {
      setIsLoading(true);
      console.log(`Retrieving details for transaction ${txHash}...`);
      
      // Get transaction details
      const tx = await blockchainService.web3.eth.getTransaction(txHash);
      const receipt = await blockchainService.web3.eth.getTransactionReceipt(txHash);
      const block = await blockchainService.web3.eth.getBlock(tx.blockNumber);
      
      // Prepare object with full details
      const details = {
        hash: txHash,
        blockNumber: Number(tx.blockNumber),
        timestamp: block ? new Date(block.timestamp * 1000).toISOString() : '',
        from: tx.from,
        to: tx.to,
        value: blockchainService.web3.utils.fromWei(tx.value, 'ether'),
        gasPrice: blockchainService.web3.utils.fromWei(tx.gasPrice, 'gwei'),
        gasUsed: receipt ? receipt.gasUsed : '',
        status: receipt ? (receipt.status ? 'Success' : 'Failed') : '',
        input: tx.input,
        // Function if it can be decoded
        functionName: blockchainService.decodeFunctionSignature(tx.input),
        logs: receipt ? receipt.logs : []
      };
      
      setSelectedTransaction(details);
    } catch (error) {
      console.error(`Error retrieving transaction details:`, error);
      setError(`Failed to retrieve transaction details: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to close details view
  const closeTransactionDetails = () => {
    setSelectedTransaction(null);
  };

  // Colors from Mantine system
  const colors = {
    light: {
      bg: {
        main: '#FFFFFF',            // --mantine-color-bg-0
        secondary: '#FDF7FD',       // --mantine-color-bg-1
        panel: '#FAEAFA',           // --mantine-color-bg-2
        accent: '#FCF2FC',          // --mantine-color-bg-3
        text: '#221B22',            // --mantine-color-bg-4
      },
      primary: {
        main: '#FE4E52',            // --mantine-color-primary-6
        hover: '#E18528',           // --mantine-color-primary-7 
        light: 'rgba(254, 78, 82, 0.1)',  // --mantine-color-primary-light
      },
      system: {
        main: '#5C4C5C',            // --mantine-color-system-0
        text: '#A591A4',            // --mantine-color-system-1
        secondary: '#C3C3CD',       // --mantine-color-system-2
        accent: '#F8F6F8',          // --mantine-color-system-3
        link: '#748dc1',            // --mantine-color-system-4
        success: '#00B8A1',         // --mantine-color-system-5
        error: '#FE4E52',           // --mantine-color-system-6
        warning: '#E18528',         // --mantine-color-system-7
        info: '#E074DD',            // --mantine-color-system-8
        purple: '#D952D5',          // --mantine-color-system-9
      }
    },
    dark: {
      bg: {
        main: '#050505',            // --mantine-color-black-0
        secondary: '#0F0F0F',       // --mantine-color-black-1
        panel: '#1C171C',           // --mantine-color-system-10
        accent: '#FCF2FC',          // --mantine-color-black-3
        text: '#C3C3CD',            // --mantine-color-systemDark-0
      },
      primary: {
        main: '#00D2E9',            // --mantine-color-black-12
        hover: '#E18528',           // --mantine-color-systemDark-7
        light: 'rgba(0, 210, 233, 0.1)',  // Custom based on --mantine-color-black-14
      },
      system: {
        main: '#C3C3CD',            // --mantine-color-systemDark-0
        text: '#98999F',            // --mantine-color-systemDark-1
        secondary: '#505158',       // --mantine-color-systemDark-2
        accent: '#F8F6F8',          // --mantine-color-systemDark-3
        link: '#748dc1',            // --mantine-color-systemDark-4
        success: '#00B8A1',         // --mantine-color-systemDark-5
        error: '#FE4E52',           // --mantine-color-systemDark-6
        warning: '#E18528',         // --mantine-color-systemDark-7
        info: '#00D2E9',            // --mantine-color-systemDark-8
        purple: '#D952D5',          // --mantine-color-systemDark-9
      }
    }
  };

  // Select color scheme
  const theme = darkMode ? colors.dark : colors.light;

  // Custom styles
  const styles = {
    appContainer: {
      fontFamily: "'Montserrat', sans-serif",
      minHeight: '100vh',
      backgroundColor: theme.bg.main,
      color: darkMode ? theme.bg.text : theme.bg.text,
      transition: 'background-color 0.3s, color 0.3s'
    },
    header: {
      padding: '20px',
      backgroundColor: darkMode ? theme.bg.secondary : theme.bg.secondary,
      borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    logo: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: darkMode ? theme.system.main : theme.bg.text
    },
    badge: {
      fontSize: '12px',
      backgroundColor: darkMode ? 'rgba(0, 210, 233, 0.2)' : 'rgba(224, 116, 221, 0.2)',
      color: darkMode ? theme.primary.main : theme.system.info,
      padding: '2px 8px',
      borderRadius: '4px'
    },
    testDataBadge: {
      fontSize: '12px',
      backgroundColor: darkMode ? 'rgba(254, 78, 82, 0.2)' : 'rgba(254, 78, 82, 0.2)',
      color: darkMode ? theme.system.error : theme.system.error,
      padding: '2px 8px',
      borderRadius: '4px',
      marginLeft: '8px'
    },
    walletButton: {
      padding: '6px 12px',
      background: `linear-gradient(to right, ${theme.system.error}, ${theme.system.purple})`,
      borderRadius: '20px',
      color: 'white',
      fontSize: '14px',
      display: 'flex',
      alignItems: 'center'
    },
    themeToggle: {
      background: darkMode ? theme.system.info : 'transparent',
      border: 'none',
      cursor: 'pointer',
      color: darkMode ? 'white' : theme.bg.text,
      padding: '8px',
      borderRadius: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    mainMenu: {
      display: 'flex',
      justifyContent: 'center',
      gap: '24px',
      padding: '12px',
      color: darkMode ? theme.system.main : theme.bg.text
    },
    menuItem: {
      padding: '8px 16px',
      background: 'transparent',
      border: 'none',
      color: darkMode ? theme.system.main : theme.bg.text,
      fontWeight: '500',
      fontSize: '16px',
      cursor: 'pointer',
      borderRadius: '20px',
      transition: 'background-color 0.3s, color 0.3s'
    },
    menuItemActive: {
      padding: '8px 16px',
      backgroundColor: darkMode ? theme.system.info : theme.system.info,
      border: 'none',
      color: 'white',
      fontWeight: '600',
      fontSize: '16px',
      borderRadius: '20px',
      cursor: 'pointer'
    },
    contentContainer: {
      maxWidth: '800px',
      margin: '24px auto',
      padding: '0 16px'
    },
    panel: {
      backgroundColor: darkMode ? theme.bg.panel : theme.bg.panel,
      padding: '24px',
      marginBottom: '24px',
      boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.1)',
      borderRadius: '32px',
      border: darkMode ? '4px solid rgba(255, 178, 252, 0.1)' : 'none'
    },
    title: {
      fontSize: '20px',
      fontWeight: '600',
      marginBottom: '24px',
      color: darkMode ? theme.system.main : theme.bg.text
    },
    label: {
      display: 'block',
      marginBottom: '8px',
      fontSize: '14px',
      color: darkMode ? theme.system.text : theme.system.text
    },
    input: {
      width: '100%',
      backgroundColor: darkMode ? theme.bg.secondary : theme.bg.secondary,
      color: darkMode ? theme.system.main : theme.bg.text,
      border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
      borderRadius: '16px',
      padding: '16px',
      outline: 'none',
      fontSize: '16px',
      boxSizing: 'border-box'
    },
    errorText: {
      color: theme.system.error,
      fontSize: '14px',
      marginTop: '8px'
    },
    card: {
      backgroundColor: darkMode ? 'rgba(28, 23, 28, 0.5)' : theme.bg.accent,
      padding: '16px',
      marginBottom: '24px',
      borderRadius: '12px'
    },
    cardTitle: {
      fontSize: '14px',
      fontWeight: '600',
      marginBottom: '8px',
      color: darkMode ? theme.system.main : theme.bg.text
    },
    contractRow: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '14px'
    },
    contractLabel: {
      color: darkMode ? theme.system.text : theme.system.text,
      display: 'flex', 
      alignItems: 'center'
    },
    contractAddress: {
      fontSize: '12px',
      backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
      padding: '4px 8px',
      borderRadius: '4px'
    },
    button: {
      width: '100%',
      background: darkMode ? theme.system.info : `linear-gradient(to right, ${theme.system.error}, ${theme.system.purple})`,
      color: 'white',
      padding: '16px',
      border: 'none',
      borderRadius: '20px',
      cursor: 'pointer',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: isLoading ? 0.7 : 1,
      transition: 'background-color 0.3s'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '16px',
      marginBottom: '24px'
    },
    statCard: {
      padding: '16px',
      textAlign: 'center',
      borderRadius: '12px',
      border: '1px solid'
    },
    statCardPrimary: {
      borderColor: darkMode ? `rgba(0, 210, 233, 0.2)` : `rgba(224, 116, 221, 0.2)`,
      backgroundColor: darkMode ? 'rgba(28, 23, 28, 0.5)' : theme.bg.accent
    },
    statCardSecondary: {
      borderColor: darkMode ? `rgba(254, 78, 82, 0.2)` : `rgba(254, 78, 82, 0.2)`,
      backgroundColor: darkMode ? 'rgba(28, 23, 28, 0.5)' : theme.bg.accent
    },
    statValue: {
      fontSize: '28px',
      fontWeight: 'bold'
    },
    statValuePrimary: {
      color: darkMode ? theme.primary.main : theme.system.info
    },
    statValueSecondary: {
      color: darkMode ? theme.system.error : theme.system.error
    },
    statLabel: {
      fontSize: '14px',
      color: darkMode ? theme.system.text : theme.system.text
    },
    progressBar: {
      height: '8px',
      backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
      marginTop: '8px',
      borderRadius: '4px'
    },
    progressFill: (color) => ({
      height: '100%',
      backgroundColor: color,
      borderRadius: '4px'
    }),
    progressText: {
      fontSize: '12px',
      color: darkMode ? theme.system.text : theme.system.text,
      marginTop: '4px'
    },
    detailsRow: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '14px'
    },
    detailLabel: {
      color: darkMode ? theme.system.text : theme.system.text
    },
    detailValue: {
      color: darkMode ? theme.system.main : theme.bg.text
    },
    link: {
      backgroundColor: 'transparent',
      border: 'none',
      color: darkMode ? theme.primary.main : theme.system.info,
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer'
    },
    footer: {
      textAlign: 'center',
      padding: '16px',
      fontSize: '14px',
      marginTop: '40px',
      color: darkMode ? theme.system.text : theme.system.text
    },
    toggleMock: {
      padding: '8px',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '12px',
      color: darkMode ? theme.system.text : theme.system.text,
      cursor: 'pointer',
      border: 'none',
      backgroundColor: 'transparent'
    },
    progressContainer: {
      marginBottom: '24px',
      padding: '16px',
      backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
      borderRadius: '12px'
    },
    progressStatus: {
      fontSize: '14px',
      fontWeight: '600',
      marginBottom: '8px',
      color: darkMode ? theme.system.main : theme.bg.text
    },
    progressBar: {
      height: '8px',
      backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
      marginBottom: '8px',
      borderRadius: '4px'
    },
    progressFill: {
      height: '100%',
      backgroundColor: theme.system.success,
      borderRadius: '4px'
    },
    progressText: {
      fontSize: '12px',
      color: darkMode ? theme.system.text : theme.system.text,
      marginTop: '4px'
    },
    error: {
      color: theme.system.error,
      fontSize: '14px',
      marginTop: '8px'
    },
    results: {
      marginBottom: '24px'
    },
    resultsTitle: {
      fontSize: '20px',
      fontWeight: '600',
      marginBottom: '24px',
      color: darkMode ? theme.system.main : theme.bg.text
    },
    statsContainer: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '24px'
    },
    statCard: {
      padding: '16px',
      textAlign: 'center',
      borderRadius: '12px',
      border: '1px solid'
    },
    statIcon: {
      marginBottom: '8px'
    },
    transactionsContainer: {
      marginBottom: '24px'
    },
    transactionsTitle: {
      fontSize: '20px',
      fontWeight: '600',
      marginBottom: '24px',
      color: darkMode ? theme.system.main : theme.bg.text
    },
    transactionsList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    },
    transactionItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    transactionHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '8px'
    },
    transactionType: {
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: '600'
    },
    transactionDate: {
      fontSize: '12px',
      color: darkMode ? theme.system.text : theme.system.text
    },
    transactionDetails: {
      textAlign: 'right'
    },
    transactionHash: {
      fontSize: '12px',
      color: darkMode ? theme.system.text : theme.system.text
    },
    transactionFunction: {
      fontSize: '12px',
      color: darkMode ? theme.system.text : theme.system.text
    }
  };

  return (
    <div style={styles.appContainer}>
      {/* Header */}
      <header style={styles.header}>
        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
          <span style={styles.logo}>Zer0 Interaction Checker</span>
          {showTestData && (
            <span style={styles.testDataBadge}>Sample Data</span>
          )}
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
          {walletAddress && (
            <div style={styles.walletButton}>
              <span>{formatWalletAddress(walletAddress)}</span>
            </div>
          )}
          <button 
            onClick={() => setDarkMode(!darkMode)} 
            style={styles.themeToggle}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </header>

      {/* Menu */}
      <div style={styles.mainMenu}>
        <button style={styles.menuItem}>Swap</button>
        <button style={styles.menuItem}>Pools</button>
        <button style={styles.menuItem}>Rewards</button>
        <button style={styles.menuItemActive}>Interaction Checker</button>
      </div>

      {/* Main content */}
      <div style={styles.contentContainer}>
        {/* Address input panel */}
        <div style={styles.panel}>
          <h2 style={styles.title}>Check wallet interactions with zer0_dex</h2>
          
          <div style={{marginBottom: '24px'}}>
            <label style={styles.label}>
              Wallet address:
            </label>
            <input
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="0x..."
              style={styles.input}
            />
            {error && <p style={styles.errorText}>{error}</p>}
          </div>

          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Tracked contracts:</h3>
            <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
              <div style={styles.contractRow}>
                <span style={styles.contractLabel}>
                  <ArrowRightLeft size={14} style={{marginRight: '4px'}} /> Swap Contract:
                </span>
                <code style={styles.contractAddress}>
                  {CONTRACTS.swap.substring(0, 6)}...{CONTRACTS.swap.substring(38)}
                </code>
              </div>
              <div style={styles.contractRow}>
                <span style={styles.contractLabel}>
                  <Droplets size={14} style={{marginRight: '4px'}} /> Pool Contract:
                </span>
                <code style={styles.contractAddress}>
                  {CONTRACTS.pool.substring(0, 6)}...{CONTRACTS.pool.substring(38)}
                </code>
              </div>
              <div style={styles.contractRow}>
                <span style={styles.contractLabel}>
                  <Key size={14} style={{marginRight: '4px'}} /> Approve Contract:
                </span>
                <code style={styles.contractAddress}>
                  {CONTRACTS.approve.substring(0, 6)}...{CONTRACTS.approve.substring(38)}
                </code>
              </div>
            </div>
          </div>

          <div style={{marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px'}}>
            <input
              type="checkbox"
              id="mockMode"
              checked={mockMode}
              onChange={() => setMockMode(!mockMode)}
              style={{cursor: 'pointer'}}
            />
            <label htmlFor="mockMode" style={{fontSize: '14px', color: darkMode ? theme.system.text : theme.system.text, cursor: 'pointer'}}>
              Demo mode (without blockchain connection)
            </label>
          </div>

          <div style={{display: 'flex', gap: '10px', marginBottom: '24px'}}>
            <button 
              onClick={checkInteractions} 
              disabled={isLoading}
              style={styles.button}
            >
              {isLoading ? 'Searching interactions...' : 'Check interactions'}
            </button>
          </div>
        </div>

        {/* Progress bar - visible only during loading */}
        {isLoading && (
          <div style={styles.panel}>
            <h3 style={styles.cardTitle}>Search status</h3>
            <div style={styles.progressStatus}>{searchStatus}</div>
            <div style={styles.progressBar}>
              <div 
                style={{
                  height: '100%',
                  backgroundColor: theme.system.success,
                  width: `${searchProgress}%`,
                  borderRadius: '4px'
                }}
              ></div>
            </div>
            <div style={styles.progressText}>{searchProgress}% completed</div>
          </div>
        )}
        
        {/* Results */}
        {interactions && (
          <div style={styles.panel}>
            <h2 style={styles.title}>Interaction analysis results</h2>
            
            <div style={styles.statsGrid}>
              <div style={{...styles.statCard, ...styles.statCardPrimary}}>
                <div style={styles.statLabel}>Swap Interactions</div>
                <div style={{...styles.statValue, ...styles.statValuePrimary}}>{interactions.swapCount}</div>
                <div style={styles.progressBar}>
                  <div style={{
                    height: '100%',
                    backgroundColor: theme.system.info,
                    width: `${interactions.swapPercentage}%`,
                    borderRadius: '4px'
                  }}></div>
                </div>
                <div style={styles.progressText}>{interactions.swapPercentage}% of all interactions</div>
              </div>
              
              <div style={{...styles.statCard, ...styles.statCardSecondary}}>
                <div style={styles.statLabel}>Pool Interactions</div>
                <div style={{...styles.statValue, ...styles.statValueSecondary}}>{interactions.poolCount}</div>
                <div style={styles.progressBar}>
                  <div style={{
                    height: '100%',
                    backgroundColor: theme.system.error,
                    width: `${interactions.poolPercentage}%`,
                    borderRadius: '4px'
                  }}></div>
                </div>
                <div style={styles.progressText}>{interactions.poolPercentage}% of all interactions</div>
              </div>
            </div>
            
            {/* Approve interactions */}
            {interactions.approveCount !== undefined && (
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Approve Interactions</h3>
                <div style={{...styles.statValue, color: theme.system.warning}}>{interactions.approveCount}</div>
                <div style={styles.progressBar}>
                  <div style={{
                    height: '100%',
                    backgroundColor: theme.system.warning,
                    width: `${interactions.approvePercentage}%`,
                    borderRadius: '4px'
                  }}></div>
                </div>
                <div style={styles.progressText}>
                  {interactions.approvePercentage}% of all interactions
                </div>
              </div>
            )}
            
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Interaction details</h3>
              <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                <div style={styles.detailsRow}>
                  <span style={styles.detailLabel}>Total interactions:</span>
                  <span style={styles.detailValue}>{interactions.totalCount}</span>
                </div>
                
                {interactions.totalVolume && (
                  <div style={styles.detailsRow}>
                    <span style={styles.detailLabel}>Total volume:</span>
                    <span style={styles.detailValue}>{interactions.totalVolume} ZERO</span>
                  </div>
                )}
                
                {interactions.avgValue && (
                  <div style={styles.detailsRow}>
                    <span style={styles.detailLabel}>Average value:</span>
                    <span style={styles.detailValue}>{interactions.avgValue} ZERO</span>
                  </div>
                )}
                
                {interactions.firstInteraction && (
                  <div style={styles.detailsRow}>
                    <span style={styles.detailLabel}>First interaction:</span>
                    <span style={styles.detailValue}>{interactions.firstInteraction}</span>
                  </div>
                )}
                
                {interactions.lastInteraction && (
                  <div style={styles.detailsRow}>
                    <span style={styles.detailLabel}>Last interaction:</span>
                    <span style={styles.detailValue}>{interactions.lastInteraction}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Interaction history */}
            {interactions.transactions && interactions.transactions.length > 0 && (
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Interaction history</h3>
                
                <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                  {/* Początkowo pokaż tylko 3 transakcje */}
                  {interactions.transactions.slice(0, showAllTransactions ? interactions.transactions.length : 3).map((tx, index) => (
                    <div key={index} style={{
                      padding: '10px',
                      backgroundColor: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}>
                      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '4px'}}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 6px',
                          backgroundColor: 
                            tx.type === 'swap' 
                              ? (darkMode ? 'rgba(0, 210, 233, 0.2)' : 'rgba(224, 116, 221, 0.2)')
                              : tx.type === 'pool'
                                ? (darkMode ? 'rgba(254, 78, 82, 0.2)' : 'rgba(254, 78, 82, 0.2)')
                                : (darkMode ? 'rgba(225, 133, 40, 0.2)' : 'rgba(225, 133, 40, 0.2)'),
                          color: 
                            tx.type === 'swap' 
                              ? (darkMode ? theme.primary.main : theme.system.info)
                              : tx.type === 'pool'
                                ? (darkMode ? theme.system.error : theme.system.error)
                                : (darkMode ? theme.system.warning : theme.system.warning),
                          borderRadius: '4px',
                          fontWeight: '500'
                        }}>
                          {tx.type === 'swap' ? 'Swap' : tx.type === 'pool' ? 'Pool' : 'Approve'}
                        </span>
                        <span style={{color: darkMode ? theme.system.text : theme.system.text}}>
                          {tx.formattedDate}
                        </span>
                      </div>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <span style={{color: darkMode ? theme.system.text : theme.system.text}}>
                          {tx.functionType || tx.type}
                        </span>
                        <div style={{display: 'flex', gap: '8px'}}>
                          <a 
                            href={`https://chainscan-newton.0g.ai/tx/${tx.hash}`} 
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{color: darkMode ? theme.primary.main : theme.system.info, textDecoration: 'none'}}
                          >
                            {tx.hash.substring(0, 6)}...{tx.hash.substring(tx.hash.length - 4)}
                          </a>
                          <button
                            onClick={() => showTransactionDetails(tx.hash)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: theme.system.success,
                              cursor: 'pointer',
                              fontSize: '12px',
                              padding: '0',
                              textDecoration: 'underline'
                            }}
                          >
                            Show details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Przycisk do rozwijania/zwijania listy */}
                {interactions.transactions.length > 3 && (
                  <button 
                    onClick={() => setShowAllTransactions(!showAllTransactions)}
                    style={{
                      ...styles.link,
                      marginTop: '16px',
                      display: 'block',
                      width: '100%',
                      textAlign: 'center'
                    }}
                  >
                    {showAllTransactions ? 'Show less' : `Show all (${interactions.transactions.length})`}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Transaction details modal */}
      {selectedTransaction && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: darkMode ? theme.bg.panel : theme.bg.panel,
            borderRadius: '12px',
            padding: '20px',
            maxWidth: '90%',
            width: '700px',
            maxHeight: '90vh',
            overflow: 'auto',
            position: 'relative'
          }}>
            <button
              onClick={closeTransactionDetails}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'transparent',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: darkMode ? theme.system.text : theme.system.text
              }}
            >
              ×
            </button>
            
            <h2 style={{
              fontSize: '20px',
              marginBottom: '20px',
              color: darkMode ? theme.system.main : theme.bg.text
            }}>
              Transaction Details
            </h2>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              marginBottom: '20px'
            }}>
              {Object.entries(selectedTransaction).map(([key, value]) => {
                // Don't show logs in this section
                if (key === 'logs') return null;
                
                // Format input as shorter text
                if (key === 'input' && value && value.length > 50) {
                  value = `${value.substring(0, 50)}...`;
                }
                
                return (
                  <div key={key} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    border: '1px solid ' + (darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
                    borderRadius: '8px',
                    padding: '10px'
                  }}>
                    <span style={{
                      fontSize: '12px',
                      color: darkMode ? theme.system.text : theme.system.text,
                      marginBottom: '4px',
                      fontWeight: 'bold',
                      textTransform: 'capitalize'
                    }}>
                      {key.replace(/([A-Z])/g, ' $1')}:
                    </span>
                    <span style={{
                      fontSize: '14px',
                      color: darkMode ? theme.system.main : theme.bg.text,
                      wordBreak: 'break-all'
                    }}>
                      {value !== null && value !== undefined ? value.toString() : ''}
                    </span>
                  </div>
                );
              })}
            </div>
            
            {/* Display logs as raw JSON */}
            {selectedTransaction.logs && selectedTransaction.logs.length > 0 && (
              <div>
                <h3 style={{
                  fontSize: '16px',
                  marginBottom: '10px',
                  color: darkMode ? theme.system.main : theme.bg.text
                }}>
                  Transaction Logs ({selectedTransaction.logs.length})
                </h3>
                
                <pre style={{
                  backgroundColor: darkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)',
                  padding: '10px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  overflowX: 'auto',
                  color: darkMode ? theme.system.main : theme.bg.text
                }}>
                  {JSON.stringify(selectedTransaction.logs, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Footer */}
      <footer style={styles.footer}>
        Zer0 Interaction Checker © 2025 | Powered by 0G
      </footer>
    </div>
  );
};

export default InteractionChecker;