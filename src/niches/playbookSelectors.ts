import type {
  AgentPlaybookContext,
  BlockPlaybookPayload,
  FaqEntry,
  NichePlaybook
} from './types.js';

function bulletList(items: string[]): string {
  if (!Array.isArray(items)) return 'N/A';
  return items.map(item => `- ${item}`).join('\n');
}

export function buildAgentPlaybookContext(playbook: NichePlaybook): AgentPlaybookContext {
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

  const writerBrief = `
PLAYBOOK DE NICHO: ${playbook.displayName}
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

export function selectFaqEntries(playbook: NichePlaybook, limit = 5): FaqEntry[] {
  return playbook.faqBank.slice(0, limit);
}

export function buildBlockPayload(playbook: NichePlaybook, blockType: string): BlockPlaybookPayload {
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
      faqItems: playbook.faqBank.slice(0, 5).map(entry => ({
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