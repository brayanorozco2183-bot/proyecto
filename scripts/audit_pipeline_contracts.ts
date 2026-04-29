import { CANONICAL_PIPELINE_PHASES } from '../src/types/pipeline/contracts.js';
import { assertPipelinePhaseContract } from '../src/validators/pipelineContractValidator.js';
import { createInitialPipelineState } from '../src/pipeline-state/pipelineStateStore.js';

const mission = {
  niche: 'cerrajeros',
  city: 'Getafe',
  local_nap: { business_name: 'Cerrajeros Getafe', phone: '910000000', address: 'Getafe' },
};

const state = createInitialPipelineState(mission as any, 'contract-audit');
state.data.siteGraph = { pages: [] } as any;
state.data.researchContext = { niche: 'cerrajeros', city: 'Getafe', competitors: [], entities: [], intentModel: { primaryIntent: 'transactional' } } as any;
state.data.normalizedContext = { niche: 'cerrajeros', city: 'Getafe', clean_nap: { phone_normalized: '910000000' }, clustered_keywords: [] } as any;
state.data.pagePlan = { h1: 'Cerrajeros en Getafe', sections: [], intentModel: { pageType: 'local', wordCountTarget: 900 } } as any;
state.data.resolvedPlan = { sections: [] } as any;
state.data.contentDraft = { blocks: [{ id: 'hero', content: 'Contenido inicial' }], totalWords: 900 } as any;
state.data.correctedDraft = state.data.contentDraft as any;
state.data.enrichedDraft = state.data.contentDraft as any;
state.data.seoResult = { renderedSeo: { title: 'Cerrajeros en Getafe' } } as any;
state.data.renderedPage = { html: '<html><body><h1>Cerrajeros en Getafe</h1><p>Contenido de prueba.</p></body></html>', metadata: {} } as any;
state.data.qualityGateResult = { passed: true, score: 90, issues: [] } as any;
state.data.editorialAudit = { score: 90 } as any;
state.data.delivery = { attempted: true, completed: true } as any;
state.data.postDeployAudit = { score: 90, status: 'published', notes: [] } as any;

for (const phase of CANONICAL_PIPELINE_PHASES) {
  assertPipelinePhaseContract(phase, 'input', state);
  assertPipelinePhaseContract(phase, 'output', state);
}

console.log(`Contrato de fases OK: ${CANONICAL_PIPELINE_PHASES.length} fases validadas.`);
