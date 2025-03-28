const DatabaseService = require('./src/services/DatabaseService');

// Numer bloku do zapisania
const LAST_BLOCK = 3789358;

(async () => {
  console.log(`Zapisuję ${LAST_BLOCK} jako ostatni sprawdzony blok...`);
  
  const dbService = new DatabaseService();
  
  try {
    await dbService.initialize();
    
    // Zapisz ostatni sprawdzony blok
    await dbService.saveLastCheckedBlock(LAST_BLOCK);
    
    console.log('Zapisano pomyślnie!');
    
    // Sprawdź, czy blok został poprawnie zapisany
    const savedBlock = await dbService.getLastCheckedBlock();
    console.log(`Pobrany ostatni blok: ${savedBlock}`);
    
    // Dodatkowa weryfikacja bezpośrednio z tabeli
    const result = await dbService.getQuery('SELECT * FROM last_checked_block');
    console.log('Zawartość tabeli last_checked_block:', result);
    
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