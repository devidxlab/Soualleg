const sqlite = require('better-sqlite3');

try {
  const db = new sqlite('events.db');
  
  console.log('Todas as não conformidades:');
  const nonconformities = db.prepare('SELECT * FROM nonconformities').all();
  console.log(nonconformities);
  
  console.log('\nEventos de não conformidades:');
  const events = db.prepare("SELECT * FROM events WHERE category = 'Não conformidades'").all();
  console.log(events);
  
  console.log('\nQuantidade de eventos de não conformidades:');
  const count = db.prepare("SELECT COUNT(*) as count FROM events WHERE category = 'Não conformidades'").get();
  console.log(count);
  
  db.close();
} catch (error) {
  console.error('Erro ao consultar o banco de dados:', error);
} 