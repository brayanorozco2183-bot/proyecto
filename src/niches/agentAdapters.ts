import { loadNichePlaybook, resolveNicheId, resolveCanonicalServiceNiche, normalizeMissionNiche, getCanonicalNicheLabel } from './playbookLoader.js';
import { buildAgentPlaybookContext, selectFaqEntries } from './playbookSelectors.js';
import { buildGenericNichePlaybook } from './genericPlaybook.js';

const missionPlaybookContextCache = new Map<string, ReturnType<typeof buildAgentPlaybookContext>>();

function resolvePlaybookKey(niche: string): string {
  const normalized = normalizeMissionNiche(niche);
  return resolveCanonicalServiceNiche(normalized || niche) || resolveNicheId(normalized || niche) || normalized || niche;
}

export function resolvePlaybookForMission(niche: string) {
  const key = resolvePlaybookKey(niche);
  if (missionPlaybookContextCache.has(key)) {
    return missionPlaybookContextCache.get(key)!;
  }

  const playbook = loadNichePlaybook(key) || buildGenericNichePlaybook(niche);
  const context = buildAgentPlaybookContext(playbook);
  missionPlaybookContextCache.set(key, context);
  return context;
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
  const key = resolvePlaybookKey(niche);
  const playbook = loadNichePlaybook(key) || buildGenericNichePlaybook(niche);
  return selectFaqEntries(playbook, limit).map(item => ({
    question: item.question,
    answer: item.answerGuidance
  }));
}

export function getRequiredSchemaTypesForNiche(niche: string): string[] {
  const key = resolvePlaybookKey(niche);
  return (loadNichePlaybook(key) || buildGenericNichePlaybook(niche)).schemaTypes;
}

export function getNicheAliases(niche: string): string[] {
  const key = resolvePlaybookKey(niche);
  return (loadNichePlaybook(key) || buildGenericNichePlaybook(niche)).aliases;
}

export { normalizeMissionNiche, getCanonicalNicheLabel, resolveCanonicalServiceNiche };
