# Zero Interaction Leaderboard

Aplikacja do śledzenia interakcji użytkowników z kontraktami Zero w sieci Newton.

## Funkcje

- Pobieranie danych transakcji z blockchainu Newton
- Analiza interakcji z kontraktami: swap, pool, approve
- Przechowywanie danych w bazie SQLite
- Frontend wyświetlający ranking portfeli według liczby interakcji
- API do pobierania danych leaderboardu

## Struktura projektu

- `src/` - Główny kod aplikacji
  - `services/` - Usługi do pobierania i przetwarzania danych
    - `BlockchainDataService.js` - Pobieranie danych z blockchainu
    - `DatabaseService.js` - Zarządzanie bazą danych SQLite
    - `UpdateLeaderboard.js` - Aktualizacja danych leaderboardu
    - `ApiServer.js` - Serwer API
  - `config.js` - Konfiguracja aplikacji
- `frontend/` - Aplikacja frontendowa
- `data/` - Katalog z bazą danych SQLite

## Uruchamianie

### Backend

```bash
# Instalacja zależności
npm install

# Uruchomienie serwera API
npm run start-api

# Aktualizacja danych leaderboardu
npm run update-leaderboard

# Tryb turbo pobierania danych
npm run fetch-all-data
```

### Frontend

```bash
# Przejście do katalogu frontendu
cd frontend

# Instalacja zależności
npm install

# Uruchomienie serwera deweloperskiego
npm start
```

Po uruchomieniu obu części, aplikacja będzie dostępna pod adresem http://localhost:3000, a API na http://localhost:3001.

## Turbo pobieranie danych

Funkcja turbo pobierania (`turboPobieranieAllData`) umożliwia szybkie pobieranie danych z blockchainu Newton:

- Równoległe pobieranie danych - do 10 zapytań jednocześnie
- Przetwarzanie w większych chunakch (100 000 offsetów)
- Kontrola obciążenia serwera
- Mechanizm checkpointów (przywracanie pobierania od ostatniego offsetu)

Parametry w pliku `fetch-all-data.js`:
- `START_OFFSET` - Początkowy offset (domyślnie 9999900)
- `BATCH_SIZE` - Rozmiar pojedynczej partii danych (domyślnie 500)
- `CONCURRENT_REQUESTS` - Liczba równoległych zapytań (domyślnie 10) 