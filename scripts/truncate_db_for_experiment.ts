import { dbManager } from '../src/db/index.js';

async function main() {
    try {
        const db = await dbManager.getDB();
        console.log('--- Database Purity Pass Starting ---');
        
        // Disable FK checks to allow truncation
        await db.run('PRAGMA foreign_keys = OFF');
        
        await db.run('DELETE FROM missions');
        console.log('✔ Missions truncated');
        
        await db.run('DELETE FROM agent_logs');
        console.log('✔ Agent logs truncated');
        
        await db.run('DELETE FROM learning_output_reviews');
        console.log('✔ learning_output_reviews truncated');

        await db.run('DELETE FROM learning_exemplars');
        console.log('✔ learning_exemplars truncated');

        await db.run('PRAGMA foreign_keys = ON');
        
        console.log('--- Database Purity Pass Complete ---');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error during truncation:', err);
        process.exit(1);
    }
}

main();
