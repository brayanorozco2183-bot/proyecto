import { buildSeed, rotateSeeded } from '../utils/designSeed.js';
import type {
  AgentPlaybookContext,
  BlockPlaybookPayload,
  FaqEntry,
  NichePlaybook
} from './types.js';
import { buildPremiumContractBrief } from './premiumContracts.js';

function bulletList(items: string[]): string {
  if (!Array.isArray(items)) return 'N/A';
  return items.map(item => `- ${item}`).join('\n');
}

function deriveGoodExamples(playbook: NichePlaybook): string[] {
  const seeded = [
    ...playbook.faqBank.slice(0, 2).map((f) => `${f.question} -> ${f.answerGuidance}`),
    ...playbook.validTrustSignals.slice(0, 2).map((s) => `${s.label}: ${s.description}`),
    ...playbook.coreServices.slice(0, 2).map((s) => `Servicio válido: ${s}`)
  ];
  return Array.from(new Set(seeded.filter(Boolean))).slice(0, 6);
}

function deriveBadExamples(playbook: NichePlaybook): string[] {
  const seeded = [
    ...playbook.forbiddenVocabulary.slice(0, 6).map((term) => `No usar: ${term}`),
    ...((playbook.legalRiskPolicy?.prohibitedClaims || []).slice(0, 4).map((claim) => `Claim prohibido: ${claim}`)),
    ...((playbook.toneProfile?.forbiddenCliches || []).slice(0, 4).map((cliche) => `Evitar cliché: ${cliche}`))
  ];
  return Array.from(new Set(seeded.filter(Boolean))).slice(0, 8);
}

export function buildAgentPlaybookContext(playbook: NichePlaybook): AgentPlaybookContext {
  const examplesGood = playbook.examples?.good?.length ? playbook.examples.good : deriveGoodExamples(playbook);
  const examplesBad = playbook.examples?.bad?.length ? playbook.examples.bad : deriveBadExamples(playbook);

  const analystBrief = `
PLAYBOOK DE NICHO: ${playbook.displayName}
VOCABULARIO PERMITIDO:
${bulletList(playbook.allowedVocabulary?.slice(0, 18))}
SEÑALES DE CONFIANZA VÁLIDAS:
${bulletList(playbook.validTrustSignals?.map(s => `${s.label}: ${s.description}`))}
SERVICIOS PRINCIPALES:
${bulletList(playbook.coreServices)}
VARIANTES BOFU:
${bulletList(playbook.bofuVariants.map(v => `${v.label} | ${v.angle}`))}
OBJECIONES REALES:
${bulletList(playbook.commonObjections)}
TIPOS DE SCHEMA PERMITIDOS:
${bulletList(playbook.schemaTypes)}
`.trim();

  const architectBrief = `
PLAYBOOK DE NICHO: ${playbook.displayName}
SERVICIOS QUE DEBEN APARECER EN LA ESTRATEGIA:
${bulletList(playbook.coreServices)}
CRITERIOS DE DECISIÓN A REPARTIR ENTRE BLOQUES:
${bulletList(playbook.decisionCriteria?.map(c => `${c.label}: ${c.whyItMatters}`))}
ERRORES COMUNES A CUBRIR:
${bulletList(playbook.commonMistakes)}
FAQS REALES A PRIORIZAR:
${bulletList(playbook.faqBank?.slice(0, 8).map(f => f.question))}
NO SALIRSE DE ESTE VOCABULARIO:
${bulletList(playbook.allowedVocabulary?.slice(0, 18))}
`.trim();

  const premiumContractBrief = process.env.GRAVITY_PREMIUM_CONTRACT || buildPremiumContractBrief(playbook.id);

  const writerBrief = `
PLAYBOOK DE NICHO: ${playbook.displayName}
PACK CERRADO DE NICHO (OBLIGATORIO):
- Usa solo terminología, piezas, averías, procesos y ejemplos compatibles con ${playbook.displayName}.
- Si una idea no encaja claramente en este playbook, no la uses.
- No mezcles vocabulario, claims ni procesos de otros oficios.
- Ante duda, regresa a servicios, FAQs, trust signals y criterios de decisión de este pack.
VOCABULARIO PERMITIDO:
${bulletList(playbook.allowedVocabulary)}
VOCABULARIO PROHIBIDO:
${bulletList(playbook.forbiddenVocabulary)}
ÁNGULOS EDITORIALES PREFERIDOS:
${bulletList(playbook.toneProfile?.editorialAngles || [])}
SEÑALES DE CONFIANZA REALES:
${bulletList(playbook.validTrustSignals?.map(s => s.label))}
OBJECIONES:
${bulletList(playbook.commonObjections)}
FAQS Y RESPUESTAS:
${bulletList(playbook.faqBank?.map(f => `${f.question} -> ${f.answerGuidance}`))}
EJEMPLOS BUENOS:
${bulletList(examplesGood)}
EJEMPLOS MALOS:
${bulletList(examplesBad)}

${premiumContractBrief}
`.trim();

  const technicalBrief = `
PLAYBOOK DE NICHO: ${playbook.displayName}
CLAIMS PROHIBIDOS:
${bulletList(playbook.legalRiskPolicy?.prohibitedClaims)}
AFIRMACIONES SEGURAS:
${bulletList(playbook.legalRiskPolicy?.allowedSafeClaims)}
VERIFICACIÓN OBLIGATORIA:
${bulletList(playbook.legalRiskPolicy?.verificationRequiredFor)}
POLÍTICA DE PRECIOS:
${bulletList(playbook.legalRiskPolicy?.pricingPolicy?.allowedLanguage)}
POLÍTICA DE GARANTÍA:
${bulletList(playbook.legalRiskPolicy?.guaranteePolicy?.allowedLanguage)}
SCHEMA AUTORIZADO:
${bulletList(playbook.schemaTypes)}
`.trim();

  return { playbook, analystBrief, architectBrief, writerBrief, technicalBrief };
}

export function selectFaqEntries(playbook: NichePlaybook, limit = 5, scope = ''): FaqEntry[] {
  return rotateSeeded(playbook.faqBank.slice(), buildSeed(playbook.id, scope, 'faq')).slice(0, limit);
}

export function buildBlockPayload(playbook: NichePlaybook, blockType: string, scope = ''): BlockPlaybookPayload {
  if (blockType === 'services_grid') {
    return {
      services: playbook.blockSemantics.servicesGrid.categories.map(category => ({
        title: category.label,
        body: `${category.summary} Situaciones habituales: ${category.situations.join(', ')}.`,
        meta: [category.decisionFactor]
      })),
      trustBullets: playbook.blockSemantics.servicesGrid.trustBullets,
      decisionFactors: playbook.decisionCriteria.slice(0, 3).map(c => ({
        title: c.label,
        body: c.whyItMatters
      })),
      commonMistakes: playbook.commonMistakes.slice(0, 3)
    };
  }

  if (blockType === 'process_steps') {
    return {
      services: playbook.blockSemantics.processSteps.steps.map(step => ({
        title: step.title,
        body: `${step.detail} Control de riesgo: ${step.riskControl}.`
      })),
      decisionFactors: playbook.decisionCriteria.slice(0, 2).map(c => ({
        title: c.label,
        body: c.whyItMatters
      })),
      commonMistakes: playbook.commonMistakes.slice(0, 3)
    };
  }

  if (blockType === 'faq') {
    return {
      faqItems: selectFaqEntries(playbook, 5, `${scope}::faq`).map(entry => ({
        question: entry.question,
        answer: entry.answerGuidance
      })),
      trustBullets: playbook.validTrustSignals.slice(0, 3).map(s => s.label)
    };
  }

  if (blockType === 'price_guidance') {
    return {
      decisionFactors: playbook.blockSemantics.priceGuidance.factors.map(f => ({
        title: f.label,
        body: `${f.whyItChanges} ${f.safeLanguage}`
      })),
      priceRows: playbook.blockSemantics.priceGuidance.comparisonRows,
      commonMistakes: playbook.commonMistakes.slice(0, 3)
    };
  }

  return {};
}