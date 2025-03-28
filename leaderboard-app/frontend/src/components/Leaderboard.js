import React, { useState, useEffect } from 'react';
import { Sun, Moon, Trophy, DollarSign, Clock, ArrowUp, ArrowDown } from 'lucide-react';
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
    return date.toLocaleDateString('pl-PL', {
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
      padding: '20px'
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
      borderCollapse: 'separate',
      borderSpacing: '0',
      overflow: 'hidden',
      borderRadius: '12px',
      boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.25)' : '0 4px 20px rgba(0,0,0,0.1)',
      backgroundColor: darkMode ? theme.bg.secondary : '#fff'
    },
    tableHeader: {
      padding: '16px',
      textAlign: 'left',
      backgroundColor: darkMode ? theme.bg.panel : theme.bg.secondary,
      color: darkMode ? theme.system.main : theme.system.main,
      fontWeight: '600',
      position: 'relative',
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
      backgroundColor: darkMode ? theme.bg.secondary : '#fff'
    },
    tableRowHover: {
      backgroundColor: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.01)',
    },
    tableRowTop: {
      backgroundColor: darkMode ? 'rgba(0, 210, 233, 0.05)' : 'rgba(254, 78, 82, 0.05)',
    },
    tableCell: {
      padding: '14px 16px',
      borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'}`
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
    }
  };

  if (isLoading) {
    return (
      <div style={styles.appContainer}>
        <div style={styles.header}>
          <div style={styles.logo}>
            <img src="/logo.svg" alt="Zero Interaction" height="28" />
            Zero Interaction
            <span style={styles.badge}>Leaderboard</span>
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
            <h2>Ładowanie danych leaderboard...</h2>
            <div style={styles.loadingBar}>
              <div style={styles.loadingAnimation}></div>
            </div>
            <p>Pobieranie i sortowanie najaktywniejszych portfeli</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.appContainer}>
        <div style={styles.header}>
          <div style={styles.logo}>
            <img src="/logo.svg" alt="Zero Interaction" height="28" />
            Zero Interaction
            <span style={styles.badge}>Leaderboard</span>
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
            <h2>Wystąpił błąd</h2>
            <p>{error}</p>
            <button 
              style={styles.retryButton} 
              onClick={fetchLeaderboardData}
            >
              Spróbuj ponownie
            </button>
          </div>
        </div>
      </div>
    );
  }

  const sortedLeaderboardData = getSortedData();

  return (
    <div style={styles.appContainer}>
      <div style={styles.header}>
        <div style={styles.logo}>
          <img src="/logo.svg" alt="Zero Interaction" height="28" />
          Zero Interaction
          <span style={styles.badge}>Leaderboard</span>
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
        <div style={styles.statsRow}>
          <div style={styles.statCard}>
            <div style={{...styles.statIcon, backgroundColor: theme.system.info}}>
              <Trophy size={20} />
            </div>
            <div style={styles.statValue}>{stats?.total_wallets || 0}</div>
            <div style={styles.statLabel}>Unikalne portfele</div>
          </div>
          
          <div style={styles.statCard}>
            <div style={{...styles.statIcon, backgroundColor: theme.system.success}}>
              <DollarSign size={20} />
            </div>
            <div style={styles.statValue}>{stats?.total_interactions || 0}</div>
            <div style={styles.statLabel}>Wszystkie interakcje</div>
          </div>
          
          <div style={styles.statCard}>
            <div style={{...styles.statIcon, backgroundColor: theme.system.error}}>
              <Clock size={20} />
            </div>
            <div style={styles.statValue}>{formatDate(stats?.last_update).split(',')[0]}</div>
            <div style={styles.statLabel}>Ostatnia aktualizacja</div>
          </div>
        </div>
        
        <div style={styles.leaderboardHeader}>
          <div>
            <h2 style={styles.title}>Ranking portfeli</h2>
            <div style={styles.lastUpdate}>
              <Clock size={14} />
              Ostatnia aktualizacja: {formatDate(stats?.last_update)}
            </div>
          </div>
          
          <div style={styles.leaderboardFilters}>
            <button 
              style={{
                ...styles.filterButton,
                ...(timeRange === 'all' ? styles.filterButtonActive : {})
              }}
              onClick={() => setTimeRange('all')}
            >
              All time
            </button>
            <button 
              style={{
                ...styles.filterButton,
                ...(timeRange === 'month' ? styles.filterButtonActive : {})
              }}
              onClick={() => setTimeRange('month')}
            >
              Month
            </button>
            <button 
              style={{
                ...styles.filterButton,
                ...(timeRange === 'week' ? styles.filterButtonActive : {})
              }}
              onClick={() => setTimeRange('week')}
            >
              Week
            </button>
            <button 
              style={{
                ...styles.filterButton,
                ...(timeRange === 'day' ? styles.filterButtonActive : {})
              }}
              onClick={() => setTimeRange('day')}
            >
              Today
            </button>
          </div>
        </div>
        
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.tableHeader}>Pozycja</th>
              <th 
                style={styles.tableHeader}
                onClick={() => handleSort('address')}
              >
                Adres
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
                Interakcje
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
                onClick={() => handleSort('first_interaction_date')}
              >
                Pierwsza interakcja
                {sortBy === 'first_interaction_date' && (
                  <span style={styles.sortIcon}>
                    {sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                  </span>
                )}
              </th>
              <th 
                style={styles.tableHeader}
                onClick={() => handleSort('last_interaction_date')}
              >
                Ostatnia interakcja
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
                  {formatDate(wallet.first_interaction_date)}
                </td>
                <td style={{...styles.tableCell, ...styles.interactionCell}}>
                  {formatDate(wallet.last_interaction_date)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div style={styles.footer}>
        <div>© {new Date().getFullYear()} Zero Interaction Leaderboard. Built by desu777.</div>
        <div style={styles.footerLinks}>
          <a 
            href="https://twitter.com/0g_ai" 
            target="_blank" 
            rel="noopener noreferrer"
            style={styles.footerLink}
          >
            Twitter
          </a>
          <a 
            href="https://discord.com/invite/0g-ai" 
            target="_blank" 
            rel="noopener noreferrer"
            style={styles.footerLink}
          >
            Discord
          </a>
          <a 
            href="https://explorer.0g.ai/contract/0xe233d75ce6f04c04610947188dec7c55790bef3b" 
            target="_blank" 
            rel="noopener noreferrer"
            style={styles.footerLink}
          >
            Contracts
          </a>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard; 