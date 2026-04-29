import { renderPage } from '../../design-system/procedural-engine.js';
import type { GeneratedSection } from '../../design-system/procedural-engine.js';
import { buildPageBreadcrumbs, mapBreadcrumbsForRenderer } from '../../seo/breadcrumbFactory.js';
import { guardRenderedHtml } from '../../utils/renderOutputGuard.js';
import { editorialPostProcessHtml } from '../../utils/editorialPostProcessor.js';
import { applyFinalHtmlDomainGuards } from '../../guards/index.js';
import { finalizeRenderedPageSemantics } from '../../utils/semanticContentGuard.js';
import { applyPageCoherenceCleanup } from '../../utils/pageCoherenceGuard.js';
import { buildPublicFallbackParagraphs, buildInternalFallbackMeta } from '../../utils/fallbackQuality.js';
import { 
    GenerationMission, 
    NormalizedContext, 
    PagePlan, 
    ContentDraft, 
    RenderedPage 
} from '../../types/pipeline_v2.js';
import { ResolvedPageRenderPlan } from '../../types/design.js';


function escapeHtml(value: unknown): string {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function renderEmergencyHtml(input: {
    draft?: ContentDraft;
    plan?: PagePlan;
    context?: NormalizedContext;
    mission?: GenerationMission;
    error: unknown;
}): string {
    const city = escapeHtml(input.context?.city || input.mission?.city || 'tu zona');
    const niche = escapeHtml(input.context?.niche || input.mission?.niche || 'servicio local');
    const h1 = escapeHtml((input.draft as any)?.h1 || input.plan?.h1 || `${niche} en ${city}`);
    const title = escapeHtml((input.draft as any)?.meta_title || h1);
    const description = escapeHtml((input.draft as any)?.meta_description || `Página informativa de ${niche} en ${city}.`);
    const businessName = escapeHtml(input.context?.clean_nap?.business_name || input.mission?.local_nap?.business_name || 'Servicio local');
    const phone = escapeHtml(input.context?.clean_nap?.phone || input.mission?.local_nap?.phone || '');
    const blocks = (input.draft?.blocks || [])
        .slice(0, 12)
        .map((block: any, index: number) => {
            const heading = escapeHtml(block.h2 || block.metadata?.heading || block.metadata?.block_type || 'Información del servicio');
            const rawHtml = String(block.html || '').trim();
            const alreadySectioned = /<section\b/i.test(rawHtml) || /section-shell|semantic-section|block-section/i.test(rawHtml);
            const content = rawHtml || buildPublicFallbackParagraphs({ niche, city, blockType: block.metadata?.block_type || 'content' }).map((paragraph) => '<p>' + escapeHtml(paragraph) + '</p>').join('');
            if (alreadySectioned) {
                return '<div class="section section--embedded" data-fallback-block="' + index + '">' + content + '</div>';
            }
            return '<section class="section"><div class="section-kicker">' + String(index + 1).padStart(2, '0') + '</div><h2>' + heading + '</h2>' + content + '</section>';
        })
        .join('\n');

    return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <style>
    :root{--primary:#0f766e;--primary-rgb:15,118,110;--text:#0f172a;--muted:#475569;--border:rgba(148,163,184,.18);--surface:#fff;--shadow:0 18px 50px rgba(15,23,42,.08)}
    *{box-sizing:border-box} html{scroll-behavior:smooth} body{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;margin:0;background:radial-gradient(circle at top left,rgba(15,118,110,.10),transparent 28%),linear-gradient(180deg,#f8fafc,#eef4f8);color:var(--text);line-height:1.65}
    main{max-width:1180px;margin:0 auto;padding:28px 18px 72px}.hero,.section{background:rgba(255,255,255,.92);border:1px solid rgba(255,255,255,.86);border-radius:28px;padding:clamp(1.25rem,3vw,2.6rem);margin:18px 0;box-shadow:var(--shadow);overflow:hidden}.hero{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(280px,.9fr);gap:clamp(1.2rem,3vw,2.5rem);align-items:center;background:radial-gradient(circle at top right,rgba(15,118,110,.14),transparent 32%),#fff}.hero__panel{display:grid;gap:1rem}.hero__eyebrow,.section-kicker{display:inline-flex;width:max-content;max-width:100%;border-radius:999px;background:rgba(var(--primary-rgb),.09);border:1px solid rgba(var(--primary-rgb),.16);color:var(--primary);font-weight:850;font-size:.78rem;letter-spacing:.08em;text-transform:uppercase;padding:.45rem .75rem}.hero__card{border-radius:22px;background:#0f172a;color:#fff;padding:1.35rem;box-shadow:0 22px 50px rgba(2,6,23,.20)}.hero__card p{color:rgba(255,255,255,.76);margin:.35rem 0 0}h1{font-size:clamp(2.1rem,5.3vw,4.2rem);line-height:1.02;margin:0 0 14px;letter-spacing:-.045em;max-width:13ch}h2{font-size:clamp(1.55rem,3vw,2.25rem);line-height:1.12;margin:0 0 12px;letter-spacing:-.025em}h3{line-height:1.18;margin:0 0 .55rem}p{color:var(--muted);margin:0 0 1rem}.cta{display:inline-flex;align-items:center;justify-content:center;width:max-content;min-height:3.3rem;padding:.85rem 1.35rem;border-radius:999px;background:linear-gradient(135deg,var(--primary),#064e49);color:white;text-decoration:none;font-weight:850;box-shadow:0 16px 34px rgba(var(--primary-rgb),.24)}.trust-strip{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.75rem;margin-top:1rem}.trust-pill{padding:.8rem;border:1px solid var(--border);border-radius:16px;background:#fff;font-weight:750}.notice{display:none}.section--embedded>section{margin:0!important}.section--embedded{padding:0!important;background:transparent!important;border:0!important;box-shadow:none!important}.semantic-items,.services-grid,.trust-layout__grid,.faq-columns{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:1rem}.semantic-card,.service-card,.faq-card,.proof-card{border:1px solid var(--border);border-radius:18px;background:#fff;padding:1.15rem;box-shadow:0 10px 24px rgba(15,23,42,.05)}.section-cta,.cta-panel__action{margin-top:1rem}.cta-link{display:inline-flex;align-items:center;justify-content:center;min-height:3.1rem;border-radius:999px;background:var(--primary);color:#fff!important;text-decoration:none;font-weight:850;padding:.75rem 1.2rem}.map-frame-wrapper{min-height:360px!important;padding-bottom:0!important;height:360px!important}.map-frame-wrapper iframe{position:absolute;inset:0;width:100%;height:100%}.mobile-safe-cta{display:none}@media(max-width:760px){body{padding-bottom:5.4rem}main{padding-inline:12px}.hero{grid-template-columns:1fr}.trust-strip{grid-template-columns:1fr}.hero,.section{border-radius:20px}.cta,.cta-link{width:100%}.mobile-safe-cta{display:flex;position:fixed;left:.8rem;right:.8rem;bottom:.8rem;z-index:99;align-items:center;justify-content:space-between;gap:.8rem;padding:.75rem .85rem;border-radius:18px;background:#0f172a;color:#fff;box-shadow:0 18px 44px rgba(2,6,23,.32)}.mobile-safe-cta a{display:grid;place-items:center;width:3rem;height:3rem;border-radius:14px;background:var(--primary);color:#fff;text-decoration:none}}
  </style>
</head>
<body>
  <main>
    <section class="hero">
      <div class="hero__panel">
        <span class="hero__eyebrow">${businessName}</span>
        <h1>${h1}</h1>
        <p>${description}</p>
        ${phone ? `<a class="cta" data-cta="primary" href="tel:${phone}">Llamar ahora: ${phone}</a>` : `<a class="cta" data-cta="primary" href="#contacto">Solicitar orientación</a>`}
        <div class="trust-strip" aria-label="Señales de confianza">
          <div class="trust-pill">Presupuesto claro</div>
          <div class="trust-pill">Cobertura en ${city}</div>
          <div class="trust-pill">Atención directa</div>
        </div>
      </div>
      <aside class="hero__card">
        <strong>${niche}</strong>
        <p>Información organizada para orientar el alcance del servicio, explicar el proceso y facilitar una consulta clara.</p>
      </aside>
    </section>
    ${blocks}
  </main>
  <footer id="contacto" class="section"><h2>Contacto</h2><p>Describe brevemente el caso para orientar el alcance del trabajo en ${city}.</p></footer>
  ${phone ? `<div class="mobile-safe-cta"><span><strong>Llamar ahora</strong><br>${niche} en ${city}</span><a href="tel:${phone}" aria-label="Llamar">📞</a></div>` : ''}
</body>
</html>`;
}

export class AssemblyPhase {
    async run(draft: ContentDraft, plan: PagePlan, context: NormalizedContext, mission: GenerationMission, resolvedPlan: ResolvedPageRenderPlan): Promise<RenderedPage> {
        const startedAt = Date.now();
        console.log(`[Phase 8] START Final procedural composition...`);

        try {
            const generatedSections: GeneratedSection[] = (draft.blocks || []).map(block => ({
                sectionId: block.id,
                id: block.id,
                blockType: ((block as any).type || block.metadata?.block_type || '') as any,
                type: ((block as any).type || block.metadata?.block_type || '') as any,
                html: block.html,
                h2: block.h2,
                metadata: block.metadata
            }));

            console.log(`[Phase 8] Sections prepared: ${generatedSections.length}`);

            const breadcrumbs = buildPageBreadcrumbs({
                baseUrl: mission.siteConfig?.baseUrl || 'https://serviciosprofesionales.pro',
                city: mission.city || context.city,
                niche: mission.niche || context.niche,
                pageTitle: (plan as any).h1 || (draft as any).h1 || `${context.niche} en ${context.city}`,
                pageType: plan.intentModel?.pageType,
                pageUrlOverride: (draft.metadata as any)?.seo?.canonical,
            });
            const mappedBreadcrumbs = mapBreadcrumbsForRenderer(breadcrumbs);

            const renderedHtml = renderPage({
                niche: context.niche,
                city: context.city,
                h1: (draft as any).h1,
                meta: {
                    title: (draft as any).meta_title,
                    description: (draft as any).meta_description,
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

            console.log(`[Phase 8] Raw HTML composed: ${renderedHtml.length} chars`);

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

            const coherence = applyPageCoherenceCleanup(finalGuard.html, {
                niche: context.niche,
                city: context.city,
                businessName: context.clean_nap?.business_name,
                phone: context.clean_nap?.phone,
                canonical: (draft.metadata as any)?.seo?.canonical,
                facts: (mission as any)?.facts || (mission as any)?.local_nap || {}
            });
            if (coherence.issues.length) {
                console.log('[Phase 8] Page coherence cleanup applied: ' + coherence.issues.map(i => i.code).join(', '));
            }

            const page = finalizeRenderedPageSemantics({
                html: coherence.html,
                metadata: {
                    qaScore: 0,
                    niche: context.niche,
                    city: context.city,
                    output_path: '',
                    technical_passed: true,
                    editorial_passed: true,
                    validation_errors: coherence.issues.map(i => '[PAGE_COHERENCE] ' + i.code + ': ' + i.message),
                    page_coherence_issues: coherence.issues,
                    seo: (draft.metadata as any)?.seo,
                    assembly_mode: 'procedural'
                } as any
            }, { mission, pagePlan: plan, context, canonical: (draft.metadata as any)?.seo?.canonical });

            console.log(`[Phase 8] END Final procedural composition in ${Date.now() - startedAt}ms | final HTML: ${page.html.length} chars`);
            return page;
        } catch (error: any) {
            console.error(`[Phase 8] ERROR Final procedural composition failed: ${error?.message || error}`);
            if (error?.stack) console.error(error.stack);

            const fallbackHtml = renderEmergencyHtml({ draft, plan, context, mission, error });
            const fallbackPage = finalizeRenderedPageSemantics({
                html: fallbackHtml,
                metadata: {
                    qaScore: 0,
                    niche: context?.niche || mission?.niche,
                    city: context?.city || mission?.city,
                    output_path: '',
                    technical_passed: false,
                    editorial_passed: false,
                    validation_errors: [`[ASSEMBLY_FALLBACK] ${error?.message || String(error)}`],
                    fallback_meta: buildInternalFallbackMeta(error?.message || String(error), 'assembly_phase'),
                    seo: (draft.metadata as any)?.seo,
                    assembly_mode: 'emergency_fallback',
                    assembly_error: {
                        message: error?.message || String(error),
                        stack: error?.stack || ''
                    }
                } as any
            }, { mission, pagePlan: plan, context, canonical: (draft.metadata as any)?.seo?.canonical });

            console.log(`[Phase 8] END Emergency fallback composition in ${Date.now() - startedAt}ms | final HTML: ${fallbackPage.html.length} chars`);
            return fallbackPage;
        }
    }
}
