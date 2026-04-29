
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('maestro.db');

const niche = 'cerrajeros';
const city = 'Getafe';

const lessons = [
  {
    agent_name: 'ContentWriterAgent',
    issue_code: 'FAQ_SCHEMA_CONTENT_MISMATCH',
    lesson_text: 'Las preguntas y respuestas del bloque FAQ en el HTML deben coincidir letra por letra con las del JSON-LD FAQPage. No incluyas FAQs en el esquema que no estén presentes en el cuerpo visible de la página. NUNCA incluyas elementos de navegación como "Menú" en el esquema de FAQ.',
    weight: 2.0,
    active: 1,
    niche,
    city
  },
  {
    agent_name: 'ContentWriterAgent',
    issue_code: 'TRUST_BAND_EMPTY',
    lesson_text: 'La sección de confianza (Trust Band) es CRÍTICA. Debe contener contenido útil. MENCIONA EXPLÍCITAMENTE: "Más de 15 años de experiencia real en Getafe", "Garantía por escrito de 2 años en todas nuestras aperturas" y "Técnicos certificados con carnet profesional".',
    weight: 2.0,
    active: 1,
    niche,
    city
  },
  {
    agent_name: 'Architect',
    issue_code: 'GEO_RELEVANCE_LOW',
    lesson_text: 'Al planificar la página para Getafe, DEBES incluir menciones a: El Bercial, Getafe Norte, Juan de la Cierva y Sector III. No uses nombres genéricos de barrios.',
    weight: 1.5,
    active: 1,
    niche,
    city
  }
];

console.log('--- Gravity Curated Learning Injection (sqlite3) ---');

db.serialize(() => {
  const stmt = db.prepare(`
    INSERT INTO learning_curated_lessons (
      agent_name, niche, city, issue_code, lesson_text, weight, active
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const lesson of lessons) {
    stmt.run(
      lesson.agent_name,
      lesson.niche,
      lesson.city,
      lesson.issue_code,
      lesson.lesson_text,
      lesson.weight,
      lesson.active
    );
    console.log(`[+] Injected curated lesson: "${lesson.issue_code}" for ${lesson.agent_name}`);
  }

  stmt.finalize();
});

db.close((err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('[SUCCESS] Curated lessons injected.');
});
