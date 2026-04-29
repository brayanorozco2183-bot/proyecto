import { validateComposition } from './validateComposition.js';
import { generateLossReport, NormalizationLossEntry } from './normalizationLoss.js';

export interface VisualQualityReport {
    pageId: string;
    overallScore: number; // 0-100
    compositionValid: boolean;
    compositionAlerts: string[];
    normalizationLoss: NormalizationLossEntry[];
    recommendations: string[];
}

export function generateVisualQualityReport(page: any, proposedBlueprint: any): VisualQualityReport {
    const composition = validateComposition(page);
    const loss = generateLossReport(proposedBlueprint.sections || [], page.sections || []);

    let score = 100;
    score -= composition.alerts.length * 10;
    score -= loss.length * 4;

    const recommendations: string[] = [];
    if (!composition.isValid) {
        recommendations.push('Review section rhythm and closing hierarchy: the page feels visually unbalanced.');
    }
    if (composition.alerts.some(a => a.startsWith('CARD_MONOTONY'))) {
        recommendations.push('Break the sequence of card-heavy blocks with a stronger contrast section or a different shell.');
    }
    if (composition.alerts.some(a => a.startsWith('BARE_MAP'))) {
        recommendations.push('Upgrade the map block to a higher-presence variant with supporting copy and CTA support.');
    }
    if (composition.alerts.some(a => a.startsWith('WEAK_CLOSURE'))) {
        recommendations.push('Strengthen the final CTA so the page finishes with clearer premium intent and better conversion pressure.');
    }
    if (loss.length > 2) {
        recommendations.push('High normalization loss: agent proposals are being overridden by technical spec constraints.');
    }

    return {
        pageId: page.id || 'unknown',
        overallScore: Math.max(0, score),
        compositionValid: composition.isValid,
        compositionAlerts: composition.alerts,
        normalizationLoss: loss,
        recommendations
    };
}
