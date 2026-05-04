import { resolveDesign } from './procedural-engine.js';
import { getFamilyDefinition } from './families/index.js';
import { PageDesignDNA } from '../types/design.js';

export function resolveTheme(input: {
    seed: string;
    pageType?: string;
    pageComposition?: string;
    heroVariant?: string;
    blockTypes?: string[];
    dna?: PageDesignDNA;
}) {
    const familyDef = getFamilyDefinition(input.dna?.family);
    const { tokens } = resolveDesign({
        seed: input.seed,
        pageType: input.pageType,
        niche: input.dna?.personality,
        familyTypography: {
            bodyScale: familyDef.typography.bodyScale,
            measure: familyDef.typography.measure,
            letterSpacingPolicy: familyDef.typography.letterSpacingPolicy
        }
    });

    return {
        pageFamily: 'premium_valencia_master',
        visualVariantId:
            input.heroVariant === 'cta-heavy' ? 'c' :
                input.pageComposition === 'trust_first' ? 'b' : 'a',
        designTokens: {
            ...tokens,
            semantic: {
                sectionEmphasisBg: 'var(--surface)',
                sectionTrustAccent: 'var(--primary)',
                ctaSurface: 'var(--surface-alt)',
                cardShadowLevel: 'medium',
                contentDensityGap:
                    input.pageComposition === 'conversion' ? 'tight' : 'normal',
                heroVisualBalance: input.heroVariant || 'split',
                proofBadgeStyle:
                    input.pageComposition === 'trust_first' ? 'strong' : 'soft'
            }
        },
        composition: input.pageComposition || 'conversion'
    };
}