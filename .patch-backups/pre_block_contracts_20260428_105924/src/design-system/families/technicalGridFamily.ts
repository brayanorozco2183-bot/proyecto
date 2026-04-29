import { FamilyDefinition } from './types.js';

export const technicalGridFamily: FamilyDefinition = {
    id: 'technical_grid',
    typography: {
        heroTitleScale: 'display-md',
        h2Scale: 'heading-md',
        bodyScale: 'body-md',
        measure: 'wide',
        letterSpacingPolicy: 'precision'
    },
    spacing: {
        sectionY: 'lg',
        cardGap: 'sm',
        contentGap: 'md'
    },
    surfaces: {
        sectionShells: {
            checklist: 'panel',
            table: 'plain',
            specs: 'panel',
            faq: 'plain',
            default: 'plain'
        },
        defaultCardStyle: 'outlined',
        allowedCardStyles: ['outlined', 'flat']
    },
    layoutRules: {
        preferredFlowsByBlockType: {
            checklist: ['stack', 'split'],
            table: ['stack'],
            specs: ['split', 'stack'],
            comparison: ['split'],
            faq: ['accordion', 'stack']
        },
        forbiddenCombinations: [
            { blockType: 'table', flow: 'zigzag' },
            { blockType: 'checklist', flow: 'asymmetric' }
        ],
        cadenceBehavior: {
            default: 'modular_grid',
            keepDensityControlled: true
        }
    },
    ornament: {
        eyebrowStyle: 'mono-label',
        dividerStyle: 'grid-line',
        backgroundAccentPolicy: 'minimal-grid'
    }
};