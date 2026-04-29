export const localTrustFamily = {
    id: 'local_trust',
    typography: {
        heroTitleScale: 'display-lg',
        h2Scale: 'heading-lg',
        bodyScale: 'body-md',
        measure: 'medium',
        letterSpacingPolicy: 'neutral'
    },
    spacing: {
        sectionY: 'lg',
        cardGap: 'md',
        contentGap: 'md'
    },
    surfaces: {
        sectionShells: {
            coverage: 'band',
            trust: 'panel',
            map: 'band',
            faq: 'panel',
            directory: 'panel',
            default: 'plain'
        },
        defaultCardStyle: 'outlined',
        allowedCardStyles: ['outlined', 'elevated', 'flat']
    },
    layoutRules: {
        preferredFlowsByBlockType: {
            map: ['split', 'stack'],
            coverage: ['stack', 'split'],
            faq: ['accordion', 'stack'],
            trust: ['cards', 'split'],
            directory: ['stack']
        },
        forbiddenCombinations: [
            { blockType: 'map', flow: 'zigzag' },
            { blockType: 'directory', flow: 'asymmetric' }
        ],
        cadenceBehavior: {
            default: 'trust_rhythm',
            repeatTrustSignals: true
        }
    },
    ornament: {
        eyebrowStyle: 'trust-pill',
        dividerStyle: 'soft-line',
        backgroundAccentPolicy: 'trust-bands'
    }
};
