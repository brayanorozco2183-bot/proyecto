import { buildCoverageCopy } from '../coverage/index.js';
import type { GenerationMission, NormalizedContext, PagePlan } from '../../types/pipeline_v2.js';

export interface GeoLink {
    anchor: string;
    url: string;
    distance?: string;
}

export class GeoLinkFallbackFactory {
    static build(context: NormalizedContext, mission: GenerationMission, plan: PagePlan): { h2: string, intro: string, links: GeoLink[] } {
        const currentCity = context.city;
        const currentNiche = context.niche;
        const clusterGeo = mission.cluster_data?.geo || [];
        const neighbors = clusterGeo.filter(loc => loc.name.toLowerCase() !== currentCity.toLowerCase());

        // Mapeo de Tono según la intención de la página
        let preferredTone: any = 'proximity';
        const intent = plan.intentModel?.primaryIntent;
        const pageType = plan.intentModel?.pageType;

        if (intent === 'transactional' || pageType === 'urgent') preferredTone = 'urgent';
        if (pageType === 'neighborhood') preferredTone = 'neighborhood';
        if (intent === 'commercial') preferredTone = 'commercial';

        const links: GeoLink[] = [];
        let h2 = '';
        let intro = '';

        for (let i = 0; i < neighbors.length; i++) {
            const loc = neighbors[i];
            const copy = buildCoverageCopy({
                niche: currentNiche,
                city: currentCity,
                locName: loc.name,
                tone: preferredTone,
                seed: `${plan.h1}:${loc.name}`
            });

            if (i === 0) {
                h2 = copy.h2;
                intro = copy.intro;
            }

            links.push({
                anchor: copy.anchor,
                url: loc.sub_path || `/${loc.name.toLowerCase().replace(/\s+/g, '-')}`
            });

            if (links.length >= 8) break;
        }

        return { h2, intro, links };
    }
}
