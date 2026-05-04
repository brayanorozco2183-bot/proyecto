import {
    DesignTokens,
    ArtDirection,
    TypographyScale,
    RadiusMode,
    ShadowMode,
    SpacingMode,
    DesignScales
} from '../types.js';
import { Random } from './colors.js';
import { DEFAULT_RADIUS, DEFAULT_SPACING, DEFAULT_SHADOWS, DEFAULT_TRANSITIONS } from '../tokens/index.js';

export const COMPATIBILITY_MATRIX: Record<ArtDirection, {
    allowedTypography: TypographyScale[];
    allowedRadius: RadiusMode[];
    allowedShadows: ShadowMode[];
    allowedSpacing: SpacingMode[];
    heroType: 'EDITORIAL' | 'PREMIUM' | 'URGENT' | 'TECHNICAL' | 'LOCAL';
    footerType: 'EDITORIAL' | 'DIRECTORY' | 'ULTRA_LIGHT' | 'UTILITY';
}> = {
    premium_split: {
        allowedTypography: ['MINOR_THIRD', 'MAJOR_THIRD'],
        allowedRadius: ['SOFT', 'MODERN'],
        allowedShadows: ['MODERN_FLOATING', 'DEEP_DRAMATIC'],
        allowedSpacing: ['AIRY', 'EDITORIAL'],
        heroType: 'PREMIUM',
        footerType: 'DIRECTORY'
    },
    conversion_clean: {
        allowedTypography: ['MAJOR_SECOND', 'MINOR_THIRD'],
        allowedRadius: ['SHARP', 'SUBTLE'],
        allowedShadows: ['FLAT', 'SUBTLE_LIFT'],
        allowedSpacing: ['COMPACT', 'COMFORTABLE'],
        heroType: 'URGENT',
        footerType: 'UTILITY'
    },
    technical_grid: {
        allowedTypography: ['MINOR_SECOND', 'MAJOR_SECOND'],
        allowedRadius: ['SHARP', 'SUBTLE'],
        allowedShadows: ['FLAT', 'BRUTAL_HARD'],
        allowedSpacing: ['COMPACT'],
        heroType: 'TECHNICAL',
        footerType: 'ULTRA_LIGHT'
    },
    editorial_dark: {
        allowedTypography: ['PERFECT_FOURTH', 'GOLDEN_RATIO'],
        allowedRadius: ['SHARP'],
        allowedShadows: ['FLAT'],
        allowedSpacing: ['EDITORIAL', 'AIRY'],
        heroType: 'EDITORIAL',
        footerType: 'EDITORIAL'
    },
    local_trust: {
        allowedTypography: ['MINOR_THIRD', 'MAJOR_THIRD'],
        allowedRadius: ['MODERN', 'SOFT'],
        allowedShadows: ['SUBTLE_LIFT'],
        allowedSpacing: ['COMFORTABLE'],
        heroType: 'LOCAL',
        footerType: 'DIRECTORY'
    },
    minimal_luxury: {
        allowedTypography: ['MINOR_THIRD'],
        allowedRadius: ['SUBTLE', 'MODERN'],
        allowedShadows: ['SUBTLE_LIFT', 'MODERN_FLOATING'],
        allowedSpacing: ['COMFORTABLE'],
        heroType: 'LOCAL',
        footerType: 'ULTRA_LIGHT'
    },
    service_magazine: {
        allowedTypography: ['MINOR_THIRD'],
        allowedRadius: ['SOFT'],
        allowedShadows: ['MODERN_FLOATING'],
        allowedSpacing: ['AIRY'],
        heroType: 'EDITORIAL',
        footerType: 'EDITORIAL'
    },
    authority_modern: {
        allowedTypography: ['MAJOR_THIRD'],
        allowedRadius: ['MODERN'],
        allowedShadows: ['DEEP_DRAMATIC'],
        allowedSpacing: ['COMFORTABLE'],
        heroType: 'PREMIUM',
        footerType: 'DIRECTORY'
    },
    mixed_industrial: {
        allowedTypography: ['MAJOR_SECOND', 'MINOR_THIRD'],
        allowedRadius: ['SHARP'],
        allowedShadows: ['BRUTAL_HARD'],
        allowedSpacing: ['COMPACT'],
        heroType: 'TECHNICAL',
        footerType: 'UTILITY'
    }
};

export function generateTokens(rng: Random, artDirection: ArtDirection): DesignTokens {
    const matrix = COMPATIBILITY_MATRIX[artDirection];

    const baseRadius = rng.pick(matrix.allowedRadius);

    const scales: DesignScales = {
        typography: rng.pick(matrix.allowedTypography),
        spacing: rng.pick(matrix.allowedSpacing),
        radiusCard: baseRadius,
        radiusButton: baseRadius === 'SHARP' ? 'SHARP' : 'PILL',
        radiusSurface: baseRadius === 'SOFT' ? 'SOFT' : 'MODERN',
        shadows: rng.pick(matrix.allowedShadows),
        motion: {
            duration: artDirection === 'conversion_clean' ? '0.15s' : '0.4s',
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
        }
    };

    const typography = generateTypography(rng, artDirection, scales.typography);

    return {
        artDirection,
        colors: null as any, // Generated in generator.ts
        scales,
        layout: {
            baseCadence: generateCadence(artDirection, rng),
            heroType: matrix.heroType,
            footerType: matrix.footerType,
            contentDensity: artDirection === 'editorial_dark' ? 'AIRY' : 'BALANCED',
            readingWidth: artDirection === 'editorial_dark' ? 'NARROW' : 'STANDARD',
            ctaStrategy: artDirection === 'conversion_clean' ? 'AGGRESIVE' : 'POLITE'
        },
        typography,
        radius: {
            card: scales.radiusCard === 'SHARP' ? '0' : scales.radiusCard === 'SOFT' ? '1.5rem' : '0.75rem',
            button: scales.radiusButton === 'PILL' ? '2rem' : '0.5rem',
            section: '0'
        },
        spacing: {
            sectionY: scales.spacing === 'AIRY' ? '8rem' : scales.spacing === 'COMPACT' ? '3rem' : '5rem',
            gap: '2.5rem',
            container: '1280px',
            reading: '75ch'
        },
        shadows: {
            soft: scales.shadows === 'FLAT' ? 'none' : DEFAULT_SHADOWS.soft,
            lg: scales.shadows === 'DEEP_DRAMATIC' ? '0 30px 100px rgba(0,0,0,0.2)' : DEFAULT_SHADOWS.lg,
            glow: DEFAULT_SHADOWS.glow
        },
        transitions: DEFAULT_TRANSITIONS,
        responsiveRules: {
            containerMaxWidth: artDirection === 'editorial_dark' ? '1000px' : '1200px',
            gridColumns: 12,
            baseGutter: 'clamp(1rem, 3vw, 2.5rem)'
        }
    };
}

function generateCadence(direction: ArtDirection, rng: Random) {
    const pool: any[] = ['NEUTRAL', 'ALT'];
    if (direction === 'premium_split' || direction === 'editorial_dark') pool.push('EMPHASIS');
    if (direction === 'technical_grid' || direction === 'conversion_clean') pool.push('BENTO');

    const cadence = [];
    for (let i = 0; i < 6; i++) {
        cadence.push(rng.pick(pool));
    }
    return cadence;
}

function generateTypography(rng: Random, direction: ArtDirection, scale: TypographyScale) {
    const fonts = {
        modern: { head: '"Plus Jakarta Sans", sans-serif', body: '"Inter", sans-serif' },
        classic: { head: '"Playfair Display", serif', body: '"Source Sans Pro", sans-serif' },
        tech: { head: '"Space Grotesk", sans-serif', body: '"Space Mono", monospace' },
        elegant: { head: '"Cormorant Garamond", serif', body: '"Plus Jakarta Sans", sans-serif' }
    };

    let selected = fonts.modern;
    if (direction === 'premium_split' || direction === 'authority_modern') selected = fonts.elegant;
    if (direction === 'technical_grid') selected = fonts.tech;
    if (direction === 'editorial_dark' || direction === 'minimal_luxury') selected = fonts.classic;

    const scaleFactors: Record<TypographyScale, number> = {
        MINOR_SECOND: 1.067,
        MAJOR_SECOND: 1.125,
        MINOR_THIRD: 1.200,
        MAJOR_THIRD: 1.250,
        PERFECT_FOURTH: 1.333,
        GOLDEN_RATIO: 1.618
    };

    const factor = scaleFactors[scale];
    
    return {
        fontDisplay: selected.head,
        fontBody: selected.body,
        h1: `calc(1rem * ${factor * factor * factor})`,
        h2: `calc(1rem * ${factor * factor})`,
        h3: `calc(1rem * ${factor})`,
        body: '1rem'
    };
}
