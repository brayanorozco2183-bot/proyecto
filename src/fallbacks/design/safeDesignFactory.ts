import { resolveVisualMasterclass } from '../masterclass/index.js';
import type { DesignSeed } from '../../types/pipeline_v2.js';

export class SafeDesignFactory {
    static getSafeSeed(niche: string = 'generic', city: string = '', seed?: string): DesignSeed {
        // Mapeo inteligente de Estilo según el Nicho
        let preferredStyle = 'clean_minimal__atlas';
        const n = niche.toLowerCase();

        if (n.includes('cerra') || n.includes('urgen')) preferredStyle = 'technical_navy__atlas';
        if (n.includes('electri') || n.includes('clima')) preferredStyle = 'commercial_charcoal__metro';
        if (n.includes('refor') || n.includes('carpin')) preferredStyle = 'premium_gold__atlas';
        if (n.includes('pinto') || n.includes('fonta')) preferredStyle = 'editorial_ink__atlas';
        if (n.includes('jardi')) preferredStyle = 'local_trust_green__atlas';

        const mc = resolveVisualMasterclass({
            masterclassId: preferredStyle,
            seed: seed || `${niche}:${city}`
        });

        return {
            compositionFamily: mc.visualDna.compositionFamily,
            heroVariant: mc.visualDna.heroVariant,
            sectionRhythm: 'alternating',
            cardStyle: mc.visualDna.cardStyle,
            densityProfile: mc.visualDna.density,
            proofStyle: 'distributed',
            ctaModel: 'distributed',
            asymmetryLevel: 0.1,
            pageSkeleton: 'conversion-funnel'
        };
    }

    static getSafeTokens(niche: string = 'generic', city: string = '', seed?: string) {
        const n = niche.toLowerCase();
        let preferredStyle = 'clean_minimal__atlas';

        if (n.includes('cerra') || n.includes('urgen')) preferredStyle = 'technical_navy__atlas';
        if (n.includes('electri') || n.includes('clima')) preferredStyle = 'commercial_charcoal__metro';
        if (n.includes('refor') || n.includes('carpin')) preferredStyle = 'premium_gold__atlas';
        if (n.includes('pinto') || n.includes('fonta')) preferredStyle = 'editorial_ink__atlas';
        if (n.includes('jardi')) preferredStyle = 'local_trust_green__atlas';

        const mc = resolveVisualMasterclass({
            masterclassId: preferredStyle,
            seed: seed || `${niche}:${city}`
        });

        return {
            colors: mc.visualDna.colors,
            typography: mc.visualDna.typography,
            radius: {
                button: '4px',
                card: '8px'
            }
        };
    }
}
