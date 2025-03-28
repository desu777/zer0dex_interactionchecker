import React, { useState, useEffect } from 'react';
import { Sun, Moon, Trophy, DollarSign, Clock, ArrowUp, ArrowDown } from 'lucide-react';
import axios from 'axios';
import { formatWalletAddress } from '../../src/utils/walletUtils';

const LeaderboardUI = () => {
  // Application state
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [sortBy, setSortBy] = useState('totalCount');
  const [sortDirection, setSortDirection] = useState('desc');
  const [timeRange, setTimeRange] = useState('all'); // 'day', 'week', 'month', 'all'
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch leaderboard data
  useEffect(() => {
    fetchLeaderboardData();
  }, [timeRange]);

  const fetchLeaderboardData = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // API endpoint would normally include timeRange as a parameter
      const response = await axios.get(`/api/leaderboard?timeRange=${timeRange}`);
      
      // For now, let's mock this with sample data for demonstration
      const mockData = generateMockLeaderboardData();
      
      setLeaderboardData(mockData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching leaderboard data:", error);
      setError('Failed to load leaderboard data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate mock data for demonstration
  const generateMockLeaderboardData = () => {
    const data = [];
    for (let i = 1; i <= 25; i++) {
      const randomEthAddress = `0x${Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
      const swapCount = Math.floor(Math.random() * 200) + 10;
      const poolCount = Math.floor(Math.random() * 50) + 5;
      const approveCount = Math.floor(Math.random() * 30) + 5;
      const totalCount = swapCount + poolCount + approveCount;
      
      const totalVolume = (Math.random() * 100 + 1).toFixed(2);
      const avgValue = (Number(totalVolume) / totalCount).toFixed(2);
      
      const today = new Date();
      const lastInteractionDate = new Date(today);
      lastInteractionDate.setDate(today.getDate() - Math.floor(Math.random() * 7));
      
      const firstInteractionDate = new Date(today);
      firstInteractionDate.setDate(today.getDate() - (30 + Math.floor(Math.random() * 60)));
      
      data.push({
        rank: i,
        address: randomEthAddress,
        swapCount,
        poolCount,
        approveCount,
        totalCount,
        totalVolume,
        avgValue,
        lastInteraction: lastInteractionDate.toLocaleDateString(),
        firstInteraction: firstInteractionDate.toLocaleDateString(),
      });
    }
    
    return data;
  };

  // Handle sorting
  const handleSort = (column) => {
    if (sortBy === column) {
      // Toggle sort direction if clicking the same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Default to descending when changing columns
      setSortBy(column);
      setSortDirection('desc');
    }
  };

  // Get sorted data
  const getSortedData = () => {
    if (!leaderboardData.length) return [];
    
    return [...leaderboardData].sort((a, b) => {
      // For numeric values
      if (typeof a[sortBy] === 'number') {
        return sortDirection === 'desc' 
          ? b[sortBy] - a[sortBy] 
          : a[sortBy] - b[sortBy];
      }
      
      // For string values
      return sortDirection === 'desc'
        ? String(b[sortBy]).localeCompare(String(a[sortBy]))
        : String(a[sortBy]).localeCompare(String(b[sortBy]));
    });
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
    walletButton: {
      padding: '6px 12px',
      background: darkMode ? 
        theme.system.info : 
        `linear-gradient(to right, ${theme.system.error}, ${theme.system.purple})`,
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
      maxWidth: '1200px',
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
      fontSize: '24px',
      fontWeight: '600',
      marginBottom: '24px',
      color: darkMode ? theme.system.main : theme.bg.text,
      textAlign: 'center'
    },
    statsRow: {
      display: 'flex', 
      justifyContent: 'space-between',
      marginBottom: '20px',
      flexWrap: 'wrap',
      gap: '16px'
    },
    statCard: {
      flex: '1 1 20%',
      backgroundColor: darkMode ? 'rgba(28, 23, 28, 0.5)' : theme.bg.accent,
      borderRadius: '16px',
      padding: '16px',
      textAlign: 'center',
      minWidth: '180px',
      border: '1px solid',
      borderColor: darkMode ? `rgba(0, 210, 233, 0.2)` : `rgba(224, 116, 221, 0.2)`,
    },
    statValue: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: darkMode ? theme.primary.main : theme.system.info
    },
    statLabel: {
      fontSize: '14px',
      color: darkMode ? theme.system.text : theme.system.text,
      marginTop: '4px'
    },
    leaderboardFilters: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      margin: '0 0 20px 0',
      flexWrap: 'wrap',
      gap: '16px'
    },
    filtersLeft: {
      display: 'flex',
      gap: '12px'
    },
    timeRangeButton: (active) => ({
      background: active ? 
        (darkMode ? theme.system.info : `linear-gradient(to right, ${theme.system.error}, ${theme.system.purple})`) : 
        (darkMode ? 'rgba(28, 23, 28, 0.5)' : theme.bg.accent),
      color: active ? 'white' : (darkMode ? theme.system.main : theme.bg.text),
      border: 'none',
      borderRadius: '20px',
      padding: '8px 16px',
      fontSize: '14px',
      fontWeight: active ? '600' : '400',
      cursor: 'pointer'
    }),
    lastUpdated: {
      fontSize: '14px',
      color: darkMode ? theme.system.text : theme.system.text
    },
    table: {
      width: '100%',
      borderCollapse: 'separate',
      borderSpacing: '0 8px'
    },
    tableHead: {
      textAlign: 'left'
    },
    tableHeader: {
      padding: '12px 16px',
      color: darkMode ? theme.system.text : theme.system.text,
      fontWeight: '600',
      fontSize: '14px',
      cursor: 'pointer',
      position: 'relative',
      whiteSpace: 'nowrap'
    },
    tableHeaderSorted: {
      color: darkMode ? theme.primary.main : theme.system.info
    },
    sortIcon: {
      marginLeft: '4px',
      position: 'relative',
      top: '2px'
    },
    tableRow: {
      backgroundColor: darkMode ? 'rgba(28, 23, 28, 0.5)' : theme.bg.accent,
      borderRadius: '12px',
      transition: 'transform 0.2s',
      '&:hover': {
        transform: 'translateY(-2px)'
      }
    },
    tableCell: {
      padding: '16px',
      borderTop: 'none',
      borderBottom: 'none',
      color: darkMode ? theme.system.main : theme.bg.text,
      fontSize: '15px'
    },
    rankCell: {
      fontWeight: '700',
      borderTopLeftRadius: '12px',
      borderBottomLeftRadius: '12px'
    },
    lastCell: {
      borderTopRightRadius: '12px',
      borderBottomRightRadius: '12px'
    },
    addressCell: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    addressLink: {
      color: darkMode ? theme.primary.main : theme.system.info,
      textDecoration: 'none',
      fontWeight: '500',
      '&:hover': {
        textDecoration: 'underline'
      }
    },
    badge: {
      padding: '4px 8px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '600'
    },
    badgeTop: {
      backgroundColor: darkMode ? 'rgba(0, 184, 161, 0.2)' : 'rgba(0, 184, 161, 0.2)',
      color: theme.system.success
    },
    badgeRegular: {
      backgroundColor: darkMode ? 'rgba(0, 210, 233, 0.2)' : 'rgba(224, 116, 221, 0.2)',
      color: darkMode ? theme.primary.main : theme.system.info
    },
    loadingContainer: {
      textAlign: 'center',
      padding: '40px',
      color: darkMode ? theme.system.text : theme.system.text
    },
    errorContainer: {
      textAlign: 'center',
      padding: '40px',
      color: theme.system.error
    },
    footer: {
      textAlign: 'center',
      padding: '16px',
      fontSize: '14px',
      marginTop: '40px',
      color: darkMode ? theme.system.text : theme.system.text
    }
  };

  // Get sorted data for rendering
  const sortedData = getSortedData();

  return (
    <div style={styles.appContainer}>
      {/* Header */}
      <header style={styles.header}>
        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
          {darkMode ? (
            <img src="/photo/logo-dark.svg" alt="Zer0" style={{height: '36px'}} />
          ) : (
            <img src="/photo/logo-light.svg" alt="Zer0" style={{height: '36px'}} />
          )}
          <span style={styles.logo}>Interaction Leaderboard</span>
          <span style={styles.badge}>Live</span>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
          <button 
            onClick={() => setDarkMode(!darkMode)} 
            style={styles.themeToggle}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </header>

      {/* Main menu */}
      <div style={styles.mainMenu}>
        <a 
          href="/"
          style={{
            ...styles.menuItem,
            textDecoration: 'none'
          }}
        >
          Interaction Checker
        </a>
        <a 
          href="/leaderboard"
          style={{
            ...styles.menuItemActive,
            background: darkMode ? theme.system.info : `linear-gradient(to right, ${theme.system.error}, ${theme.system.purple})`,
            textDecoration: 'none'
          }}
        >
          Leaderboard
        </a>
        <a 
          href="https://test.zer0.exchange/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            ...styles.menuItemActive,
            background: darkMode ? theme.system.info : `linear-gradient(to right, ${theme.system.error}, ${theme.system.purple})`,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          Back to zer0
          <span style={{marginLeft: '4px', fontSize: '16px'}}>🫧</span>
        </a>
      </div>

      {/* Main content */}
      <div style={styles.contentContainer}>
        <div style={styles.panel}>
          <h1 style={styles.title}>Zero Interaction Leaderboard</h1>
          
          {/* Stats row */}
          <div style={styles.statsRow}>
            <div style={styles.statCard}>
              <Trophy size={24} color={darkMode ? theme.primary.main : theme.system.info} style={{marginBottom: '8px'}} />
              <div style={styles.statValue}>{leaderboardData.length}</div>
              <div style={styles.statLabel}>Top Wallets</div>
            </div>
            
            <div style={styles.statCard}>
              <DollarSign size={24} color={darkMode ? theme.primary.main : theme.system.info} style={{marginBottom: '8px'}} />
              <div style={styles.statValue}>
                {leaderboardData.length > 0 
                  ? parseInt(leaderboardData.reduce((sum, wallet) => sum + parseInt(wallet.totalVolume), 0)).toLocaleString()
                  : '0'}
              </div>
              <div style={styles.statLabel}>Total Volume (ZERO)</div>
            </div>
            
            <div style={styles.statCard}>
              <Clock size={24} color={darkMode ? theme.primary.main : theme.system.info} style={{marginBottom: '8px'}} />
              <div style={styles.statValue}>
                {leaderboardData.length > 0 
                  ? leaderboardData.reduce((sum, wallet) => sum + wallet.totalCount, 0).toLocaleString()
                  : '0'}
              </div>
              <div style={styles.statLabel}>Total Interactions</div>
            </div>
          </div>
          
          {/* Leaderboard filters */}
          <div style={styles.leaderboardFilters}>
            <div style={styles.filtersLeft}>
              <button 
                onClick={() => setTimeRange('day')}
                style={styles.timeRangeButton(timeRange === 'day')}
              >
                24h
              </button>
              <button 
                onClick={() => setTimeRange('week')}
                style={styles.timeRangeButton(timeRange === 'week')}
              >
                7d
              </button>
              <button 
                onClick={() => setTimeRange('month')}
                style={styles.timeRangeButton(timeRange === 'month')}
              >
                30d
              </button>
              <button 
                onClick={() => setTimeRange('all')}
                style={styles.timeRangeButton(timeRange === 'all')}
              >
                All time
              </button>
            </div>
            
            {lastUpdated && (
              <div style={styles.lastUpdated}>
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
            )}
          </div>
          
          {/* Leaderboard table */}
          {isLoading ? (
            <div style={styles.loadingContainer}>
              <div style={{fontSize: '18px', marginBottom: '16px'}}>Loading leaderboard data...</div>
              <div style={{
                width: '100%',
                height: '8px',
                backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: '30%',
                  backgroundColor: darkMode ? theme.primary.main : theme.system.info,
                  borderRadius: '4px',
                  animation: 'loading 1.5s infinite',
                }}></div>
              </div>
              <style>{`
                @keyframes loading {
                  0% { transform: translateX(-100%); }
                  100% { transform: translateX(400%); }
                }
              `}</style>
            </div>
          ) : error ? (
            <div style={styles.errorContainer}>
              <div style={{fontSize: '18px', marginBottom: '16px'}}>{error}</div>
              <button 
                onClick={fetchLeaderboardData}
                style={{
                  background: darkMode ? theme.system.info : `linear-gradient(to right, ${theme.system.error}, ${theme.system.purple})`,
                  color: 'white',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '12px 24px',
                  fontSize: '16px',
                  cursor: 'pointer'
                }}
              >
                Try Again
              </button>
            </div>
          ) : (
            <div style={{overflowX: 'auto'}}>
              <table style={styles.table}>
                <thead style={styles.tableHead}>
                  <tr>
                    <th 
                      style={{
                        ...styles.tableHeader,
                        ...(sortBy === 'rank' ? styles.tableHeaderSorted : {})
                      }}
                      onClick={() => handleSort('rank')}
                    >
                      Rank
                      {sortBy === 'rank' && (
                        <span style={styles.sortIcon}>
                          {sortDirection === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                        </span>
                      )}
                    </th>
                    <th style={styles.tableHeader}>Address</th>
                    <th 
                      style={{
                        ...styles.tableHeader,
                        ...(sortBy === 'totalCount' ? styles.tableHeaderSorted : {})
                      }}
                      onClick={() => handleSort('totalCount')}
                    >
                      Total Interactions
                      {sortBy === 'totalCount' && (
                        <span style={styles.sortIcon}>
                          {sortDirection === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                        </span>
                      )}
                    </th>
                    <th 
                      style={{
                        ...styles.tableHeader,
                        ...(sortBy === 'swapCount' ? styles.tableHeaderSorted : {})
                      }}
                      onClick={() => handleSort('swapCount')}
                    >
                      Swaps
                      {sortBy === 'swapCount' && (
                        <span style={styles.sortIcon}>
                          {sortDirection === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                        </span>
                      )}
                    </th>
                    <th 
                      style={{
                        ...styles.tableHeader,
                        ...(sortBy === 'poolCount' ? styles.tableHeaderSorted : {})
                      }}
                      onClick={() => handleSort('poolCount')}
                    >
                      Pool
                      {sortBy === 'poolCount' && (
                        <span style={styles.sortIcon}>
                          {sortDirection === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                        </span>
                      )}
                    </th>
                    <th 
                      style={{
                        ...styles.tableHeader,
                        ...(sortBy === 'approveCount' ? styles.tableHeaderSorted : {})
                      }}
                      onClick={() => handleSort('approveCount')}
                    >
                      Approve
                      {sortBy === 'approveCount' && (
                        <span style={styles.sortIcon}>
                          {sortDirection === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                        </span>
                      )}
                    </th>
                    <th 
                      style={{
                        ...styles.tableHeader,
                        ...(sortBy === 'totalVolume' ? styles.tableHeaderSorted : {})
                      }}
                      onClick={() => handleSort('totalVolume')}
                    >
                      Volume
                      {sortBy === 'totalVolume' && (
                        <span style={styles.sortIcon}>
                          {sortDirection === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                        </span>
                      )}
                    </th>
                    <th 
                      style={{
                        ...styles.tableHeader,
                        ...(sortBy === 'lastInteraction' ? styles.tableHeaderSorted : {})
                      }}
                      onClick={() => handleSort('lastInteraction')}
                    >
                      Last Activity
                      {sortBy === 'lastInteraction' && (
                        <span style={styles.sortIcon}>
                          {sortDirection === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                        </span>
                      )}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedData.map((wallet, index) => (
                    <tr key={wallet.address} style={{
                      ...styles.tableRow,
                      backgroundColor: darkMode ? 
                        (index % 2 === 0 ? 'rgba(28, 23, 28, 0.7)' : 'rgba(28, 23, 28, 0.5)') : 
                        (index % 2 === 0 ? theme.bg.accent : 'rgba(252, 242, 252, 0.7)')
                    }}>
                      <td style={{
                        ...styles.tableCell,
                        ...styles.rankCell
                      }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '30px',
                          height: '30px',
                          borderRadius: '50%',
                          ...(wallet.rank <= 3 ? 
                            {
                              backgroundColor: darkMode ? 'rgba(0, 184, 161, 0.15)' : 'rgba(0, 184, 161, 0.15)',
                              color: theme.system.success
                            } : 
                            {})
                        }}>
                          {wallet.rank}
                        </span>
                      </td>
                      <td style={styles.tableCell}>
                        <div style={styles.addressCell}>
                          <a 
                            href={`https://chainscan-newton.0g.ai/address/${wallet.address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: darkMode ? theme.primary.main : theme.system.info,
                              textDecoration: 'none'
                            }}
                          >
                            {formatWalletAddress(wallet.address)}
                          </a>
                          
                          {wallet.rank <= 3 && (
                            <span style={{
                              ...styles.badge,
                              ...styles.badgeTop
                            }}>
                              {wallet.rank === 1 ? '🥇' : wallet.rank === 2 ? '🥈' : '🥉'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={styles.tableCell}>
                        <span style={{fontWeight: '700'}}>{wallet.totalCount.toLocaleString()}</span>
                      </td>
                      <td style={styles.tableCell}>{wallet.swapCount.toLocaleString()}</td>
                      <td style={styles.tableCell}>{wallet.poolCount.toLocaleString()}</td>
                      <td style={styles.tableCell}>{wallet.approveCount.toLocaleString()}</td>
                      <td style={styles.tableCell}>{parseFloat(wallet.totalVolume).toLocaleString()} ZERO</td>
                      <td style={{
                        ...styles.tableCell,
                        ...styles.lastCell
                      }}>{wallet.lastInteraction}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      {/* Social Links */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '20px',
        padding: '20px',
        marginTop: '40px'
      }}>
        <a 
          href="https://github.com/desu777" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{
            color: darkMode ? theme.system.text : theme.system.text,
            fontSize: '24px',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0C5.37 0 0 5.37 0 12C0 17.31 3.435 21.795 8.205 23.385C8.805 23.49 9.03 23.13 9.03 22.815C9.03 22.53 9.015 21.585 9.015 20.58C6 21.135 5.22 19.845 4.98 19.17C4.845 18.825 4.26 17.76 3.75 17.475C3.33 17.25 2.73 16.695 3.735 16.68C4.68 16.665 5.355 17.55 5.58 17.91C6.66 19.725 8.385 19.215 9.075 18.9C9.18 18.12 9.495 17.595 9.84 17.295C7.17 16.995 4.38 15.96 4.38 11.37C4.38 10.065 4.845 8.985 5.61 8.145C5.49 7.845 5.07 6.615 5.73 4.965C5.73 4.965 6.735 4.65 9.03 6.195C9.99 5.925 11.01 5.79 12.03 5.79C13.05 5.79 14.07 5.925 15.03 6.195C17.325 4.635 18.33 4.965 18.33 4.965C18.99 6.615 18.57 7.845 18.45 8.145C19.215 8.985 19.68 10.05 19.68 11.37C19.68 15.975 16.875 16.995 14.205 17.295C14.64 17.67 15.015 18.39 15.015 19.515C15.015 21.12 15 22.41 15 22.815C15 23.13 15.225 23.505 15.825 23.385C18.2072 22.5808 20.2772 21.0498 21.7437 19.0074C23.2101 16.9651 23.9994 14.5143 24 12C24 5.37 18.63 0 12 0Z" fill="currentColor"/>
          </svg>
          @desu777
        </a>
        <a 
          href="https://x.com/nov3lolo" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{
            color: darkMode ? theme.system.text : theme.system.text,
            fontSize: '24px',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" fill="currentColor"/>
          </svg>
          @nov3lolo
        </a>
      </div>
      
      {/* Footer */}
      <footer style={styles.footer}>
        <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '15px'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
            <span>Zer0 Interaction Leaderboard © 2025 | Powered by desu</span>
            <img src="/photo/nft.png" alt="NFT" style={{height: '40px', borderRadius: '50%'}} />
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
            <span>Data provided by</span>
            <img src="/photo/0g.png" alt="0G Logo" style={{height: '50px'}} />
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LeaderboardUI;