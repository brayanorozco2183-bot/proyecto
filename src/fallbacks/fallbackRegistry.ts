import type { ContentBlock } from '../types/pipeline_v2.js';
import type { PremiumFallbackInput, PremiumFallbackResult } from './types.js';
import { buildPremiumFallback } from './blockFallbackFactory.js';

export function createPremiumFallbackBlock(input: PremiumFallbackInput): ContentBlock {
  const result = buildPremiumFallback(input);
  return {
    id: input.sectionId || `fallback-${result.blockType}`,
    type: result.blockType,
    h2: result.h2,
    html: result.html,
    wordCount: result.wordCount,
    score: 0,
    metadata: {
      block_type: result.blockType,
      sectionIndex: 0,
      premium_fallback: true,
      fallback_topics: result.topics,
      ...result.meta,
    },
  };
}

export function createPremiumFallbackHtml(input: PremiumFallbackInput): PremiumFallbackResult {
  return buildPremiumFallback(input);
}
