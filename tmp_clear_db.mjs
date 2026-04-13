import sqlite3 from 'sqlite3';
import { promisify } from 'util';

const db = new sqlite3.Database('C:\\Users\\Bryan\\Desktop\\pruebaGravity\\maestro.db');
const run = promisify(db.run.bind(db));

async function clear() {
  try {
    const tables = [
      'missions',
      'city_data',
      'editorial_memory',
      'visual_memory',
      'site_structure_memory'
    ];
    for (const table of tables) {
      await run(`DELETE FROM ${table}`);
      console.log(`Table ${table} cleared.`);
    }
    console.log('All relevant tables cleared.');
  } catch (err) {
    console.error('Error clearing database:', err);
  } finally {
    db.close();
  }
}

clear();
