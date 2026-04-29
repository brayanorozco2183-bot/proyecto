export const conversionHeavyFamily = {
    id: 'conversion_heavy',
    typography: {
        heroTitleScale: 'display-lg',
        h2Scale: 'heading-lg',
        bodyScale: 'body-md',
        measure: 'medium',
        letterSpacingPolicy: 'neutral'
    },
    spacing: {
        sectionY: 'md',
        cardGap: 'md',
        contentGap: 'md'
    },
    surfaces: {
        sectionShells: {
            hero: 'panel',
            trust: 'band',
            cta: 'panel',
            faq: 'panel',
            default: 'panel'
        },
        defaultCardStyle: 'elevated',
        allowedCardStyles: ['elevated', 'outlined', 'flat']
    },
    layoutRules: {
        preferredFlowsByBlockType: {
            hero: ['split', 'stack'],
            cta_panel: ['centered', 'split'],
            trust: ['split', 'stack'],
            faq: ['accordion', 'stack'],
            checklist: ['stack', 'split']
        },
        forbiddenCombinations: [
            { blockType: 'cta_panel', flow: 'zigzag' },
            { blockType: 'hero', flow: 'asymmetric' }
        ],
        cadenceBehavior: {
            default: 'tight_scan',
            ctaFrequency: 'high'
        }
    },
    ornament: {
        eyebrowStyle: 'badge-strong',
        dividerStyle: 'none',
        backgroundAccentPolicy: 'cta-zones-only'
    }
};
