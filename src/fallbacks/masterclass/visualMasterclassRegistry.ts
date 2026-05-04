import { VISUAL_MASTERCLASS_CATALOG } from './visualMasterclassCatalog.js';
import type {
  ResolveVisualMasterclassInput,
  VisualMasterclassSeed,
} from './visualMasterclassTypes.js';

const catalogMap = new Map(
  VISUAL_MASTERCLASS_CATALOG.map((item) => [item.masterclassId, item]),
);

function hashToIndex(value: string, modulo: number): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return modulo > 0 ? hash % modulo : 0;
}

export function getAllVisualMasterclasses(): VisualMasterclassSeed[] {
  return VISUAL_MASTERCLASS_CATALOG.slice();
}

export function getVisualMasterclassById(
  masterclassId: string,
): VisualMasterclassSeed | null {
  return catalogMap.get(masterclassId) ?? null;
}

export function resolveVisualMasterclass(
  input: ResolveVisualMasterclassInput = {},
): VisualMasterclassSeed {
  const explicit = input.masterclassId
    ? getVisualMasterclassById(input.masterclassId)
    : null;

  if (explicit) {
    return explicit;
  }

  let candidates = VISUAL_MASTERCLASS_CATALOG.slice();

  if (input.density) {
    candidates = candidates.filter(
      (item) => item.visualDna.density === input.density,
    );
  }

  if (input.compositionFamily) {
    candidates = candidates.filter(
      (item) => item.visualDna.compositionFamily === input.compositionFamily,
    );
  }

  if (input.heroVariant) {
    candidates = candidates.filter(
      (item) => item.visualDna.heroVariant === input.heroVariant,
    );
  }

  if (input.cardStyle) {
    candidates = candidates.filter(
      (item) => item.visualDna.cardStyle === input.cardStyle,
    );
  }

  if (!candidates.length) {
    candidates = VISUAL_MASTERCLASS_CATALOG;
  }

  const seedValue = input.seed == null ? 'default-masterclass-seed' : String(input.seed);
  const index = hashToIndex(seedValue, candidates.length);
  return candidates[index];
}

export function groupVisualMasterclassesByDensity(): Record<string, VisualMasterclassSeed[]> {
  return VISUAL_MASTERCLASS_CATALOG.reduce<Record<string, VisualMasterclassSeed[]>>(
    (acc, item) => {
      const key = item.visualDna.density;
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    },
    {},
  );
}
