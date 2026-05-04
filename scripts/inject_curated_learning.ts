
import { dbManager } from '../src/db/index.js';
import { upsertCuratedLesson } from '../src/learning/lessonRepository.js';
import { installLearningSchema } from '../src/learning/schema.js';

async function main() {
  const db = await dbManager.getDB();
  
  console.log('--- Gravity Curated Learning Injection (BLE V2) ---');
  
  // Asegurar que el esquema existe
  await installLearningSchema(db as any);
  console.log('[1/2] Learning schema validated.');

  const niche = 'cerrajeros';
  const city = 'Getafe';

  // Lecciones a inyectar en la tabla 'learning_curated_lessons'
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

  for (const lesson of lessons) {
    await upsertCuratedLesson(db as any, lesson);
    console.log(`[+] Injected curated lesson: "${lesson.issue_code}" for ${lesson.agent_name}`);
  }

  console.log('\n[SUCCESS] Curated learning patch applied. The prompt augmenter will now see these.');
  process.exit(0);
}

main().catch(err => {
  console.error('Failed to inject curated learning patch:', err);
  process.exit(1);
});
