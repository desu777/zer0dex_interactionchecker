# Zero Interaction Checker
![image](https://github.com/user-attachments/assets/ab8ec4c2-2cd9-4d38-be91-dc348283e84b)
https://zer0checker.xyz/
Application for tracking user interactions with Zero contracts on the Newton network. Includes both a wallet interaction analysis tool and a leaderboard displaying rankings of the most active wallets.
Project Structure
The project consists of two main parts:
1. Zero Interaction Checker
Basic application checking wallet interactions with Zero contracts:

Wallet verification: Checks the number and types of interactions for given addresses
Statistics: Displays the time of first and last interaction and gas used
User Interface: Simple web interface for checking addresses

2. Zero Interaction Leaderboard
Application collecting and displaying rankings of wallets with the highest number of interactions:

Data collection: Automatic retrieval of transaction history from the Newton blockchain
Interaction analysis: Identification and counting of interactions with contracts (swap, pool, approve)
Database: Storage of wallet statistics in SQLite database
API: Endpoints for retrieving leaderboard data
Frontend: Responsive interface for displaying rankings

Features

Turbo data retrieval with parallel queries
Checkpoint mechanism for resuming after interruption
Tracking statistics for each type of interaction (swap, pool, approve)
Storing data on first and last interaction
Counting total gas used

Tracked Contracts

SWAP: 0xe.........790bef3b
POOL: 0x6.........D19D69A
APPROVE: 0x1........8CBEfc

Running the Application
Zero Interaction Checker
Basic application in the main directory:
bashCopy# Install dependencies
npm install
# Run development server
npm start
Zero Interaction Leaderboard
Leaderboard application in the /leaderboard-app directory:
bashCopy# Navigate to leaderboard directory
cd leaderboard-app
# Install dependencies (backend and frontend)
npm run install-all
# Run production application (build frontend + run API)
npm start
# Run in development mode (backend + frontend with hot-reload)
npm run dev
# Turbo data retrieval
npm run fetch-all-data
Helper Scripts
For Windows systems, .bat scripts are available:

start-app.bat - runs the production application
dev-mode.bat - runs the application in development mode

License
This project is licensed under the MIT License.
