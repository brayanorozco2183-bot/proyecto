import type { DesignSystemTheme } from '../types.js';
import {
    DEFAULT_BREAKPOINTS,
    OFFICIAL_SHELL_TOKENS,
    SECTION_VERTICAL_SPACING,
    softRadius,
    trustShadow,
    assertiveMotion,
    trustSlate,
    modernTypography
} from '../tokens/index.js';

export const modernTrust: DesignSystemTheme = {
    id: 'modernTrust',
    name: 'Modern Trust',
    description: 'Sistema de conversión limpio y muy controlado, con foco en prueba y claridad.',
    tokens: {
        colors: trustSlate,
        typography: modernTypography,
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
            primaryFill: 'primary',
            secondaryFill: 'surface',
            ghostUnderline: false
        },
        cards: {
            variant: 'tonal',
            radiusToken: 'card',
            shadowToken: 'soft',
            borderWidth: '1px',
            mediaRatio: '16 / 9',
            headerGap: '0.625rem'
        },
        shadowPolicy: 'soft',
        verticalRhythm: 'standard',
        hero: {
            template: 'centered',
            disposition: 'content_center',
            maxTrustBullets: 3,
            maxPrimaryCtas: 1,
            allowSecondaryCta: true,
            eyebrowStyle: 'chip',
            emphasis: 'proof'
        },
        allowedShells: ['plain', 'panel', 'band', 'comparison'],
        shellUsage: {
            hero: 'plain',
            trust: 'band',
            faq: 'panel',
            comparison: 'comparison',
            default: 'panel'
        }
    },
    compatibility: {
        recommendedFamilies: ['conversion_heavy'],
        pageCompositions: ['conversion', 'trust_first'],
        cadencePatterns: ['alternating', 'contrast-bursts'],
        preferredHeroTreatments: ['centered', 'cta_heavy', 'proof_first'],
        densityBias: 'standard'
    }
};