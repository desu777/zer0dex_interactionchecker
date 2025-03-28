/**
 * Funkcja pomocnicza do opóźniania wykonania kodu
 * @param {number} ms - Czas opóźnienia w milisekundach
 * @returns {Promise<void>}
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

module.exports = {
    sleep
}; 