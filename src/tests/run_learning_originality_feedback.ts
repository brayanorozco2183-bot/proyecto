import { dbManager } from '../db/index.js';
import { persistOutputReview } from '../learning/learningService.js';
import { prepareOriginalityConstraints, recordOriginalityAfterRender } from '../originality/pipelineAdapters.js';

async function main() {
  await dbManager.getDB();

  const fakePlan = {
    h1: 'Cerrajeros en Getafe con criterio técnico real',
    hero: {
      h1: 'Cerrajeros en Getafe con diagnóstico previo',
      subtitle: 'Proceso claro, cobertura real y cierre verificado.',
      cta_text: 'Solicitar presupuesto'
    },
    sections: [
      { section_id: 'servicios', block_type: 'services_grid', h2: 'Qué resolvemos en Getafe', h3s: ['Apertura', 'Bombín', 'Seguridad'] },
      { section_id: 'proceso', block_type: 'process_steps', h2: 'Cómo trabajamos en Getafe', h3s: ['Diagnóstico', 'Intervención', 'Verificación'] },
      { section_id: 'faq', block_type: 'faq', h2: 'Preguntas frecuentes', h3s: ['¿Qué influye en el presupuesto?', '¿Cuándo cambiar bombín?'] },
      { section_id: 'cta', block_type: 'cta_panel', h2: 'Solicita orientación profesional' }
    ],
    intentModel: {
      pageType: 'service',
      primaryKeyword: 'cerrajeros',
      primaryIntent: 'transactional',
      funnelStage: 'BOFU'
    },
    design: { dna: { family: 'technical_grid', heroTreatment: 'split', sectionCadence: 'alternating' } },
    layoutContract: {
      heroTemplate: 'split',
      orderedSectionIds: ['servicios', 'proceso', 'faq', 'cta'],
      pageComposition: 'conversion',
      cadencePattern: 'alternating',
      sections: {
        servicios: { blockType: 'services_grid', visualVariant: 'grid_cards' },
        proceso: { blockType: 'process_steps', visualVariant: 'timeline_compact' },
        faq: { blockType: 'faq', visualVariant: 'accordion_clean' },
        cta: { blockType: 'cta_panel', visualVariant: 'cta_centered' }
      }
    }
  };

  const mission = { niche: 'cerrajeros', city: 'Getafe' };
  const pre = await prepareOriginalityConstraints({ mission, pagePlan: fakePlan, pageId: 'test-page' });
  console.log('[TEST] Originality pre-score:', pre.score, 'reservation:', pre.reservation?.reservationKey || null);

  const html = `
  <html><body>
    <header><a href="tel:916000000">916000000</a></header>
    <h1>Cerrajeros en Getafe con diagnóstico previo</h1>
    <p>En Getafe, una intervención técnica exige revisar bombín, cerradura y alineación antes de cambiar piezas.</p>
    <section id="faq"><h2>Preguntas frecuentes</h2><p>En Getafe, el presupuesto depende del cierre, del acceso y de las piezas.</p></section>
  </body></html>`;

  const review = await persistOutputReview({
    missionId: 'mission-test',
    agentName: 'Quality_Auditor_10',
    niche: 'cerrajeros',
    city: 'Getafe',
    pageType: 'service',
    html,
    businessName: 'Cerrajeros Getafe 24h',
    phone: '916000000',
    seo: { title: 'Cerrajeros Getafe', metaDescription: 'Test', canonical: '/cerrajeros/getafe/' },
    llmScore: 88,
    llmReasoning: 'Página suficiente para prueba.'
  });
  console.log('[TEST] Review score/status:', review.score, review.status);

  const post = await recordOriginalityAfterRender({ mission, pagePlan: fakePlan, html, pageId: 'test-page' });
  console.log('[TEST] Reservation consumed:', post.reservationKey || null);
}

main().catch((error) => {
  console.error('[TEST] Failed:', error);
  process.exit(1);
});
