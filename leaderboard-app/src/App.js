import React from 'react';
import Leaderboard from './components/Leaderboard';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>ZER0 Interactions Leaderboard</h1>
      </header>

      <main>
        <Leaderboard />
      </main>

      <footer>
        <p>ZER0 Interactions Leaderboard &copy; 2025</p>
      </footer>
    </div>
  );
}

export default App; 