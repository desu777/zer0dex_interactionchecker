# Instrukcja wdrożenia Zer0 Checker na serwer Ubuntu

Ten dokument zawiera szczegółowe instrukcje wdrożenia aplikacji Zer0 Checker (Interaction Checker + Leaderboard) na serwer Ubuntu pod domeną zer0checker.xyz.

## Spis treści
1. [Przygotowanie serwera](#przygotowanie-serwera)
2. [Konfiguracja domeny](#konfiguracja-domeny)
3. [Instalacja aplikacji](#instalacja-aplikacji)
4. [Konfiguracja baz danych](#konfiguracja-baz-danych)
5. [Konfiguracja połączenia między aplikacjami](#konfiguracja-połączenia-między-aplikacjami)
6. [Konfiguracja serwera Nginx](#konfiguracja-serwera-nginx)
7. [Zabezpieczenie HTTPS](#zabezpieczenie-https)
8. [Konfiguracja PM2](#konfiguracja-pm2)
9. [Konfiguracja zadań cron](#konfiguracja-zadań-cron)
10. [Zabezpieczenia](#zabezpieczenia)
11. [Monitorowanie i utrzymanie](#monitorowanie-i-utrzymanie)

## Przygotowanie serwera

Zaloguj się na serwer Ubuntu i wykonaj następujące kroki jako użytkownik z uprawnieniami sudo:

```bash
# Aktualizacja systemu
sudo apt update && sudo apt upgrade -y

# Instalacja niezbędnych pakietów
sudo apt install -y nginx nodejs npm sqlite3 certbot python3-certbot-nginx git fail2ban ufw

# Instalacja nvm (zarządzanie wersjami Node.js)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
source ~/.bashrc
nvm install 16  # Instalacja stabilnej wersji Node.js
nvm use 16

# Instalacja PM2 do zarządzania procesami
npm install -y pm2 -g
```

### Konfiguracja firewalla

```bash
# Konfiguracja firewalla
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## Konfiguracja domeny

1. Zakup domeny zer0checker.xyz u preferowanego rejestratora
2. Skonfiguruj rekordy DNS:
   - Rekord A: `zer0checker.xyz → [IP TWOJEGO SERWERA]`
   - Rekord CNAME: `www.zer0checker.xyz → zer0checker.xyz`

> **Ważne:** Przed przejściem do następnych kroków, upewnij się, że rekordy DNS zostały zaktualizowane. To może potrwać do 24 godzin.

## Instalacja aplikacji

```bash
# Tworzenie katalogu aplikacji
sudo mkdir -p /home/zer0_interact_checker
sudo chown -R $USER:$USER /home/zer0_interact_checker
cd /home/zer0_interact_checker

# Klonowanie repozytorium (załóżmy, że masz już skonfigurowany dostęp SSH do repozytorium)
git clone [URL_REPOZYTORIUM] .

# Instalacja zależności i budowanie aplikacji Interaction Checker
npm install
npm run build

# Instalacja zależności i budowanie aplikacji Leaderboard
cd leaderboard-app
npm install

# Budowanie frontendu Leaderboard
cd frontend
npm install
npm run build
cd ..
```

## Konfiguracja baz danych

```bash
# Tworzenie katalogu dla baz danych
sudo mkdir -p /home/zer0_interact_checker/database
sudo chown -R $USER:$USER /home/zer0_interact_checker/database

# Tworzenie katalogu dla logów
sudo mkdir -p /home/zer0_interact_checker/logs
sudo chown -R $USER:$USER /home/zer0_interact_checker/logs

# Inicjalizacja bazy danych (jeśli potrzebne)
cd /home/zer0_interact_checker/leaderboard-app
# Uruchom skrypt inicjalizujący bazę (jeśli taki istnieje)
# node init-db.js
```

## Konfiguracja połączenia między aplikacjami

W środowisku produkcyjnym obie aplikacje (Interaction Checker i Leaderboard) działają pod tą samą domeną, ale na różnych ścieżkach. Konieczne jest skonfigurowanie prawidłowych adresów API.

### 1. Konfiguracja adresu API w Interaction Checker

```bash
# Edytuj plik konfiguracyjny
cd /home/zer0_interact_checker/src/config
nano config.js
```

Zmień adres API Leaderboard:

```javascript
// Zmień
LEADERBOARD_API_URL: "http://localhost:3001"

// Na
LEADERBOARD_API_URL: "/leaderboard"
```

### 2. Konfiguracja przycisku Leaderboard w Interaction Checker

```bash
# Edytuj plik komponentu
cd /home/zer0_interact_checker/src/components
nano InteractionChecker.js
```

Zmień adres przycisku Leaderboard:

```javascript
// Znajdź przycisk Leaderboard i zmień jego adres
<a 
  href="/leaderboard" 
  target="_blank"
  rel="noopener noreferrer"
  style={{...styles.walletButton, textDecoration: 'none'}}
>
  <span>Leaderboard</span>
</a>
```

### 3. Konfiguracja przycisku Checker w Leaderboard

```bash
# Edytuj plik komponentu Leaderboard
cd /home/zer0_interact_checker/leaderboard-app/frontend/src/components
nano Leaderboard.js
```

Zmień adres przycisku Checker:

```javascript
// Znajdź przycisk Checker i zmień jego adres
<a 
  href="/" 
  target="_blank"
  rel="noopener noreferrer"
  style={{...}}
>
  <span>Checker</span>
</a>
```

### 4. Przebuduj aplikacje po zmianach

```bash
# Przebuduj Interaction Checker
cd /home/zer0_interact_checker
npm run build

# Przebuduj Leaderboard
cd /home/zer0_interact_checker/leaderboard-app/frontend
npm run build
```

### 5. Sprawdź połączenie między aplikacjami

Po wdrożeniu upewnij się, że:
- Przycisk "Leaderboard" w Interaction Checker przekierowuje do `/leaderboard`
- Przycisk "Checker" w Leaderboard przekierowuje do głównej strony `/`
- API Leaderboard jest dostępne pod `/leaderboard/api/`
- API Interaction Checker jest dostępne pod `/api/`

W środowisku produkcyjnym finalne adresy będą wyglądać następująco:
- Interaction Checker: `https://zer0checker.xyz/`
- Interaction Checker API: `https://zer0checker.xyz/api/`
- Leaderboard: `https://zer0checker.xyz/leaderboard/`
- Leaderboard API: `https://zer0checker.xyz/leaderboard/api/`

## Konfiguracja serwera Nginx

```bash
# Tworzenie konfiguracji Nginx
sudo nano /etc/nginx/sites-available/zer0checker.xyz
```

Wklej następującą konfigurację:

```nginx
server {
    listen 80;
    server_name zer0checker.xyz www.zer0checker.xyz;
    
    root /home/zer0_interact_checker/build;
    index index.html;
    
    # Statyczne pliki dla Interaction Checker
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API dla Interaction Checker
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Leaderboard aplikacja
    location /leaderboard/ {
        alias /home/zer0_interact_checker/leaderboard-app/frontend/build/;
        try_files $uri $uri/ /leaderboard/index.html;
    }
    
    # API Leaderboard
    location /leaderboard/api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Ograniczenia żądań API
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    location ~ ^/(api|leaderboard/api)/ {
        limit_req zone=api_limit burst=20 nodelay;
        # Pozostałe ustawienia proxy już zdefiniowane powyżej
    }
}
```

Aktywacja konfiguracji:

```bash
# Aktywacja konfiguracji Nginx
sudo ln -s /etc/nginx/sites-available/zer0checker.xyz /etc/nginx/sites-enabled/
sudo nginx -t  # Sprawdzenie poprawności konfiguracji
sudo systemctl restart nginx
```

## Zabezpieczenie HTTPS

```bash
# Uzyskanie certyfikatu SSL
sudo certbot --nginx -d zer0checker.xyz -d www.zer0checker.xyz

# Sprawdzenie odnowienia certyfikatu
sudo certbot renew --dry-run
```

## Konfiguracja PM2

```bash
# Utwórz plik ecosystem.config.js
cd /home/zer0_interact_checker
nano ecosystem.config.js
```

Wklej następującą konfigurację:

```javascript
module.exports = {
  apps: [
    {
      name: 'checker-frontend',
      script: 'npx',
      args: 'serve -s build -l 3000',
      cwd: '/home/zer0_interact_checker',
      env: {
        NODE_ENV: 'production',
      },
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      error_file: '/home/zer0_interact_checker/logs/checker_error.log',
      out_file: '/home/zer0_interact_checker/logs/checker_out.log',
    },
    {
      name: 'leaderboard-api',
      script: 'app.js',
      cwd: '/home/zer0_interact_checker/leaderboard-app',
      env: {
        NODE_ENV: 'production',
        PORT: '3001',
      },
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      error_file: '/home/zer0_interact_checker/logs/leaderboard_error.log',
      out_file: '/home/zer0_interact_checker/logs/leaderboard_out.log',
    },
  ],
};
```

Uruchomienie aplikacji z PM2:

```bash
# Uruchomienie aplikacji z PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Konfiguracja zadań cron

```bash
# Edycja crontab
crontab -e
```

Dodaj następujące linie:

```
# Aktualizacja bloków o 1:00 w nocy
0 1 * * * cd /home/zer0_interact_checker/leaderboard-app && /usr/bin/node update-blocks.js >> /home/zer0_interact_checker/logs/update-blocks.log 2>&1

# Aktualizacja statystyk o 4:00 w nocy
0 4 * * * cd /home/zer0_interact_checker/leaderboard-app && /usr/bin/node update-stats.js >> /home/zer0_interact_checker/logs/update-stats.log 2>&1

# Kopiowanie bazy i aktualizacja rankingów o 2:30 w nocy
30 2 * * * cd /home/zer0_interact_checker/leaderboard-app && /usr/bin/node copy-db-and-update-rankings.js >> /home/zer0_interact_checker/logs/rankings.log 2>&1

# Weryfikacja portfeli raz w tygodniu (w niedzielę o 3:00)
0 3 * * 0 cd /home/zer0_interact_checker/leaderboard-app && /usr/bin/node verify-wallets.js >> /home/zer0_interact_checker/logs/verify-wallets.log 2>&1

# Tworzenie kopii zapasowej bazy danych codziennie o 1:00 w nocy
0 1 * * * cp /home/zer0_interact_checker/leaderboard-app/leaderboard.sqlite /home/zer0_interact_checker/database/backups/leaderboard_$(date +\%Y\%m\%d).sqlite && find /home/zer0_interact_checker/database/backups -type f -name "leaderboard_*.sqlite" -mtime +14 -delete
```

Upewnij się, że katalog backupów istnieje:

```bash
mkdir -p /home/zer0_interact_checker/database/backups
```

## Zabezpieczenia

### Konfiguracja fail2ban

```bash
# Konfiguracja fail2ban do blokowania nieudanych prób logowania
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo nano /etc/fail2ban/jail.local
```

Znajdź sekcję `[sshd]` i upewnij się, że jest aktywna:

```
[sshd]
enabled = true
maxretry = 3
bantime = 86400  # 24 godziny
```

```bash
# Restart fail2ban
sudo systemctl restart fail2ban
```

### Automatyczne aktualizacje bezpieczeństwa

```bash
# Instalacja automatycznych aktualizacji
sudo apt install -y unattended-upgrades apt-listchanges
sudo dpkg-reconfigure -plow unattended-upgrades
```

### Zabezpieczenie dostępu do bazy danych

```bash
# Upewnij się, że pliki bazy danych mają odpowiednie uprawnienia
cd /home/zer0_interact_checker/leaderboard-app
chmod 640 *.sqlite
chmod 750 .
```

## Monitorowanie i utrzymanie

### Instalacja narzędzi monitorujących

```bash
# Instalacja logwatch do monitorowania logów
sudo apt install -y logwatch
sudo nano /etc/cron.daily/00logwatch
```

Wklej:

```bash
#!/bin/bash
/usr/sbin/logwatch --output mail --mailto twój-email@domena.com --detail high
```

```bash
# Nadanie uprawnień wykonywania
sudo chmod +x /etc/cron.daily/00logwatch
```

### Monitorowanie aplikacji

```bash
# Sprawdzenie statusu aplikacji
pm2 status
pm2 logs

# Restart aplikacji (w razie potrzeby)
pm2 restart all
```

### Ręczne uruchomienie skryptów

Jeśli potrzebujesz ręcznie uruchomić skrypty:

```bash
cd /home/zer0_interact_checker/leaderboard-app
node update-blocks.js
node update-stats.js
node copy-db-and-update-rankings.js
```

## Przydatne polecenia

Restartowanie usług:

```bash
# Restart Nginx
sudo systemctl restart nginx

# Restart PM2
pm2 restart all

# Sprawdzenie statusu usług
sudo systemctl status nginx
pm2 status
```

Sprawdzanie logów:

```bash
# Logi Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Logi aplikacji
tail -f /home/zer0_interact_checker/logs/checker_out.log
tail -f /home/zer0_interact_checker/logs/leaderboard_out.log
tail -f /home/zer0_interact_checker/logs/update-blocks.log
```

## Aktualizacja aplikacji

Aby zaktualizować aplikację:

```bash
cd /home/zer0_interact_checker
git pull

# Aktualizacja i rebuild Interaction Checker
npm install
npm run build

# Aktualizacja i rebuild Leaderboard
cd leaderboard-app
npm install
cd frontend
npm install
npm run build

# Restart aplikacji
cd /home/zer0_interact_checker
pm2 restart all
```

## Rozwiązywanie problemów

### Problem z połączeniem do API

Sprawdź logi:

```bash
tail -f /home/zer0_interact_checker/logs/leaderboard_error.log
```

Sprawdź, czy usługi działają:

```bash
pm2 status
```

Sprawdź konfigurację Nginx:

```bash
sudo nginx -t
```

### Problem z aktualizacją danych

Sprawdź logi skryptów aktualizacji:

```bash
tail -f /home/zer0_interact_checker/logs/update-blocks.log
tail -f /home/zer0_interact_checker/logs/update-stats.log
tail -f /home/zer0_interact_checker/logs/rankings.log
```

---

W razie problemów lub pytań dotyczących wdrożenia, skontaktuj się z zespołem deweloperskim. 