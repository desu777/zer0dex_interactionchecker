import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LeaderboardApp from './components/LeaderboardApp';
import './styles/App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LeaderboardApp />} />
      </Routes>
    </Router>
  );
}

export default App;