const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./maestro.db');
db.serialize(() => {
    db.get('SELECT COUNT(*) as count FROM learning_exemplars', (err, row) => {
        if (err) {
            console.error('Error in learning_exemplars:', err.message);
        } else {
            console.log('Exemplars count:', row.count);
        }
    });
    db.get('SELECT COUNT(*) as count FROM learning_curated_lessons', (err, row) => {
        if (err) {
            console.error('Error in learning_curated_lessons:', err.message);
        } else {
            console.log('Lessons count:', row.count);
        }
    });
});
db.close();
