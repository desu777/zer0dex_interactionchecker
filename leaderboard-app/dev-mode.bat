@echo off
echo Uruchamianie Zero Interaction Leaderboard w trybie deweloperskim...

:: Sprawdzanie, czy concurrently jest zainstalowane
call npm list -g concurrently >nul 2>&1
if %errorlevel% neq 0 (
  echo Instalacja concurrently...
  call npm install -g concurrently
)

:: Instalacja zależności, jeśli to konieczne
if not exist "node_modules" (
  echo Instalacja zależności backendu...
  call npm install
)

if not exist "frontend\node_modules" (
  echo Instalacja zależności frontendu...
  cd frontend
  call npm install
  cd ..
)

:: Uruchomienie aplikacji w trybie deweloperskim
echo Uruchamianie aplikacji w trybie deweloperskim...
call npm run dev

echo Aplikacja zatrzymana. 