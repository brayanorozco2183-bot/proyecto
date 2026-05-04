import { buildSeoMetaFallback, buildDeterministicJsonLd } from '../fallbacks/seo/index.js';
import type { ContentDraft, NormalizedContext, PagePlan, GenerationMission } from '../types/pipeline_v2.js';

export interface SeoGuardResult {
    h1: string;
    meta_title: string;
    meta_description: string;
    jsonLd: string;
    fallbackUsed: boolean;
    groupId?: string;
}

export class SeoPremiumGuard {
    static refine(draft: ContentDraft, context: NormalizedContext, plan: PagePlan, mission?: GenerationMission): SeoGuardResult {
        const niche = context.niche;
        const city = context.city;
        const neighborhood = context.geoData?.neighborhoods?.[0] || '';
        
        // 1. Detectar si el SEO de la IA es pobre
        const rawTitle = draft.meta_title || plan.meta_title || '';
        const rawDesc = draft.meta_description || plan.meta_description || '';
        
        const isPoor = rawTitle.length < 20 || 
                       rawDesc.length < 50 || 
                       rawTitle.toLowerCase().includes('title here') ||
                       !rawTitle.toLowerCase().includes(city.toLowerCase());

        if (isPoor) {
            console.log(`[SeoGuard] ⚠️ Poor SEO detected for ${city}. Reason: ${rawTitle.length < 20 ? 'Title too short' : (!rawTitle.toLowerCase().includes(city.toLowerCase()) ? 'Missing city' : 'Generic content')}`);
        } else {
            console.log(`[SeoGuard] ✅ SEO Quality passed for ${city}.`);
        }

        // 2. Obtener el Fallback de tus 100 variaciones
        const fallback = buildSeoMetaFallback({
            niche,
            city,
            neighborhood,
            intent: plan.intentModel?.primaryIntent || 'generic',
            pageType: plan.intentModel?.pageType,
            serviceKeyword: plan.intentModel?.primaryKeyword,
            seedHint: plan.h1
        });

        const finalH1 = draft.h1 || plan.h1 || fallback.h1;
        const finalTitle = isPoor ? fallback.title : rawTitle;
        const finalDesc = isPoor ? fallback.description : rawDesc;

        // 3. Generar JSON-LD Determinista
        const jsonLd = buildDeterministicJsonLd({
            businessName: context.clean_nap?.business_name || 'Servicio Profesional',
            city,
            neighborhood,
            niche,
            schemaType: fallback.schemaType,
            url: mission?.siteConfig?.baseUrl || 'https://serviciolocal.es',
            phone: context.clean_nap?.phone,
            description: finalDesc,
            faq: draft.blocks
                .filter(b => b.type === 'faq' || b.metadata.block_type === 'faq')
                .map(b => ({
                    question: b.h2,
                    answer: b.html.replace(/<[^>]*>?/gm, '').slice(0, 300) // Limpiar HTML para el JSON
                }))
        });

        return {
            h1: finalH1,
            meta_title: finalTitle,
            meta_description: finalDesc,
            jsonLd,
            fallbackUsed: isPoor,
            groupId: fallback.groupId
        };
    }
}
