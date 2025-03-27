import React, { useState, useEffect } from 'react';
import { Sun, Moon, ArrowRightLeft, Droplets, Key } from 'lucide-react';
import axios from 'axios';
// Fix import path - using relative path from src/components
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
  const [mockMode, setMockMode] = useState(true); // Default to mock mode for testing
  const [searchProgress, setSearchProgress] = useState(0);
  const [searchStatus, setSearchStatus] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showTestData, setShowTestData] = useState(false);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  
  // Add debug state
  const [debugInfo, setDebugInfo] = useState('');

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
    // Log that initialization is starting
    console.log('Starting blockchain service initialization...');
    addDebugInfo('Starting blockchain service initialization...');
    
    try {
      // Create service instance with main RPC (0g.ai) as priority endpoint
      const service = new Zer0BlockchainService([
        config.RPC.PRIMARY,
        config.RPC.SECONDARY
      ]);
      
      // Initialize service
      service.initialize().then(() => {
        setBlockchainService(service);
        console.log(`Blockchain service initialized - using ${config.RPC.PRIMARY} as primary`);
        addDebugInfo(`Blockchain service initialized successfully`);
      }).catch(error => {
        console.error('Error initializing blockchain service:', error);
        setError('Failed to connect to blockchain network: ' + error.message);
        addDebugInfo(`Blockchain service init error: ${error.message}`);
      });
    } catch (error) {
      console.error('Exception during blockchain service setup:', error);
      setError('Exception setting up blockchain service: ' + error.message);
      addDebugInfo(`Blockchain service setup exception: ${error.message}`);
    }
  }, []);
  
  // Helper to add debug information
  const addDebugInfo = (info) => {
    setDebugInfo(prev => prev + '\n' + info);
  };

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
    addDebugInfo(`Starting real interaction check for ${walletAddress}`);
    
    try {
      // Verify ExplorerService is properly defined
      if (!ExplorerService || typeof ExplorerService.getWalletInteractionCounts !== 'function') {
        throw new Error('ExplorerService is not properly initialized');
      }
      
      // 1. Get interaction counts
      setSearchProgress(30);
      setSearchStatus('Getting interaction counts...');
      addDebugInfo('Calling getWalletInteractionCounts...');
      
      const stats = await ExplorerService.getWalletInteractionCounts(walletAddress);
      addDebugInfo(`Got counts: total=${stats.totalCount}, swap=${stats.swapCount}, pool=${stats.poolCount}`);
      
      // 2. Get transactions
      setSearchProgress(60);
      setSearchStatus('Retrieving transaction details...');
      addDebugInfo('Calling getWalletTransactions...');
      
      const transactions = await ExplorerService.getWalletTransactions(walletAddress, 10);
      addDebugInfo(`Got ${transactions.length} transactions`);
      
      // 3. Combine data
      setSearchProgress(100);
      setSearchStatus(`Found ${stats.totalCount} interactions!`);
      
      const combinedData = {
        ...stats,
        transactions: transactions
      };
      
      addDebugInfo(`Setting combined data with ${transactions.length} transactions`);
      setInteractions(combinedData);
      
    } catch (error) {
      console.error("ERROR:", error);
      setSearchStatus('Error occurred!');
      setError(`Error occurred: ${error.message}`);
      addDebugInfo(`Error in checkInteractionsReal: ${error.message}`);
      
      // If the API call fails, try to provide more detailed error info
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        addDebugInfo(`API response error: ${error.response.status}`);
        addDebugInfo(`Response data: ${JSON.stringify(error.response.data)}`);
      } else if (error.request) {
        // The request was made but no response was received
        addDebugInfo('No response received from API');
      } else {
        // Something happened in setting up the request that triggered an Error
        addDebugInfo(`Request setup error: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
      addDebugInfo('Finished checkInteractionsReal');
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
    addDebugInfo('Starting mock data generation');
    
    // Simulate data fetching
    setTimeout(() => {
      try {
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
        
        const mockData = {
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
        };
        
        addDebugInfo(`Generated mock data with ${transactions.length} transactions`);
        setInteractions(mockData);
      } catch (error) {
        console.error("Error in mock data generation:", error);
        setError(`Error generating mock data: ${error.message}`);
        addDebugInfo(`Error in mock data: ${error.message}`);
      } finally {
        setIsLoading(false);
        addDebugInfo('Finished mock data generation');
      }
    }, 1500);
  };

  // Function checking interactions - chooses between mock and real service
  const checkInteractions = () => {
    addDebugInfo(`Starting checkInteractions, mockMode: ${mockMode}`);
    if (mockMode) {
      checkInteractionsMock();
    } else {
      checkInteractionsReal();
    }
  };

  // Function to display transaction details
  const showTransactionDetails = async (txHash) => {
    if (!blockchainService || !txHash) {
      addDebugInfo(`Cannot show details, blockchainService: ${!!blockchainService}, txHash: ${!!txHash}`);
      return;
    }
    
    try {
      setIsLoading(true);
      console.log(`Retrieving details for transaction ${txHash}...`);
      addDebugInfo(`Retrieving details for transaction ${txHash}...`);
      
      // For mock transactions, generate fake details
      if (txHash.startsWith('swap-tx-') || txHash.startsWith('pool-tx-') || txHash.startsWith('approve-tx-')) {
        setTimeout(() => {
          const details = {
            hash: txHash,
            blockNumber: 3760000 + Math.floor(Math.random() * 10000),
            timestamp: new Date().toISOString(),
            from: walletAddress,
            to: txHash.startsWith('swap-tx-') ? CONTRACTS.swap : 
                txHash.startsWith('pool-tx-') ? CONTRACTS.pool : CONTRACTS.approve,
            value: (Math.random() * 5).toFixed(4),
            gasPrice: (Math.random() * 10).toFixed(2),
            gasUsed: Math.floor(Math.random() * 100000) + 21000,
            status: 'Success',
            input: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
            functionName: txHash.startsWith('swap-tx-') ? 'swap' : 
                         txHash.startsWith('pool-tx-') ? 'addLiquidity' : 'approve',
            logs: []
          };
          
          addDebugInfo(`Generated mock transaction details`);
          setSelectedTransaction(details);
          setIsLoading(false);
        }, 500);
        return;
      }
      
      // Get transaction details from blockchain service
      addDebugInfo(`Checking if web3 is available: ${!!blockchainService.web3}`);
      
      if (!blockchainService.web3 || !blockchainService.web3.eth) {
        throw new Error('Web3 not available in blockchain service');
      }
      
      // Get transaction details
      const tx = await blockchainService.web3.eth.getTransaction(txHash);
      addDebugInfo(`Got transaction: ${!!tx}`);
      
      const receipt = await blockchainService.web3.eth.getTransactionReceipt(txHash);
      addDebugInfo(`Got receipt: ${!!receipt}`);
      
      const block = await blockchainService.web3.eth.getBlock(tx.blockNumber);
      addDebugInfo(`Got block: ${!!block}`);
      
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
        functionName: blockchainService.decodeFunctionSignature ? 
                     blockchainService.decodeFunctionSignature(tx.input) : 'Unknown',
        logs: receipt ? receipt.logs : []
      };
      
      addDebugInfo(`Setting transaction details`);
      setSelectedTransaction(details);
    } catch (error) {
      console.error(`Error retrieving transaction details:`, error);
      setError(`Failed to retrieve transaction details: ${error.message}`);
      addDebugInfo(`Error in showTransactionDetails: ${error.message}`);
      
      // Create a dummy transaction for display
      if (txHash && mockMode) {
        const dummyTx = {
          hash: txHash,
          error: error.message,
          status: 'Error retrieving details'
        };
        setSelectedTransaction(dummyTx);
      }
    } finally {
      setIsLoading(false);
      addDebugInfo('Finished showTransactionDetails');
    }
  };
  
  // Function to close details view
  const closeTransactionDetails = () => {
    setSelectedTransaction(null);
    addDebugInfo('Closed transaction details');
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
      justifyContent