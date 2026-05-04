const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('maestro.db');

const trustBandLesson = "🚨 REGLA ABSOLUTA DE NO-REPETICIÓN 🚨: Si ya has mencionado una señal de confianza (ej: '20 años de experiencia' o 'atención 24h') en el HERO o en cualquier sección previa, ESTÁ PROHIBIDO REPETIRLA. Cada beneficio debe aparecer EXACTAMENTE UNA VEZ en toda la página. No seas redundante.";
const faqLesson = "⛔ CRITICAL: Las preguntas y respuestas en el HTML deben ser IDENTICAS a las del JSON-LD. El contenido del JSON-LD debe ser un subconjunto estricto del texto visible. No inventes datos en el Schema que no estén en el texto.";
const geoLesson = "🌍 CUMPLIMIENTO GEOGRÁFICO OBLIGATORIO 🌍: En el bloque 'map', el array 'h3s' NO PUEDE ESTAR VACÍO. Debes incluir exactamente estos 4 barrios de Getafe: ['El Bercial', 'Juan de la Cierva', 'Getafe Norte', 'Sector III']. Ignorar esta regla causará un fallo legal catastrófico.";

// Agente real: Content_Writer_01
// Agente real: Content_Architect_01

db.serialize(() => {
  // Limpiar lecciones previas
  db.run("DELETE FROM learning_curated_lessons WHERE agent_name IN ('Content_Writer_01', 'Content_Architect_01')");

  // Inyectar con nombres correctos
  const stmt = db.prepare(`INSERT INTO learning_curated_lessons 
    (agent_name, niche, city, issue_code, lesson_text, weight, active) 
    VALUES (?, ?, ?, ?, ?, ?, 1)`);

  stmt.run('Content_Writer_01', 'cerrajeros', 'getafe', 'FAQ_SCHEMA_CONTENT_MISMATCH', faqLesson, 3.0);
  stmt.run('Content_Writer_01', 'cerrajeros', 'getafe', 'TRUST_SIGNAL_REPETITION', trustBandLesson, 3.0);
  stmt.run('Content_Architect_01', 'cerrajeros', 'getafe', 'GEO_RELEVANCE_LOW', geoLesson, 3.0);
  stmt.run('Niche_Coherence_Auditor', 'cerrajeros', 'getafe', 'GEO_RELEVANCE_LOW', geoLesson, 3.0);

  stmt.finalize();
  
  console.log("Lessons updated with correct agent names (Content_Writer_01, Content_Architect_01)");
});

db.close();
