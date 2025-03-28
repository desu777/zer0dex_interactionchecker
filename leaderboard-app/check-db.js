const DatabaseService = require('./src/services/DatabaseService');

(async () => {
  console.log('Sprawdzam zawartość tabeli last_checked_block...');
  
  const dbService = new DatabaseService();
  
  try {
    await dbService.initialize();
    
    // Sprawdź zawartość tabeli
    const rows = await dbService.allQuery('SELECT * FROM last_checked_block');
    
    if (rows && rows.length > 0) {
      console.log('Znaleziono rekordy:');
      rows.forEach(row => {
        console.log(`Blok: ${row.block_number}, Czas: ${row.check_time}`);
      });
    } else {
      console.log('Tabela jest pusta!');
    }
    
    // Sprawdź wartość zwracaną przez metodę
    const lastBlock = await dbService.getLastCheckedBlock();
    console.log(`Wartość zwracana przez getLastCheckedBlock(): ${lastBlock}`);
    
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