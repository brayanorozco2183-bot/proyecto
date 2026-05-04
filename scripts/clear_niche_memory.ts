import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';

async function clearNicheMemory(niche: string) {
    const dbPath = path.join(process.cwd(), 'maestro.db');
    const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    console.log(`[DB] Connected to ${dbPath}`);

    const nicheLower = niche.toLowerCase();

    const tables = ['editorial_memory', 'fingerprints', 'visual_memory', 'site_structure_memory'];
    
    for (const table of tables) {
        try {
            // We search for the niche name in common JSON columns or identifiers
            let query = '';
            if (table === 'editorial_memory' || table === 'visual_memory') {
                query = `DELETE FROM ${table} WHERE scopes_json LIKE '%${nicheLower}%'`;
            } else if (table === 'fingerprints') {
                query = `DELETE FROM fingerprints WHERE family LIKE '%${nicheLower}%'`;
            } else if (table === 'site_structure_memory') {
                 query = `DELETE FROM site_structure_memory WHERE scopes_json LIKE '%${nicheLower}%'`;
            }

            if (query) {
                const result = await db.run(query);
                console.log(`[DB] Cleared ${result.changes} rows from ${table}`);
            }
        } catch (e: any) {
            console.warn(`[DB] Error clearing ${table}: ${e.message}`);
        }
    }

    await db.close();
}

const niche = process.argv[2] || 'cerrajeros';
clearNicheMemory(niche).catch(console.error);
