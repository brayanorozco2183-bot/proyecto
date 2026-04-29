import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';

async function clearNicheMemory(niche: string) {
    const dbPath = path.join(process.cwd(), 'maestro.db');
    const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    const tables = ['editorial_memory', 'fingerprints', 'visual_memory', 'site_structure_memory', 'missions', 'city_data'];
    const nicheLower = niche.toLowerCase();

    for (const table of tables) {
        try {
            // Find columns for this table
            const columns = await db.all(`PRAGMA table_info(${table})`);
            const textColumns = columns.filter(c => c.type === 'TEXT').map(c => c.name);
            
            if (textColumns.length === 0) continue;

            const whereClause = textColumns.map(col => `${col} LIKE '%${nicheLower}%'`).join(' OR ');
            const deleteQuery = `DELETE FROM ${table} WHERE ${whereClause}`;
            
            const result = await db.run(deleteQuery);
            console.log(`[DB] Cleared ${result.changes} rows from ${table}`);
        } catch (e: any) {
            console.warn(`[DB] Error clearing ${table}: ${e.message}`);
        }
    }

    await db.close();
}

const niche = process.argv[2] || 'cerrajeros';
clearNicheMemory(niche).catch(console.error);
