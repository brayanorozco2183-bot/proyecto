
import { agentMemoryStore, installAgentMemorySchema } from '../src/ai/agentMemory.js';
import { dbManager } from '../src/db/index.js';

async function main() {
  const db = await dbManager.getDB();
  
  console.log('--- Gravity Learning Injection ---');
  
  // Asegurar que el esquema existe
  await installAgentMemorySchema(db);
  console.log('[1/3] Memory schema validated.');

  const niche = 'cerrajeros';
  const city = 'Getafe';

  // Lecciones a inyectar
  const lessons = [
    {
      agentName: 'ContentWriterAgent',
      title: 'Sincronización Estricta de FAQ y Schema',
      lesson: 'Las preguntas y respuestas del bloque FAQ en el HTML deben coincidir letra por letra con las del JSON-LD FAQPage. No incluyas FAQs en el esquema que no estén presentes en el cuerpo visible de la página.',
      severity: 'major' as const,
      lessonType: 'quality',
      niche,
      city
    },
    {
      agentName: 'ContentWriterAgent',
      title: 'Enriquecimiento de Señales de Confianza (Trust Band)',
      lesson: 'La sección de confianza (Trust Band) nunca debe estar vacía. Debe mencionar explícitamente: "Más de 15 años de experiencia en Getafe", "Garantía por escrito en todas nuestras aperturas" y "Técnicos certificados por la Unión de Cerrajeros".',
      severity: 'major' as const,
      lessonType: 'quality',
      niche,
      city
    },
    {
      agentName: 'Architect',
      title: 'Optimización de Contexto Local en Getafe',
      lesson: 'Al planificar la página para Getafe, prioriza menciones a barrios específicos como El Bercial, Getafe Norte, Juan de la Cierva y Sector III para aumentar la relevancia geográfica.',
      severity: 'minor' as const,
      lessonType: 'geo-intelligence',
      niche,
      city
    }
  ];

  for (const lesson of lessons) {
    await agentMemoryStore.recordLesson(lesson);
    console.log(`[+] Injected lesson: "${lesson.title}" for ${lesson.agentName}`);
  }

  console.log('\n[SUCCESS] Learning patch applied. The next run will be augmented with these lessons.');
  process.exit(0);
}

main().catch(err => {
  console.error('Failed to inject learning patch:', err);
  process.exit(1);
});
