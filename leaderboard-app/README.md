# Zer0 Interaction Leaderboard

Aplikacja służąca do śledzenia interakcji portfeli z kontraktami zer0_dex oraz prezentacji danych w formie interaktywnej tabeli rankingowej.

## Architektura systemu

System składa się z następujących głównych komponentów:

1. **Baza danych SQLite** - przechowuje dane transakcji i statystyki portfeli
2. **Skrypty synchronizacji** - pobierają dane z blockchainu i aktualizują bazę danych
3. **System rankingowy** - oblicza pozycje portfeli na podstawie liczby interakcji
4. **API Backend** - udostępnia dane dla frontendu i zewnętrznych systemów
5. **Aplikacja React** - interfejs użytkownika prezentujący dane

### Struktura katalogów

```
leaderboard-app/
├── frontend/               # Aplikacja frontendowa React
│   ├── build/              # Zbudowana aplikacja (produkcja)
│   ├── public/             # Statyczne pliki (HTML, obrazy)
│   └── src/                # Kod źródłowy React
│       ├── components/     # Komponenty React
│       └── ...
├── src/                    # Backend serwera
│   ├── config/             # Pliki konfiguracyjne
│   ├── routes/             # Endpointy API
│   └── services/           # Usługi (DB, ranking)
├── app.js                  # Główny plik serwera Express
├── leaderboard.sqlite      # Główna baza danych
├── ranking-leaderboard.sqlite # Kopia bazy dla systemu rankingowego
├── update-blocks.js        # Skrypt do aktualizacji danych z blockchainu
├── update-stats.js         # Skrypt do aktualizacji statystyk
├── copy-db-and-update-rankings.js # Skrypt kopiujący bazę i aktualizujący ranking
└── schedule-ranking-updates.js # Skrypt do cyklicznych aktualizacji rankingu
```

## Przepływ danych

1. **Synchronizacja blockchain → baza danych**
   - Skrypt `update-blocks.js` pobiera dane transakcji z blockchainu
   - Dane są przetwarzane i zapisywane w głównej bazie danych `leaderboard.sqlite`
   - Skrypt `update-stats.js` agreguje dane i aktualizuje tabele statystyk

2. **Obliczanie rankingów**
   - Skrypt `copy-db-and-update-rankings.js` tworzy kopię bazy danych
   - System rankingowy przetwarza dane z kopii, aby nie zakłócać synchronizacji
   - Tworzona jest posortowana tabela rankingowa dla szybkiego dostępu do danych
   - Pozycje rankingowe są obliczane i przechowywane w pamięci podręcznej

3. **Dostarczanie danych**
   - API udostępnia endpointy do pobierania leaderboard i danych rankingowych
   - Dane są serwowane do frontendu i zewnętrznych aplikacji (np. InteractionChecker)

4. **Wizualizacja**
   - Frontend React prezentuje dane w formie tabeli leaderboard
   - InteractionChecker wyświetla informacje o pozycji portfela w rankingu

## Komponenty systemu

### 1. Baza danych

Główna baza danych SQLite zawiera następujące tabele:

- `wallet_stats` - Przechowuje statystyki portfeli (interakcje, daty, itp.)
- `stats_summary` - Globalne statystyki całego systemu
- `last_checked_block` - Informacja o ostatnim przetworzonym bloku
- `update_info` - Metadane dotyczące procesu aktualizacji

Kopia bazy dla rankingu zawiera dodatkowo:

- `sorted_wallet_rankings` - Posortowana tabela rankingowa z prekalkulowanymi pozycjami

### 2. System synchronizacji

- `update-blocks.js` - Pobiera i przetwarza dane bloków z blockchainu
- `add-block.js` - Dodaje pojedynczy blok do bazy danych
- `verify-wallets.js` - Weryfikuje dane portfeli
- `update-stats.js` - Aktualizuje zagregowane statystyki
- `set-last-block.js` - Ustawia numer ostatniego sprawdzonego bloku

Skrypty działają niezależnie od systemu rankingowego, aby zapewnić ciągłość aktualizacji danych.

### 3. System rankingowy

- `RankingService.js` - Usługa obliczająca rankingi portfeli
- `copy-db-and-update-rankings.js` - Tworzy kopię bazy danych i aktualizuje rankingi
- `schedule-ranking-updates.js` - Planuje cykliczne aktualizje rankingów

#### Mechanizm zoptymalizowanego rankingu

System rankingowy działa w następujący sposób:

1. **Tworzenie/Synchronizacja kopii bazy danych**
   - Skrypt `copy-db-and-update-rankings.js` sprawdza czy kopia bazy rankingowej istnieje
   - Jeśli nie istnieje, tworzy pełną kopię głównej bazy
   - Jeśli istnieje, synchronizuje dane portfeli między bazami

2. **Tworzenie posortowanej tabeli rankingowej**
   - Tworzona jest specjalna tabela `sorted_wallet_rankings` zawierająca:
     - `ranking_position` - Pozycja w rankingu (ROW_NUMBER)
     - `address` - Adres portfela
     - `total_interactions` - Liczba interakcji
     - `swap_interactions` - Liczba swapów
     - `pool_interactions` - Liczba operacji pool
     - `approve_interactions` - Liczba zatwierdzeń
     - `total_wallets` - Całkowita liczba portfeli w systemie
   - Tabela jest posortowana malejąco według `total_interactions`
   - Tworzony jest indeks na kolumnie `address` dla szybkiego wyszukiwania

3. **Pobieranie danych rankingowych**
   - `RankingService` automatycznie wykrywa czy tabela `sorted_wallet_rankings` istnieje
   - Jeśli tabela istnieje, pobiera dane bezpośrednio z niej (O(1) - stały czas dostępu)
   - Jeśli tabela nie istnieje, używa alternatywnego mechanizmu zapytań (O(n) - liniowy czas)

Ten mechanizm zapewnia:
- Bardzo szybki dostęp do danych rankingowych (jedno zapytanie SQL)
- Minimalne obciążenie bazy danych przy wielu zapytaniach o rankingi
- Dokładnie takie same pozycje dla wszystkich zapytań
- Łatwość obliczania statystyk (percentyle, pozycje, itp.)

### 4. API Backend

API Express udostępnia następujące endpointy:

- `GET /api/leaderboard` - Pobiera listę top portfeli
- `GET /api/wallet-ranking/:address` - Pobiera ranking określonego portfela
- `POST /api/update-ranking` - Ręcznie uruchamia aktualizację rankingów

### 5. Frontend

Aplikacja React zawiera:

- `Leaderboard.js` - Główny komponent wyświetlający tabelę rankingową
- Komponenty statystyk, filtrowania i nawigacji
- Integrację z API do pobierania danych

## Uruchomienie systemu

### Wymagania

- Node.js 14+
- NPM 6+

### Instalacja

```bash
# Instalacja zależności backendu
npm install

# Instalacja zależności frontendu
cd frontend
npm install
npm run build
cd ..
```

### Uruchomienie

1. **Start serwera API**:
```bash
node app.js
```

2. **Uruchomienie synchronizacji z blockchainem**:
```bash
node update-blocks.js
```

3. **Uruchomienie systemu rankingowego**:
```bash
node copy-db-and-update-rankings.js  # Jednorazowa aktualizacja
# LUB
node schedule-ranking-updates.js     # Cykliczna aktualizacja
```

## Integracja z InteractionChecker

Komponent InteractionChecker integruje się z systemem rankingowym poprzez:

1. API endpoint `/api/wallet-ranking/:address` - pobiera dane rankingowe dla określonego portfela
2. Wyświetlanie informacji o pozycji portfela w rankingu (TOP X%, pozycja, itp.)

Komunikacja między systemami odbywa się przez REST API, co zapewnia luźne powiązanie i łatwą rozszerzalność.

## Szczegóły implementacji rankingu w InteractionChecker

InteractionChecker korzysta z danych rankingowych w następujący sposób:

1. Po podaniu adresu portfela, aplikacja sprawdza jego interakcje
2. Równolegle wykonywane jest zapytanie do API o ranking portfela
3. Po otrzymaniu danych, komponent wyświetla kartę rankingową zawierającą:
   - TOP X% (percentyl portfela)
   - Pozycję w rankingu (#X)
   - Informację, że portfel jest lepszy niż X spośród Y innych portfeli
4. Karta rankingowa jest wyświetlana tylko dla portfeli, które mają interakcje

## Cykliczne zadania i automatyzacja

Dla zapewnienia aktualności danych zaleca się skonfigurowanie następujących zadań cron:

1. **Aktualizacja danych z blockchainu** (co 5-15 minut):
```
*/10 * * * * cd /ścieżka/do/leaderboard-app && node update-blocks.js >> logs/update-blocks.log 2>&1
```

2. **Aktualizacja statystyk** (co godzinę):
```
0 * * * * cd /ścieżka/do/leaderboard-app && node update-stats.js >> logs/update-stats.log 2>&1
```

3. **Aktualizacja rankingów** (co godzinę):
```
10 * * * * cd /ścieżka/do/leaderboard-app && node copy-db-and-update-rankings.js >> logs/rankings.log 2>&1
```

Alternatywnie można użyć skryptu `schedule-ranking-updates.js` jako procesu działającego w tle.

## Konfiguracja

Konfiguracja systemu znajduje się w plikach:

- `src/config/config.js` - Główne ustawienia systemu
- `frontend/src/config.js` - Konfiguracja frontendu

## Zmienne środowiskowe

- `PORT` - Port, na którym działa serwer (domyślnie 3001)
- `ADMIN_KEY` - Klucz do zabezpieczonych endpointów API
- `RANKING_UPDATE_INTERVAL` - Interwał aktualizacji rankingów w ms (domyślnie 1h)

## Uwagi eksploatacyjne

- System może wymagać znaczących zasobów przy dużej liczbie portfeli i transakcji
- W przypadku dużych baz danych proces kopiowania może zajmować więcej czasu
- Zaleca się monitorowanie zużycia zasobów i dostosowanie interwałów aktualizacji
- Warto regularnie tworzyć kopie zapasowe bazy danych
- W przypadku błędów sprawdź logi w katalogu `logs/`

## Przepływ danych w całym systemie

```
[BLOCKCHAIN] ---> update-blocks.js ---> [GŁÓWNA BAZA] ---> update-stats.js
                                            |
                                            v
            copy-db-and-update-rankings.js ---> [KOPIA BAZY]
                                                    |
                                                    v
                  [TABELA SORTED_WALLET_RANKINGS] <--- createSortedRankingTable()
                                                    |
                                                    v
                                               RankingService
                                                    |
                        +-------------------------+--------------------------+
                        |                                                    |
                        v                                                    v
            [API Leaderboard] ---> [Frontend Leaderboard]    [API Wallet Ranking] ---> [InteractionChecker]
```

W tym przepływie:
1. Dane z blockchainu są pobierane i aktualizowane w głównej bazie
2. Skrypt `copy-db-and-update-rankings.js` tworzy kopię bazy i posortowaną tabelę rankingową
3. Usługa rankingowa udostępnia dane zarówno dla Leaderboard jak i InteractionChecker
4. Główna baza nie jest blokowana na czas obliczeń rankingowych, co pozwala na ciągłą synchronizację z blockchainem 