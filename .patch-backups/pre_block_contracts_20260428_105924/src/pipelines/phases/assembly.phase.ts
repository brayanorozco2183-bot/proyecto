import { renderPage } from '../../design-system/procedural-engine.js';
import type { GeneratedSection } from '../../design-system/procedural-engine.js';
import { buildPageBreadcrumbs, mapBreadcrumbsForRenderer } from '../../seo/breadcrumbFactory.js';
import { guardRenderedHtml } from '../../utils/renderOutputGuard.js';
import { editorialPostProcessHtml } from '../../utils/editorialPostProcessor.js';
import { applyFinalHtmlDomainGuards } from '../../guards/index.js';
import { finalizeRenderedPageSemantics } from '../../utils/semanticContentGuard.js';
import { 
    GenerationMission, 
    NormalizedContext, 
    PagePlan, 
    ContentDraft, 
    RenderedPage 
} from '../../types/pipeline_v2.js';
import { ResolvedPageRenderPlan } from '../../types/design.js';

export class AssemblyPhase {
    async run(draft: ContentDraft, plan: PagePlan, context: NormalizedContext, mission: GenerationMission, resolvedPlan: ResolvedPageRenderPlan): Promise<RenderedPage> {
        console.log(`[Phase 8] Final procedural composition...`);

        const generatedSections: GeneratedSection[] = draft.blocks.map(block => ({
            sectionId: block.id,
            id: block.id,
            blockType: ((block as any).type || block.metadata?.block_type || '') as any,
            type: ((block as any).type || block.metadata?.block_type || '') as any,
            html: block.html,
            h2: block.h2,
            metadata: block.metadata
        }));

        const breadcrumbs = buildPageBreadcrumbs(mission, plan);
        const mappedBreadcrumbs = mapBreadcrumbsForRenderer(breadcrumbs);

        const renderedHtml = renderPage({
            niche: context.niche,
            city: context.city,
            h1: draft.h1,
            hero: plan.hero,
            meta: {
                title: draft.meta_title,
                description: draft.meta_description,
                seo: (draft.metadata as any)?.seo
            },
            sections: generatedSections,
            designDNA: plan.design?.dna,
            layoutContract: plan.layoutContract,
            business: context.clean_nap,
            breadcrumbs: mappedBreadcrumbs,
            composition: (plan.pageProfile as any)?.page_composition || 'conversion',
            resolvedPlan
        });

        const santizedHtml = applyFinalHtmlDomainGuards(renderedHtml, {
            niche: context.niche,
            city: context.city,
            businessName: context.clean_nap?.business_name,
            phone: context.clean_nap?.phone,
            canonical: (draft.metadata as any)?.seo?.canonical
        }).html;

        const firstGuard = guardRenderedHtml(renderedHtml, santizedHtml);
        const editorialHtml = editorialPostProcessHtml(firstGuard.html, {
            city: context.city,
            brand: context.clean_nap?.business_name || '',
            phone: context.clean_nap?.phone || '',
            maxBrandMentions: plan.contentRules?.maxBrandMentionsPerSection || 4,
            niche: context.niche
        });

        const polishedHtml = applyFinalHtmlDomainGuards(editorialHtml, {
            city: context.city,
            niche: context.niche,
            businessName: context.clean_nap?.business_name,
            phone: context.clean_nap?.phone,
            canonical: (draft.metadata as any)?.seo?.canonical
        }).html;

        // IMPORTANT: the last postprocessors can introduce broken copy; guard again after polish.
        const finalSanitizedHtml = applyFinalHtmlDomainGuards(polishedHtml, {
            niche: context.niche,
            city: context.city,
            businessName: context.clean_nap?.business_name,
            phone: context.clean_nap?.phone,
            canonical: (draft.metadata as any)?.seo?.canonical
        }).html;
        const finalGuard = guardRenderedHtml(polishedHtml, finalSanitizedHtml);

        const page = finalizeRenderedPageSemantics({
            html: finalGuard.html,
            metadata: {
                qaScore: 0,
                niche: context.niche,
                city: context.city,
                output_path: '',
                technical_passed: true,
                editorial_passed: true,
                validation_errors: [],
                seo: (draft.metadata as any)?.seo
            } as any
        }, { mission, pagePlan: plan, context, canonical: (draft.metadata as any)?.seo?.canonical });

        return page;
    }
}
