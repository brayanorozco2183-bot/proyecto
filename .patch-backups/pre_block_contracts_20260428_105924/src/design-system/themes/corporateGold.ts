import type { DesignSystemTheme } from '../types.js';
import {
    DEFAULT_BREAKPOINTS,
    OFFICIAL_SHELL_TOKENS,
    SECTION_VERTICAL_SPACING,
    corporateRadius,
    corporateShadow,
    assertiveMotion,
    corporateGold,
    modernTypography
} from '../tokens/index.js';

export const corporateGoldTheme: DesignSystemTheme = {
    id: 'corporateGold',
    name: 'Corporate Gold',
    description: 'Sistema de diseño premium con paleta corporativa azul y dorado.',
    tokens: {
        colors: corporateGold,
        typography: modernTypography,
        spacing: SECTION_VERTICAL_SPACING,
        shells: OFFICIAL_SHELL_TOKENS,
        radius: corporateRadius,
        shadow: corporateShadow,
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
            template: 'split',
            disposition: 'content_left',
            maxTrustBullets: 3,
            maxPrimaryCtas: 1,
            allowSecondaryCta: true,
            eyebrowStyle: 'plain',
            emphasis: 'brand'
        },
        allowedShells: ['plain', 'panel', 'band', 'comparison'],
        shellUsage: {
            hero: 'plain',
            trust: 'band',
            faq: 'panel',
            comparison: 'comparison',
            default: 'plain'
        }
    },
    compatibility: {
        recommendedFamilies: ['conversion_heavy', 'technical_grid'],
        pageCompositions: ['conversion', 'editorial'],
        cadencePatterns: ['alternating', 'contrast-bursts'],
        preferredHeroTreatments: ['split', 'cta_heavy'],
        densityBias: 'standard'
    }
};
