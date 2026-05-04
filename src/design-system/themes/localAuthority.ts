import type { DesignSystemTheme } from '../types.js';
import {
    DEFAULT_BREAKPOINTS,
    OFFICIAL_SHELL_TOKENS,
    SECTION_VERTICAL_SPACING,
    classicRadius,
    trustShadow,
    calmMotion,
    warmAuthority,
    localTypography
} from '../tokens/index.js';

export const localAuthority: DesignSystemTheme = {
    id: 'localAuthority',
    name: 'Local Authority',
    description: 'Sistema para páginas locales con señal de oficio, proximidad y prueba dispersa.',
    tokens: {
        colors: warmAuthority,
        typography: localTypography,
        spacing: SECTION_VERTICAL_SPACING,
        shells: OFFICIAL_SHELL_TOKENS,
        radius: classicRadius,
        shadow: trustShadow,
        breakpoints: DEFAULT_BREAKPOINTS,
        motion: calmMotion
    },
    rules: {
        buttonSystem: {
            radiusToken: 'button',
            shadowToken: 'soft',
            borderWidth: '1px',
            fontCase: 'normal',
            fontWeight: 700,
            primaryFill: 'primary',
            secondaryFill: 'surface',
            ghostUnderline: true
        },
        cards: {
            variant: 'outlined',
            radiusToken: 'card',
            shadowToken: 'none',
            borderWidth: '1px',
            mediaRatio: 'auto',
            headerGap: '0.75rem'
        },
        shadowPolicy: 'none',
        verticalRhythm: 'standard',
        hero: {
            template: 'proof_first',
            disposition: 'content_left',
            maxTrustBullets: 4,
            maxPrimaryCtas: 1,
            allowSecondaryCta: false,
            eyebrowStyle: 'plain',
            emphasis: 'proof'
        },
        allowedShells: ['plain', 'panel', 'band', 'feature'],
        shellUsage: {
            hero: 'plain',
            trust: 'band',
            faq: 'panel',
            comparison: 'feature',
            default: 'plain'
        }
    },
    compatibility: {
        recommendedFamilies: ['local_trust'],
        pageCompositions: ['local_dense', 'trust_first'],
        cadencePatterns: ['alternating', 'calm'],
        preferredHeroTreatments: ['proof_first', 'split'],
        densityBias: 'standard'
    }
};