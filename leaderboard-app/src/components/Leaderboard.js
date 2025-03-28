import React, { useState, useEffect } from 'react';
import { Trophy, Clock, Droplets } from 'lucide-react';
import axios from 'axios';

const Leaderboard = () => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState(null);

  // Pobieranie danych leaderboardu
  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        setIsLoading(true);
        setError('');
        
        // Pobieramy dane z API
        const response = await axios.get('/api/leaderboard');
        
        if (response.data && response.data.wallets) {
          setLeaderboardData(response.data.wallets);
        }
        
        if (response.data && response.data.lastUpdate) {
          setLastUpdate(response.data.lastUpdate);
        }
      } catch (error) {
        console.error('Error fetching leaderboard data:', error);
        setError('Failed to load leaderboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboardData();
    
    // Odświeżamy dane co 5 minut
    const interval = setInterval(fetchLeaderboardData, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Format adresu portfela (skrócony)
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  // Format liczby interakcji
  const formatInteractions = (count) => {
    if (count === null || count === undefined) return '0';
    return count.toLocaleString();
  };
  
  // Format daty
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    
    const date = new Date(dateStr);
    return date.toLocaleString();
  };
  
  // Format wartości gazu (z wei na Ether)
  const formatGasValue = (gasValue) => {
    if (!gasValue) return '0';
    
    // Konwersja string BigInt na wartość w Ether
    try {
      const wei = BigInt(gasValue);
      const ether = Number(wei) / 1e18;
      return ether.toFixed(4);
    } catch (e) {
      console.error('Error formatting gas value:', e);
      return '0';
    }
  };

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-header">
        <h1><Trophy size={24} /> ZER0 Interaction Leaderboard</h1>
        
        {lastUpdate && (
          <div className="last-update">
            <Clock size={16} /> Last updated: {formatDate(lastUpdate.last_update_time)}
          </div>
        )}
      </div>
      
      {isLoading ? (
        <div className="loading">
          <span className="spinner"></span>
          <p>Loading leaderboard data...</p>
        </div>
      ) : error ? (
        <div className="error-message">
          <p>{error}</p>
        </div>
      ) : (
        <div className="leaderboard-table-container">
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Wallet</th>
                <th>Interactions</th>
                <th>Swaps</th>
                <th>Pool</th>
                <th>Approvals</th>
                <th>Gas Used</th>
                <th>First Interaction</th>
                <th>Last Interaction</th>
              </tr>
            </thead>
            <tbody>
              {leaderboardData.map((entry, index) => (
                <tr key={entry.address} className={index < 3 ? `top-${index+1}` : ''}>
                  <td className="rank">
                    {index + 1}
                    {index < 3 && <Trophy size={16} className={`trophy-${index+1}`} />}
                  </td>
                  <td className="address">
                    <a 
                      href={`https://chainscan-newton.0g.ai/address/${entry.address}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      {formatAddress(entry.address)}
                    </a>
                  </td>
                  <td className="total">{formatInteractions(entry.total_interactions)}</td>
                  <td>{formatInteractions(entry.swap_interactions)}</td>
                  <td>{formatInteractions(entry.pool_interactions)}</td>
                  <td>{formatInteractions(entry.approve_interactions)}</td>
                  <td className="gas">
                    <Droplets size={14} /> {formatGasValue(entry.total_gas_used)}
                  </td>
                  <td className="date">{formatDate(entry.first_interaction_date)}</td>
                  <td className="date">{formatDate(entry.last_interaction_date)}</td>
                </tr>
              ))}
              
              {leaderboardData.length === 0 && (
                <tr>
                  <td colSpan="9" className="no-data">No leaderboard data available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Leaderboard; 