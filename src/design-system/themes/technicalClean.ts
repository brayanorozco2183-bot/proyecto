import type { DesignSystemTheme } from '../types.js';
import {
    DEFAULT_BREAKPOINTS,
    OFFICIAL_SHELL_TOKENS,
    SECTION_VERTICAL_SPACING,
    softRadius,
    trustShadow,
    assertiveMotion,
    technicalBlue,
    technicalTypography
} from '../tokens/index.js';

export const technicalClean: DesignSystemTheme = {
    id: 'technicalClean',
    name: 'Technical Clean',
    description: 'Sistema técnico-premium con claridad alta, superficies suaves y hero proof-first.',
    tokens: {
        colors: technicalBlue,
        typography: technicalTypography,
        spacing: SECTION_VERTICAL_SPACING,
        shells: OFFICIAL_SHELL_TOKENS,
        radius: softRadius,
        shadow: trustShadow,
        breakpoints: DEFAULT_BREAKPOINTS,
        motion: assertiveMotion
    },
    rules: {
        buttonSystem: {
            radiusToken: 'button',
            shadowToken: 'lift',
            borderWidth: '1px',
            fontCase: 'normal',
            fontWeight: 700,
            primaryFill: 'accent',
            secondaryFill: 'surface',
            ghostUnderline: false
        },
        cards: {
            variant: 'elevated',
            radiusToken: 'card',
            shadowToken: 'soft',
            borderWidth: '1px',
            mediaRatio: '16 / 9',
            headerGap: '0.625rem'
        },
        shadowPolicy: 'soft',
        verticalRhythm: 'standard',
        hero: {
            template: 'proof_first',
            disposition: 'content_left',
            maxTrustBullets: 3,
            maxPrimaryCtas: 1,
            allowSecondaryCta: true,
            eyebrowStyle: 'chip',
            emphasis: 'proof'
        },
        allowedShells: ['plain', 'panel', 'comparison', 'feature'],
        shellUsage: {
            hero: 'plain',
            trust: 'panel',
            faq: 'plain',
            comparison: 'comparison',
            default: 'plain'
        }
    },
    compatibility: {
        recommendedFamilies: ['technical_grid', 'minimal_authority'],
        pageCompositions: ['conversion', 'trust_first'],
        cadencePatterns: ['alternating', 'calm'],
        preferredHeroTreatments: ['proof_first', 'split'],
        densityBias: 'standard'
    }
};