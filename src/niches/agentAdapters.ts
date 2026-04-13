import { requireNichePlaybook } from './playbookLoader.js';
import { buildAgentPlaybookContext, selectFaqEntries } from './playbookSelectors.js';

export function resolvePlaybookForMission(niche: string) {
  const playbook = requireNichePlaybook(niche);
  return buildAgentPlaybookContext(playbook);
}

export function buildAnalystInjection(niche: string): string {
  return resolvePlaybookForMission(niche).analystBrief;
}

export function buildArchitectInjection(niche: string): string {
  return resolvePlaybookForMission(niche).architectBrief;
}

export function buildWriterInjection(niche: string): string {
  return resolvePlaybookForMission(niche).writerBrief;
}

export function buildTechnicalInjection(niche: string): string {
  return resolvePlaybookForMission(niche).technicalBrief;
}

export function resolveFaqSeed(niche: string, limit = 5) {
  const playbook = requireNichePlaybook(niche);
  return selectFaqEntries(playbook, limit).map(item => ({
    question: item.question,
    answer: item.answerGuidance
  }));
}

export function getRequiredSchemaTypesForNiche(niche: string): string[] {
  return requireNichePlaybook(niche).schemaTypes;
}

export function getNicheAliases(niche: string): string[] {
  return requireNichePlaybook(niche).aliases;
}