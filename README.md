# Zero Interaction Checker

Aplikacja do śledzenia interakcji użytkowników z kontraktami Zero w sieci Newton. Zawiera zarówno narzędzie do analizy interakcji portfeli, jak i tabelę liderów (leaderboard) wyświetlającą rankingi najaktywniejszych portfeli.

## Struktura projektu

Projekt składa się z dwóch głównych części:

### 1. Zero Interaction Checker

Podstawowa aplikacja sprawdzająca interakcje portfeli z kontraktami Zero:

- **Sprawdzanie portfeli**: Weryfikacja liczby i typów interakcji dla podanych adresów
- **Statystyki**: Wyświetlanie czasu pierwszej i ostatniej interakcji oraz zużytego gazu
- **Interface użytkownika**: Prosty interface webowy do sprawdzania adresów

### 2. Zero Interaction Leaderboard

Aplikacja zbierająca i wyświetlająca ranking portfeli z największą liczbą interakcji:

- **Pobieranie danych**: Automatyczne pobieranie historii transakcji z blockchainu Newton
- **Analiza interakcji**: Identyfikacja i zliczanie interakcji z kontraktami (swap, pool, approve)
- **Baza danych**: Przechowywanie statystyk portfeli w bazie SQLite
- **API**: Endpointy do pobierania danych leaderboardu
- **Frontend**: Responsywny interface do wyświetlania rankingu

## Funkcje

- Turbo pobieranie danych z równoległymi zapytaniami
- Mechanizm checkpointów do wznawiania po przerwaniu
- Śledzenie statystyk dla każdego typu interakcji (swap, pool, approve)
- Zapisywanie danych o pierwszej i ostatniej interakcji
- Liczenie całkowitego zużytego gazu

## Śledzone kontrakty

- **SWAP**: `0xe233d75ce6f04c04610947188dec7c55790bef3b`
- **POOL**: `0x62DF0E43e599a279015fFCFf70c2cF82bD19D69A`
- **APPROVE**: `0x1E0D871472973c562650E991ED8006549F8CBEfc`

## Uruchamianie

### Zero Interaction Checker

Podstawowa aplikacja w głównym katalogu:

```bash
# Instalacja zależności
npm install

# Uruchomienie serwera deweloperskiego
npm start
```

### Zero Interaction Leaderboard

Aplikacja leaderboardu w katalogu `/leaderboard-app`:

```bash
# Przejście do katalogu leaderboardu
cd leaderboard-app

# Instalacja zależności (backend i frontend)
npm run install-all

# Uruchomienie aplikacji produkcyjnej (budowanie frontendu + uruchomienie API)
npm start

# Uruchomienie w trybie deweloperskim (backend + frontend z hot-reload)
npm run dev

# Turbo pobieranie danych
npm run fetch-all-data
```

### Skrypty pomocnicze

Dla systemów Windows dostępne są skrypty `.bat`:
- `start-app.bat` - uruchamia aplikację produkcyjną
- `dev-mode.bat` - uruchamia aplikację w trybie deweloperskim

## Licencja

Ten projekt jest udostępniany na licencji MIT. 