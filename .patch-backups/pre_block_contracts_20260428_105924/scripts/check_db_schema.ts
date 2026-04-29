import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';

async function checkSchema() {
    const dbPath = path.join(process.cwd(), 'maestro.db');
    const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    const tables = ['editorial_memory', 'fingerprints', 'visual_memory', 'site_structure_memory'];
    
    for (const table of tables) {
        try {
            const rows = await db.all(`PRAGMA table_info(${table})`);
            console.log(`Table: ${table}`);
            console.log(JSON.stringify(rows, null, 2));
        } catch (e: any) {
            console.error(`Error checking ${table}: ${e.message}`);
        }
    }

    await db.close();
}

checkSchema().catch(console.error);
