const DatabaseService = require('./src/services/DatabaseService');

(async () => {
  console.log('Czyszczę tabelę update_info...');
  
  const dbService = new DatabaseService();
  
  try {
    await dbService.initialize();
    
    // Usuń tabelę update_info
    await dbService.db.run('DROP TABLE IF EXISTS update_info');
    
    console.log('Tabela update_info została usunięta');
    
    // Utwórz nową tabelę update_info
    await dbService.db.run(`
      CREATE TABLE IF NOT EXISTS update_info (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE,
        value TEXT,
        update_time DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('Tabela update_info została utworzona na nowo');
    
    // Zapisz ostatni blok
    await dbService.db.run(
      `INSERT INTO update_info (key, value, update_time) VALUES ('last_checked_block', ?, datetime('now'))`,
      ["3789358"]
    );
    
    console.log('Zapisano blok 3789358');
    
    // Sprawdź czy zapisało się poprawnie
    const result = await dbService.db.get(`SELECT value FROM update_info WHERE key = 'last_checked_block'`);
    console.log('Wynik zapytania:', result);
    
    await dbService.close();
    process.exit(0);
  } catch (error) {
    console.error('Wystąpił błąd:', error);
    try {
      await dbService.close();
    } catch (e) {
      console.error('Błąd podczas zamykania połączenia:', e);
    }
    process.exit(1);
  }
})(); 