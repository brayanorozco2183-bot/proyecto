import { COVERAGE_TEMPLATES } from './coverageTemplates.js';
import type {
  BuildCoverageCopyInput,
  BuiltCoverageCopy,
  CoverageTemplate,
  ResolveCoverageTemplateInput
} from './coverageTemplateTypes.js';

function hashSeed(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

function pick<T>(items: T[], seed: string | number | undefined, salt: string): T {
  if (items.length === 0) {
    throw new Error(`Cannot pick from empty list: ${salt}`);
  }
  const normalizedSeed = String(seed ?? 'coverage-template');
  const index = hashSeed(`${normalizedSeed}:${salt}`) % items.length;
  return items[index];
}

function fillPattern(pattern: string, input: BuildCoverageCopyInput): string {
  const fallbackRegion = input.region || input.city || 'tu zona';
  return pattern
    .replaceAll('{niche}', input.niche)
    .replaceAll('{city}', input.city || fallbackRegion)
    .replaceAll('{region}', fallbackRegion)
    .replaceAll('{neighborhood}', input.neighborhood || input.city || fallbackRegion)
    .replaceAll('{loc_name}', input.locName);
}

export function resolveCoverageTemplate(input: ResolveCoverageTemplateInput = { niche: 'servicio' }): CoverageTemplate {
  const candidates = COVERAGE_TEMPLATES.filter((template) => {
    const toneOk = input.tone ? template.tone === input.tone : true;
    const densityOk = input.density ? template.density === input.density : true;
    return toneOk && densityOk;
  });

  return pick(
    candidates.length > 0 ? candidates : COVERAGE_TEMPLATES,
    input.seed ?? `${input.niche}:${input.city ?? ''}:${input.region ?? ''}:${input.neighborhood ?? ''}`,
    'template'
  );
}

export function buildCoverageCopy(input: BuildCoverageCopyInput): BuiltCoverageCopy {
  const template = resolveCoverageTemplate(input);
  const seed = input.seed ?? `${input.niche}:${input.city ?? ''}:${input.locName}:${template.id}`;

  return {
    templateId: template.id,
    h2: fillPattern(pick(template.h2Patterns, seed, 'h2'), input),
    intro: fillPattern(pick(template.introPatterns, seed, 'intro'), input),
    anchor: fillPattern(pick(template.anchorPatterns, seed, 'anchor'), input)
  };
}

export function getCoverageTemplateById(id: string): CoverageTemplate | undefined {
  return COVERAGE_TEMPLATES.find((template) => template.id === id);
}

export function listCoverageTemplateIds(): string[] {
  return COVERAGE_TEMPLATES.map((template) => template.id);
}
