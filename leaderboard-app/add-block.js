const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const config = require('./src/config/config');

const BLOCK_NUMBER = 3789358;

// Ścieżka do bazy danych
const dbPath = config.DATABASE.file;

console.log(`Dodaję blok ${BLOCK_NUMBER} do bazy ${dbPath}...`);

// Otwórz połączenie z bazą
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Błąd podczas otwierania bazy:', err);
    process.exit(1);
  }
  
  console.log('Połączono z bazą.');
  
  // Utwórz tabelę jeśli nie istnieje
  db.run(`CREATE TABLE IF NOT EXISTS last_checked_block (
    block_number INTEGER NOT NULL,
    check_time DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('Błąd przy tworzeniu tabeli:', err);
      db.close();
      process.exit(1);
    }
    
    console.log('Tabela utworzona/sprawdzona.');
    
    // Usuń istniejące rekordy
    db.run('DELETE FROM last_checked_block', (err) => {
      if (err) {
        console.error('Błąd przy usuwaniu rekordów:', err);
        db.close();
        process.exit(1);
      }
      
      console.log('Usunięto istniejące rekordy.');
      
      // Dodaj nowy rekord
      db.run('INSERT INTO last_checked_block (block_number, check_time) VALUES (?, datetime("now"))',
        [BLOCK_NUMBER],
        function(err) {
          if (err) {
            console.error('Błąd przy dodawaniu rekordu:', err);
            db.close();
            process.exit(1);
          }
          
          console.log(`Dodano rekord, lastID: ${this.lastID}`);
          
          // Sprawdź czy rekord istnieje
          db.all('SELECT * FROM last_checked_block', (err, rows) => {
            if (err) {
              console.error('Błąd przy sprawdzaniu rekordów:', err);
              db.close();
              process.exit(1);
            }
            
            console.log('Zawartość tabeli:');
            console.log(rows);
            
            // Zamknij połączenie
            db.close((err) => {
              if (err) {
                console.error('Błąd przy zamykaniu połączenia:', err);
                process.exit(1);
              }
              
              console.log('Połączenie zamknięte.');
              process.exit(0);
            });
          });
        }
      );
    });
  });
}); 