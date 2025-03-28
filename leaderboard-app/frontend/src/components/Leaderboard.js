import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Leaderboard.css';

const Leaderboard = () => {
  const [wallets, setWallets] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLeaderboardData();
  }, []);

  const fetchLeaderboardData = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await axios.get('/api/leaderboard?limit=100');
      setWallets(response.data.wallets);
      setStats(response.data.stats);
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

  if (isLoading) {
    return (
      <div className="container leaderboard-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Ładowanie danych leaderboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container leaderboard-container">
        <div className="error-container">
          <h2>Wystąpił błąd</h2>
          <p>{error}</p>
          <button onClick={fetchLeaderboardData} className="retry-button">
            Spróbuj ponownie
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container leaderboard-container">
      <div className="leaderboard-header">
        <h1>Zero Interaction Leaderboard</h1>
        <p className="last-update">
          Ostatnia aktualizacja: {stats ? formatDate(stats.last_update) : 'N/A'}
        </p>
      </div>
      
      <div className="stats-summary">
        <div className="stat-box">
          <h3>Portfele</h3>
          <p>{stats?.total_wallets || 0}</p>
        </div>
        <div className="stat-box">
          <h3>Interakcje</h3>
          <p>{stats?.total_interactions || 0}</p>
        </div>
      </div>

      <div className="leaderboard-table-container">
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>Pozycja</th>
              <th>Adres</th>
              <th>Interakcje</th>
              <th>Swap</th>
              <th>Pool</th>
              <th>Approve</th>
              <th>Pierwsza interakcja</th>
              <th>Ostatnia interakcja</th>
            </tr>
          </thead>
          <tbody>
            {wallets.map((wallet, index) => (
              <tr key={wallet.address}>
                <td className="position">{index + 1}</td>
                <td className="address">
                  <a 
                    href={`https://explorer.0g.ai/address/${wallet.address}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    {formatWalletAddress(wallet.address)}
                  </a>
                </td>
                <td className="total">{wallet.total_interactions}</td>
                <td>{wallet.swap_interactions}</td>
                <td>{wallet.pool_interactions}</td>
                <td>{wallet.approve_interactions}</td>
                <td>{formatDate(wallet.first_interaction_date)}</td>
                <td>{formatDate(wallet.last_interaction_date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Leaderboard; 