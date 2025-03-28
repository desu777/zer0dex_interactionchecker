@echo off
echo Uruchamianie Zero Interaction Leaderboard...

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

:: Budowanie frontendu
echo Budowanie aplikacji frontendu...
cd frontend
call npm run build
cd ..

:: Uruchomienie aplikacji
echo Uruchamianie serwera API...
call npm run start-api

echo Aplikacja uruchomiona! Otwórz http://localhost:3001 w przeglądarce 