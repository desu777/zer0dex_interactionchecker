/**
 * Main application file for the leaderboard app
 */
const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./src/routes/api');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the frontend/build directory in production
app.use(express.static(path.join(__dirname, 'frontend/build')));

// API routes
app.use('/api', apiRoutes);

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/build', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Serwer leaderboard uruchomiony na porcie: ${PORT}`);
  console.log(`API dostępne pod adresem: http://localhost:${PORT}/api`);
  console.log(`Aplikacja frontendowa dostępna pod adresem: http://localhost:${PORT}`);
}); 