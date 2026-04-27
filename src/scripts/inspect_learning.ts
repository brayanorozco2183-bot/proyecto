import { dbManager } from '../db/index.js';

async function main() {
  const db = await dbManager.getDB();
  const [reviews, lessons, exemplars, reservations] = await Promise.all([
    db.all('SELECT id, agent_name, niche, city, score, status, created_at FROM learning_output_reviews ORDER BY created_at DESC LIMIT 20'),
    db.all('SELECT id, agent_name, issue_code, lesson_text, weight, created_at FROM learning_curated_lessons ORDER BY created_at DESC LIMIT 20'),
    db.all('SELECT id, agent_name, polarity, title, score, created_at FROM learning_exemplars ORDER BY created_at DESC LIMIT 20'),
    db.all('SELECT id, reservation_key, niche, city, status, created_at FROM originality_reservations ORDER BY created_at DESC LIMIT 20')
  ]);

  console.log('\n=== REVIEWS ===');
  console.table(reviews);
  console.log('\n=== LESSONS ===');
  console.table(lessons);
  console.log('\n=== EXEMPLARS ===');
  console.table(exemplars);
  console.log('\n=== RESERVATIONS ===');
  console.table(reservations);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
