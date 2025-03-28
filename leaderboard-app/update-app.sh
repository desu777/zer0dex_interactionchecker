#!/bin/bash

# Skrypt do aktualizacji aplikacji leaderboard

# Zatrzymaj w przypadku błędu
set -e

echo "Aktualizacja Zero Interaction Leaderboard..."

# Aktualizacja kodu z repozytorium git
if [ -d ".git" ]; then
  echo "Pobieranie najnowszych zmian z repozytorium..."
  git pull
fi

# Instalacja zależności
echo "Instalacja zależności backendu..."
npm install

echo "Instalacja zależności frontendu..."
cd frontend && npm install && cd ..

# Budowanie frontendu
echo "Budowanie aplikacji frontendu..."
cd frontend && npm run build && cd ..

# Restart serwera (przykład, dostosuj do swojego środowiska)
echo "Restart serwera..."
if command -v pm2 &> /dev/null; then
  # Jeśli używasz PM2
  pm2 restart leaderboard-api
else
  echo "Możesz teraz uruchomić aplikację za pomocą: npm start"
fi

echo "Aktualizacja zakończona pomyślnie!" 