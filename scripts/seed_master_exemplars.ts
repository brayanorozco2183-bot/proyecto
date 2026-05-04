import { dbManager } from '../src/db/index.js';

async function seedMasterExemplars() {
  const db = await dbManager.getDB();
  console.log('[SEED] Injecting Premium Master Seeds...');

  const exemplars = [
    {
      agent_name: 'Content_Writer_01',
      niche: 'cerrajeros',
      title: 'Maestro Cerrajeros V7 - Apertura Técnica',
      excerpt: 'Especialistas en apertura técnica sin daños y sustitución de cilindros de alta seguridad. Nuestro equipo local garantiza una intervención limpia, transparente y con presupuesto previo cerrado, protegiendo lo que más importa con profesionalidad técnica.',
      fingerprint: 'master_seed_v7_cerrajeros'
    },
    {
      agent_name: 'Content_Writer_01',
      niche: 'fontaneros',
      title: 'Maestro Fontaneros V7 - Fugas y Desatascos',
      excerpt: 'Soluciones técnicas para redes de agua y sistemas de calefacción. Expertos en localización de fugas no destructiva y desatascos urgentes, operando bajo protocolos de calidad rigurosos para una resolución definitiva y profesional en cada aviso.',
      fingerprint: 'master_seed_v7_fontaneros'
    },
    {
      agent_name: 'Content_Writer_01',
      niche: 'pintores',
      title: 'Maestro Pintores V7 - Acabados Premium',
      excerpt: 'Transformamos espacios con técnicas de pintura vanguardistas y materiales de alta durabilidad. Nuestro equipo destaca por el cuidado minucioso en la preparación de superficies y la limpieza absoluta, entregando acabados perfectos con criterio estético profesional.',
      fingerprint: 'master_seed_v7_pintores'
    }
  ];

  for (const ex of exemplars) {
    try {
      await db.run(`
        INSERT INTO learning_exemplars (
          agent_name, niche, city, polarity, title, excerpt, fingerprint, score, metadata_json
        ) VALUES (?, ?, NULL, 'positive', ?, ?, ?, 99, ?)
      `, [
        ex.agent_name,
        ex.niche,
        ex.title,
        ex.excerpt,
        ex.fingerprint,
        JSON.stringify({ strengths: ['Estructura Premium', 'Cero placeholders', 'Autoridad técnica'], status: 'premium' })
      ]);
      console.log(`+ Seed injected: ${ex.niche}`);
    } catch (e: any) {
      if (e.message.includes('UNIQUE')) {
         console.log(`- Seed for ${ex.niche} already exists.`);
      } else {
         console.error(`! Error seeding ${ex.niche}:`, e.message);
      }
    }
  }

  console.log('[SEED] Master seeding complete.');
}

seedMasterExemplars().catch(console.error);
