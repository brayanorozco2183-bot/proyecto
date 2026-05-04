import type { FallbackBlockType, LocalContextKind } from './types.js';
import { TEMPLATE_RECIPES } from './templates/index.js';
import type { LayoutRecipe } from './templates/types.js';

export type { LayoutRecipe } from './templates/types.js';

export function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

export function pickOne<T>(items: readonly T[], seed: string): T {
  if (!items.length) throw new Error('pickOne requires at least one item');
  return items[hashString(seed) % items.length];
}

function rotateSeedByContext(seed: string, contextKind: LocalContextKind): string {
  return `${seed}:${contextKind}:${hashString(`${contextKind}:${seed}`) % 97}`;
}

export function resolveBlockRecipe(blockType: FallbackBlockType, seed: string, contextKind: LocalContextKind): LayoutRecipe {
  const recipes = TEMPLATE_RECIPES[blockType] || TEMPLATE_RECIPES.content;
  return pickOne(recipes, rotateSeedByContext(`${seed}:${blockType}`, contextKind));
}

export function listRecipesForBlock(blockType: FallbackBlockType): readonly LayoutRecipe[] {
  return TEMPLATE_RECIPES[blockType] || TEMPLATE_RECIPES.content;
}
