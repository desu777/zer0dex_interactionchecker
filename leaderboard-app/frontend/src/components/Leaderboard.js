import React, { useState, useEffect } from 'react';
import { Sun, Moon, Trophy, DollarSign, Clock, ArrowUp, ArrowDown, Link, RefreshCw } from 'lucide-react';
import axios from 'axios';
import './Leaderboard.css';

const Leaderboard = () => {
  // Application state
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [sortBy, setSortBy] = useState('total_interactions');
  const [sortDirection, setSortDirection] = useState('desc');
  const [timeRange, setTimeRange] = useState('all'); // 'day', 'week', 'month', 'all'

  // Fetch leaderboard data
  useEffect(() => {
    fetchLeaderboardData();
  }, [timeRange]);

  const fetchLeaderboardData = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await axios.get(`/api/leaderboard?timeRange=${timeRange}`);
      setLeaderboardData(response.data.wallets || []);
      setStats(response.data.stats || {
        total_wallets: 0,
        total_interactions: 0,
        last_update: new Date().toISOString()
      });
      setIsLoading(false);
    } catch (err) {
      console.error('Błąd podczas pobierania danych leaderboard:', err);
      setError('Nie udało się pobrać danych. Spróbuj ponownie później.');
      setIsLoading(false);
    }
  };

  const formatWalletAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
    if (!leaderboardData || !leaderboardData.length) return [];
    
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
        main: '#FFFFFF',
        secondary: '#FDF7FD',
        panel: '#FAEAFA',
        accent: '#FCF2FC',
        text: '#221B22',
      },
      primary: {
        main: '#FE4E52',
        hover: '#E18528',
        light: 'rgba(254, 78, 82, 0.1)',
      },
      system: {
        main: '#5C4C5C',
        text: '#A591A4',
        secondary: '#C3C3CD',
        accent: '#F8F6F8',
        link: '#748dc1',
        success: '#00B8A1',
        error: '#FE4E52',
        warning: '#E18528',
        info: '#E074DD',
        purple: '#D952D5',
      }
    },
    dark: {
      bg: {
        main: '#050505',
        secondary: '#0F0F0F',
        panel: '#1C171C',
        accent: '#FCF2FC',
        text: '#C3C3CD',
      },
      primary: {
        main: '#00D2E9',
        hover: '#E18528',
        light: 'rgba(0, 210, 233, 0.1)',
      },
      system: {
        main: '#C3C3CD',
        text: '#98999F',
        secondary: '#505158',
        accent: '#F8F6F8',
        link: '#748dc1',
        success: '#00B8A1',
        error: '#FE4E52',
        warning: '#E18528',
        info: '#00D2E9',
        purple: '#D952D5',
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
      width: '100%',
      backgroundColor: theme.bg.main,
      color: darkMode ? theme.bg.text : theme.bg.text,
      transition: 'background-color 0.3s, color 0.3s',
      margin: 0,
      padding: 0,
      position: 'relative'
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
      color: darkMode ? theme.system.main : theme.bg.text,
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    badge: {
      fontSize: '12px',
      backgroundColor: darkMode ? 'rgba(0, 210, 233, 0.2)' : 'rgba(224, 116, 221, 0.2)',
      color: darkMode ? theme.primary.main : theme.system.info,
      padding: '2px 8px',
      borderRadius: '4px',
      marginLeft: '10px'
    },
    themeToggle: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: darkMode ? theme.system.main : theme.bg.text,
      fontSize: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '8px',
      borderRadius: '50%',
      backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
      transition: 'all 0.3s'
    },
    content: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px',
      backgroundColor: theme.bg.main,
      width: '100%'
    },
    statsRow: {
      display: 'flex',
      justifyContent: 'space-between',
      gap: '20px',
      marginBottom: '30px',
      flexWrap: 'wrap'
    },
    statCard: {
      flex: 1,
      minWidth: '220px',
      backgroundColor: darkMode ? theme.bg.secondary : theme.bg.panel,
      borderRadius: '12px',
      padding: '20px',
      boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.25)' : '0 4px 20px rgba(0,0,0,0.1)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      transition: 'all 0.3s'
    },
    statIcon: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '40px',
      height: '40px',
      borderRadius: '10px',
      marginBottom: '15px',
      color: '#fff',
      fontSize: '20px'
    },
    statValue: {
      fontSize: '28px',
      fontWeight: 'bold',
      color: darkMode ? theme.system.main : theme.bg.text,
      marginBottom: '5px'
    },
    statLabel: {
      fontSize: '14px',
      color: darkMode ? theme.system.text : theme.system.main
    },
    leaderboardHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px'
    },
    title: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: darkMode ? theme.system.main : theme.bg.text
    },
    leaderboardFilters: {
      display: 'flex',
      gap: '10px',
      alignItems: 'center'
    },
    filterButton: {
      padding: '8px 16px',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      backgroundColor: darkMode ? theme.bg.panel : theme.bg.accent,
      color: darkMode ? theme.system.text : theme.system.main,
      transition: 'all 0.3s'
    },
    filterButtonActive: {
      backgroundColor: darkMode ? theme.primary.light : theme.primary.light,
      color: darkMode ? theme.primary.main : theme.primary.main,
      fontWeight: 'bold'
    },
    lastUpdate: {
      fontSize: '12px',
      color: darkMode ? theme.system.text : theme.system.main,
      marginBottom: '10px',
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      backgroundColor: theme.bg.main,
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: darkMode ? '0 4px 30px rgba(0,0,0,0.2)' : '0 4px 30px rgba(0,0,0,0.1)'
    },
    tableHeader: {
      fontSize: '14px',
      fontWeight: '600',
      color: darkMode ? theme.system.main : theme.system.main,
      textAlign: 'left',
      padding: '16px',
      backgroundColor: darkMode ? theme.bg.secondary : theme.bg.panel,
      cursor: 'pointer',
      userSelect: 'none',
      transition: 'all 0.3s',
      borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`
    },
    sortIcon: {
      marginLeft: '6px',
      fontSize: '14px',
      verticalAlign: 'middle'
    },
    tableRow: {
      transition: 'all 0.3s',
      backgroundColor: darkMode ? theme.bg.secondary : theme.bg.main
    },
    tableRowHover: {
      backgroundColor: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.01)',
    },
    tableRowTop: {
      backgroundColor: darkMode ? 'rgba(0, 210, 233, 0.05)' : 'rgba(254, 78, 82, 0.05)',
    },
    tableCell: {
      padding: '14px 16px',
      borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'}`,
      backgroundColor: 'inherit'
    },
    rankCell: {
      fontWeight: 'bold',
      color: darkMode ? theme.primary.main : theme.primary.main,
      width: '70px'
    },
    rankTop: {
      fontSize: '16px',
      color: darkMode ? theme.primary.main : theme.primary.main
    },
    addressLink: {
      color: darkMode ? theme.primary.main : theme.primary.main,
      textDecoration: 'none',
      fontFamily: 'monospace',
      fontSize: '14px',
      position: 'relative',
      paddingBottom: '2px'
    },
    valueCell: {
      fontWeight: '600',
      color: darkMode ? theme.system.main : theme.bg.text
    },
    interactionCell: {
      fontWeight: '500',
      color: darkMode ? theme.system.text : theme.system.main
    },
    footer: {
      padding: '30px 20px',
      backgroundColor: darkMode ? theme.bg.secondary : theme.bg.secondary,
      borderTop: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
      textAlign: 'center',
      fontSize: '14px',
      color: darkMode ? theme.system.text : theme.system.main
    },
    footerLinks: {
      display: 'flex',
      justifyContent: 'center',
      gap: '20px',
      marginTop: '15px'
    },
    footerLink: {
      color: darkMode ? theme.primary.main : theme.primary.main,
      textDecoration: 'none',
      fontWeight: '500',
      transition: 'all 0.3s'
    },
    loadingContainer: {
      padding: '40px',
      textAlign: 'center',
      color: darkMode ? theme.system.text : theme.system.main
    },
    loadingBar: {
      height: '4px',
      width: '200px',
      backgroundColor: darkMode ? theme.bg.panel : theme.bg.panel,
      borderRadius: '2px',
      margin: '20px auto',
      position: 'relative',
      overflow: 'hidden'
    },
    loadingAnimation: {
      position: 'absolute',
      height: '100%',
      width: '50px',
      backgroundColor: darkMode ? theme.primary.main : theme.primary.main,
      borderRadius: '2px',
      animation: 'loading 1.5s infinite'
    },
    errorContainer: {
      padding: '40px',
      textAlign: 'center',
      color: darkMode ? theme.system.error : theme.system.error
    },
    retryButton: {
      marginTop: '20px',
      padding: '8px 16px',
      backgroundColor: darkMode ? theme.primary.main : theme.primary.main,
      color: '#fff',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: '500',
      transition: 'all 0.3s'
    },
    walletButton: {
      padding: '8px 16px',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      backgroundColor: darkMode ? theme.bg.panel : theme.bg.accent,
      color: darkMode ? theme.system.text : theme.system.main,
      transition: 'all 0.3s'
    }
  };

  if (isLoading) {
    return (
      <div style={styles.appContainer}>
        <div style={styles.header}>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
            {darkMode ? (
              <img src="/logo-dark.svg" alt="Zer0" style={{height: '36px'}} />
            ) : (
              <img src="/logo.svg" alt="Zer0" style={{height: '36px'}} />
            )}
            <span style={styles.logo}>Interaction Leaderboard</span>
          </div>
          <button 
            style={styles.themeToggle} 
            onClick={() => setDarkMode(!darkMode)}
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
        <div style={styles.content}>
          <div style={styles.loadingContainer}>
            <h2>Loading leaderboard data...</h2>
            <div style={styles.loadingBar}>
              <div style={styles.loadingAnimation}></div>
            </div>
            <p>Fetching and sorting most active wallets</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.appContainer}>
        <div style={styles.header}>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
            {darkMode ? (
              <img src="/logo-dark.svg" alt="Zer0" style={{height: '36px'}} />
            ) : (
              <img src="/logo.svg" alt="Zer0" style={{height: '36px'}} />
            )}
            <span style={styles.logo}>Interaction Leaderboard</span>
          </div>
          <button 
            style={styles.themeToggle} 
            onClick={() => setDarkMode(!darkMode)}
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
        <div style={styles.content}>
          <div style={styles.errorContainer}>
            <h2>An error occurred</h2>
            <p>{error}</p>
            <button 
              style={styles.retryButton} 
              onClick={fetchLeaderboardData}
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const sortedLeaderboardData = getSortedData();

  return (
    <div style={styles.appContainer}>
      {/* CSS for laser animation */}
      <style>
        {`
          :root {
            --background-color: ${darkMode ? theme.bg.main : '#FFFFFF'};
          }
          
          @keyframes laserAnimation {
            0% { background-position: 0% 0%; }
            25% { background-position: 100% 0%; }
            50% { background-position: 100% 100%; }
            75% { background-position: 0% 100%; }
            100% { background-position: 0% 0%; }
          }
          
          .laser-button {
            position: relative;
            z-index: 1;
          }
          
          .laser-button::before {
            content: "";
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            border-radius: 22px;
            background: linear-gradient(90deg, transparent, transparent, #ffffff, transparent, transparent);
            background-size: 400% 400%;
            z-index: -1;
            animation: laserAnimation 3s ease-in-out infinite;
            -webkit-mask: 
              linear-gradient(#fff 0 0) content-box, 
              linear-gradient(#fff 0 0);
            -webkit-mask-composite: xor;
            mask-composite: exclude;
            padding: 2px;
          }
        `}
      </style>
      
      {/* Header */}
      <header style={styles.header}>
        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
          {darkMode ? (
            <img src="/logo-dark.svg" alt="Zer0" style={{height: '36px'}} />
          ) : (
            <img src="/logo.svg" alt="Zer0" style={{height: '36px'}} />
          )}
          <span style={styles.logo}>Interaction Leaderboard</span>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
          <a 
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '8px 16px',
              background: darkMode ? 
                theme.system.info : 
                `linear-gradient(to right, ${theme.system.error}, ${theme.system.purple})`,
              color: 'white',
              borderRadius: '20px',
              textDecoration: 'none',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <span>Checker</span>
          </a>
          <button 
            style={styles.themeToggle} 
            onClick={() => setDarkMode(!darkMode)}
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </header>

      <div style={styles.content}>
        <div style={styles.statsRow}>
          <div style={styles.statCard}>
            <div style={{...styles.statIcon, backgroundColor: theme.system.info}}>
              <Trophy size={20} />
            </div>
            <div style={styles.statValue}>{stats?.total_wallets || 0}</div>
            <div style={styles.statLabel}>Unique wallets</div>
          </div>
          
          <div style={styles.statCard}>
            <div style={{...styles.statIcon, backgroundColor: theme.system.success}}>
              <DollarSign size={20} />
            </div>
            <div style={styles.statValue}>{stats?.total_interactions || 0}</div>
            <div style={styles.statLabel}>All interactions</div>
          </div>
          
          <div style={styles.statCard}>
            <div style={{...styles.statIcon, backgroundColor: theme.system.error}}>
              <Clock size={20} />
            </div>
            <div style={styles.statValue}>{formatDate(stats?.last_update).split(',')[0]}</div>
            <div style={styles.statLabel}>Last update</div>
          </div>
        </div>
        
        {/* Cover image */}
        <div style={{marginBottom: '30px', width: '100%'}}>
          <img 
            src="/cover.png" 
            alt="Cover" 
            style={{
              width: '100%',
              maxHeight: '200px',
              objectFit: 'cover',
              borderRadius: '12px',
              boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.25)' : '0 4px 20px rgba(0,0,0,0.1)',
            }}
          />
        </div>
        
        <div style={styles.leaderboardHeader}>
          <div>
            <h2 style={styles.title}>Wallet Ranking</h2>
            <div style={styles.lastUpdate}>
              <Clock size={14} />
              Last update: {formatDate(stats?.last_update)}
            </div>
            <div style={{...styles.lastUpdate, marginTop: '4px'}}>
              <Link size={14} />
              Data syncing since block 3630076 2 days before zer0_dex launched
            </div>
            <div style={{...styles.lastUpdate, marginTop: '4px'}}>
              <RefreshCw size={14} />
              Leaderboard is automatically updated daily with new wallets and transactions
            </div>
          </div>
        </div>
        
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.tableHeader}>Rank</th>
              <th 
                style={styles.tableHeader}
                onClick={() => handleSort('address')}
              >
                Address
                {sortBy === 'address' && (
                  <span style={styles.sortIcon}>
                    {sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                  </span>
                )}
              </th>
              <th 
                style={styles.tableHeader}
                onClick={() => handleSort('total_interactions')}
              >
                Interactions
                {sortBy === 'total_interactions' && (
                  <span style={styles.sortIcon}>
                    {sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                  </span>
                )}
              </th>
              <th 
                style={styles.tableHeader}
                onClick={() => handleSort('swap_interactions')}
              >
                Swap
                {sortBy === 'swap_interactions' && (
                  <span style={styles.sortIcon}>
                    {sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                  </span>
                )}
              </th>
              <th 
                style={styles.tableHeader}
                onClick={() => handleSort('pool_interactions')}
              >
                Pool
                {sortBy === 'pool_interactions' && (
                  <span style={styles.sortIcon}>
                    {sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                  </span>
                )}
              </th>
              <th 
                style={styles.tableHeader}
                onClick={() => handleSort('approve_interactions')}
              >
                Approve
                {sortBy === 'approve_interactions' && (
                  <span style={styles.sortIcon}>
                    {sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                  </span>
                )}
              </th>
              <th 
                style={styles.tableHeader}
                onClick={() => handleSort('last_interaction_date')}
              >
                Last interaction
                {sortBy === 'last_interaction_date' && (
                  <span style={styles.sortIcon}>
                    {sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                  </span>
                )}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedLeaderboardData.map((wallet, index) => (
              <tr 
                key={wallet.address}
                style={{
                  ...styles.tableRow,
                  ...(index < 3 ? styles.tableRowTop : {}),
                }}
                className="table-row"
              >
                <td style={{...styles.tableCell, ...styles.rankCell, ...(index < 3 ? styles.rankTop : {})}}>
                  {index + 1}
                </td>
                <td style={styles.tableCell}>
                  <a 
                    href={`https://explorer.0g.ai/address/${wallet.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.addressLink}
                    className="address-link"
                  >
                    {formatWalletAddress(wallet.address)}
                  </a>
                </td>
                <td style={{...styles.tableCell, ...styles.valueCell}}>
                  {wallet.total_interactions}
                </td>
                <td style={{...styles.tableCell, ...styles.interactionCell}}>
                  {wallet.swap_interactions}
                </td>
                <td style={{...styles.tableCell, ...styles.interactionCell}}>
                  {wallet.pool_interactions}
                </td>
                <td style={{...styles.tableCell, ...styles.interactionCell}}>
                  {wallet.approve_interactions}
                </td>
                <td style={{...styles.tableCell, ...styles.interactionCell}}>
                  {formatDate(wallet.last_interaction_date)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
            <span>Zer0 Interaction Checker © 2025 | Builded for zer0_dex | Powered by desu </span>
            <img src="/nft.png" alt="NFT" style={{height: '40px', borderRadius: '50%'}} />
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
            <span>Data provided by</span>
            <img src="/logo.png" alt="0G Logo" style={{height: '50px'}} />
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Leaderboard; 