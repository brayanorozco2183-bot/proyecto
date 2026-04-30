import { SectionSemanticData } from '../agents/contentWriterAgent.js';
import { SectionRenderContract } from '../types/design.js';

type VisualWeight = 'light' | 'medium' | 'heavy';
type Emphasis = 'content' | 'trust' | 'cta';
type PageComposition = 'editorial' | 'conversion' | 'local_dense' | 'trust_first' | 'asymmetric';
type VisualSystem = 'grid' | 'editorial' | 'panelled' | 'minimal' | 'mixed';
type SectionShell = 'plain' | 'panel' | 'band' | 'editorial' | 'hero-bridge' | 'feature' | 'comparison';
type ContentFlow = 'stack' | 'split' | 'zigzag' | 'asymmetric' | 'centered';
type MediaPolicy = 'none' | 'iconic' | 'illustrated' | 'map' | 'proof';
type CtaWeight = 'low' | 'medium' | 'high';
type TrustDistribution = 'embedded' | 'separate' | 'mixed';
type Density = 'standard' | 'compact' | 'rich';
type HeroTemplate = 'split' | 'centered' | 'proof-first' | 'form-first';
type CadencePattern = 'alternating' | 'stacked' | 'contrast-bursts';
type ProofStrategy = 'early' | 'mid' | 'distributed';
type CtaStrategy = 'terminal' | 'distributed' | 'hero-heavy';
type PageSkeleton =
    | 'editorial-longform'
    | 'conversion-funnel'
    | 'local-directory'
    | 'premium-showcase'
    | 'technical-comparison';

type SectionPattern =
    | 'auto'
    | 'minimal'
    | 'panelled'
    | 'editorial'
    | 'two_column_story'
    | 'stacked_cards'
    | 'comparison_table'
    | 'quote_proof'
    | 'cta_inline'
    | 'mosaic'
    | 'directory'
    | 'timeline';

interface DecisionFactor {
    title: string;
    body: string;
}

interface LayoutContractLike {
    flow?: ContentFlow;
    media?: MediaPolicy;
    cta?: CtaWeight;
    trust?: TrustDistribution;
    density?: Density;
    shell?: SectionShell;
}

export interface RenderSemanticSectionOpts {
    blockType?: string;
    sectionId?: string;
    sectionH2?: string;
    contentOnly?: boolean;
    layoutHint?: string;
    patternHint?: string;
    visualVariant?: string;
    visualWeight?: VisualWeight;
    emphasis?: Emphasis;
    pageComposition?: PageComposition;
    visualSystem?: VisualSystem;
    sectionShell?: SectionShell;
    commonMistakes?: string[];
    decisionFactors?: DecisionFactor[];

    flow?: ContentFlow;
    mediaPolicy?: MediaPolicy;
    ctaWeight?: CtaWeight;
    trustDistribution?: TrustDistribution;
    density?: Density;

    heroTemplate?: HeroTemplate;
    cadencePattern?: CadencePattern;
    proofStrategy?: ProofStrategy;
    ctaStrategy?: CtaStrategy;
    pageSkeleton?: PageSkeleton;
    sectionPattern?: SectionPattern;

    layoutContract?: LayoutContractLike;
    sectionContract?: SectionRenderContract;
    orderIndex?: number;
    totalSections?: number;
    isFirst?: boolean;
    isLast?: boolean;
    city?: string;
}

function escapeHtml(value: string = ''): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function stripHtml(value: string = ''): string {
    return value.replace(/<[^>]*>?/gm, '').trim();
}

function safeArray<T>(value: T[] | undefined | null): T[] {
    return Array.isArray(value) ? value : [];
}


function sanitizeClassToken(value: any, fallback = 'default'): string {
    const cleaned = String(value || '')
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .trim();

    if (!cleaned || cleaned === 'undefined' || cleaned === 'null') {
        return fallback;
    }

    return cleaned;
}


function toTelHref(phone?: string): string {
    if (!phone) return '#contacto';
    return `tel:${phone.replace(/\s+/g, '')}`;
}

function resolveFlow(opts: RenderSemanticSectionOpts): ContentFlow {
    return (
        opts.sectionContract?.flow ||
        opts.layoutContract?.flow ||
        opts.flow ||
        inferFlowFromContext(opts.blockType, opts.pageSkeleton, opts.pageComposition)
    );
}

function resolveShell(opts: RenderSemanticSectionOpts): SectionShell {
    return (
        opts.sectionContract?.shell ||
        opts.layoutContract?.shell ||
        opts.sectionShell ||
        inferShellFromContext(opts.blockType, opts.pageSkeleton, opts.pageComposition)
    );
}

function resolveMedia(opts: RenderSemanticSectionOpts): MediaPolicy {
    return (
        opts.layoutContract?.media ||
        opts.mediaPolicy ||
        inferMediaFromBlockType(opts.blockType)
    );
}

function resolveCtaWeight(opts: RenderSemanticSectionOpts): CtaWeight {
    return opts.sectionContract?.emphasis === 'cta' ? 'high' : (opts.layoutContract?.cta || opts.ctaWeight || 'medium');
}

function resolveTrustDistribution(opts: RenderSemanticSectionOpts): TrustDistribution {
    return opts.sectionContract?.emphasis === 'trust' ? 'separate' : (opts.layoutContract?.trust || opts.trustDistribution || 'embedded');
}

function resolveDensity(opts: RenderSemanticSectionOpts): Density {
    return (opts.sectionContract?.density as any) || opts.layoutContract?.density || opts.density || 'standard';
}

function inferFlowFromContext(
    blockType?: string,
    pageSkeleton?: PageSkeleton,
    pageComposition?: PageComposition
): ContentFlow {
    const bt = (blockType || '').toLowerCase();

    if (bt === 'map') return pageSkeleton === 'local-directory' ? 'asymmetric' : 'centered';
    if (bt === 'faq') return pageSkeleton === 'technical-comparison' ? 'centered' : 'stack';
    if (bt === 'process_steps') return pageSkeleton === 'editorial-longform' ? 'zigzag' : 'stack';
    if (bt === 'urgency_panel') return pageSkeleton === 'conversion-funnel' ? 'split' : 'centered';
    if (bt === 'comparison_table') return 'centered';
    if (bt === 'case_story') return 'split';
    if (bt === 'before_after') return 'asymmetric';
    if (bt === 'objections') return 'stack';
    if (bt === 'micro_cta') return 'centered';

    if (pageSkeleton === 'local-directory') return bt === 'local_proof' ? 'centered' : 'asymmetric';
    if (pageSkeleton === 'premium-showcase') return 'zigzag';
    if (pageSkeleton === 'technical-comparison') return 'centered';
    if (pageSkeleton === 'conversion-funnel') return bt === 'cta_panel' ? 'centered' : 'stack';
    if (pageComposition === 'editorial') return 'split';
    if (pageComposition === 'trust_first') return 'centered';

    return 'stack';
}

function inferShellFromContext(
    blockType?: string,
    pageSkeleton?: PageSkeleton,
    pageComposition?: PageComposition
): SectionShell {
    const bt = (blockType || '').toLowerCase();

    if (bt === 'cta_panel') return pageSkeleton === 'conversion-funnel' ? 'band' : 'plain';
    if (bt === 'urgency_panel') return pageSkeleton === 'conversion-funnel' ? 'band' : 'panel';
    if (bt === 'local_proof') return pageSkeleton === 'local-directory' ? 'panel' : 'plain';
    if (bt === 'trust_band') return 'band';
    if (bt === 'comparison_table') return 'panel';
    if (bt === 'case_story') return 'editorial';
    if (bt === 'before_after') return 'panel';
    if (bt === 'objections') return 'plain';
    if (bt === 'micro_cta') return 'plain';

    if (pageSkeleton === 'premium-showcase') return bt === 'faq' ? 'plain' : 'editorial';
    if (pageSkeleton === 'conversion-funnel') return bt === 'services_grid' ? 'panel' : 'plain';
    if (pageSkeleton === 'technical-comparison') return 'panel';
    if (pageComposition === 'editorial') return 'editorial';
    if (pageComposition === 'trust_first') return 'panel';

    return 'plain';
}

function inferMediaFromBlockType(blockType?: string): MediaPolicy {
    const bt = (blockType || '').toLowerCase();

    if (bt.includes('map')) return 'map';
    if (bt.includes('trust') || bt.includes('proof') || bt.includes('testimonial')) return 'proof';
    if (bt.includes('service') || bt.includes('process')) return 'iconic';
    return 'none';
}

function inferSectionPattern(
    blockType: string | undefined,
    opts: RenderSemanticSectionOpts,
    flow: ContentFlow
): SectionPattern {
    if (opts.sectionContract?.sectionPattern && opts.sectionContract.sectionPattern !== 'auto') {
        return opts.sectionContract.sectionPattern as SectionPattern;
    }
    if (opts.sectionPattern && opts.sectionPattern !== 'auto') return opts.sectionPattern;

    const bt = (blockType || '').toLowerCase();
    const skeleton = opts.pageSkeleton;

    if (bt === 'faq') return skeleton === 'conversion-funnel' ? 'stacked_cards' : 'minimal';
    if (bt === 'cta_panel') return opts.ctaStrategy === 'distributed' ? 'cta_inline' : 'editorial';
    if (bt === 'price_guidance') return 'comparison_table';
    if (bt === 'local_proof' || bt === 'trust_band') {
        if (skeleton === 'local-directory') return 'directory';
        return 'panelled';
    }
    if (bt === 'services_grid') {
        if (skeleton === 'premium-showcase') return 'mosaic';
        if (skeleton === 'technical-comparison') return 'comparison_table';
        if (flow === 'stack') return 'stacked_cards';
        if (flow === 'zigzag') return 'two_column_story';
        return 'panelled';
    }
    if (bt === 'process_steps') return skeleton === 'editorial-longform' ? 'timeline' : 'stacked_cards';
    if (bt === 'map') return skeleton === 'local-directory' ? 'directory' : 'minimal';

    if (flow === 'zigzag') return 'two_column_story';
    if (flow === 'asymmetric') return 'mosaic';

    return 'minimal';
}

function buildSectionClasses(opts: RenderSemanticSectionOpts, resolved: {
    shell: SectionShell;
    system: VisualSystem;
    flow: ContentFlow;
    media: MediaPolicy;
    density: Density;
    ctaWeight: CtaWeight;
    trustDistribution: TrustDistribution;
    pattern: SectionPattern;
    variant: string;
}): string {
    const sectionClasses = [
        'semantic-section',
        `shell-${resolved.shell}`,
        `system-${resolved.system}`,
        `flow-${resolved.flow}`,
        `media-${resolved.media}`,
        `density-${resolved.density}`,
        `cta-weight-${resolved.ctaWeight}`,
        `trust-${resolved.trustDistribution}`,
        `pattern-${resolved.pattern}`,
        `variant-${resolved.variant}`,
        `weight-${opts.visualWeight || 'medium'}`,
        `emphasis-${opts.emphasis || 'content'}`,
        `composition-${opts.pageComposition || 'editorial'}`,
        `skeleton-${opts.pageSkeleton || 'editorial-longform'}`,
        `cadence-${opts.cadencePattern || 'alternating'}`
    ];

    if (opts.sectionContract) {
        sectionClasses.push('has-contract');
        sectionClasses.push(`contract-shell-${sanitizeClassToken(opts.sectionContract.shell, 'plain')}`);
        sectionClasses.push(`contract-flow-${sanitizeClassToken(opts.sectionContract.flow, 'stack')}`);
        sectionClasses.push(`contract-density-${sanitizeClassToken(opts.sectionContract.density, 'standard')}`);
        sectionClasses.push(`contract-emphasis-${sanitizeClassToken(opts.sectionContract.emphasis, 'content')}`);
        sectionClasses.push(`contract-card-${sanitizeClassToken(opts.sectionContract.cardStyle, 'flat')}`);
        sectionClasses.push(`contract-ornament-${sanitizeClassToken(opts.sectionContract.ornamentLevel, 'none')}`);
        sectionClasses.push(`mobile-pattern-${sanitizeClassToken(opts.sectionContract.mobilePattern, 'stack')}`);
    }

    return sectionClasses
        .filter(Boolean)
        .join(' ');
}

function renderParagraphs(paragraphs: string[]): string {
    return paragraphs.map(p => `<p>${p}</p>`).join('\n');
}

function renderBullets(bullets: string[], className = ''): string {
    if (!bullets.length) return '';
    return `<ul class="${className || 'semantic-bullets'}">${bullets.map(b => `<li>${b}</li>`).join('')}</ul>`;
}

function renderDecisionFactors(decisionFactors: DecisionFactor[]): string {
    if (!decisionFactors.length) return '';

    return `
    <section class="decision-factors">
        <h3>Criterios de elección</h3>
        <dl class="decision-factors__list">
            ${decisionFactors.map(f => `
                <div class="decision-factor">
                    <dt>${escapeHtml(f.title)}</dt>
                    <dd>${f.body}</dd>
                </div>
            `).join('')}
        </dl>
    </section>`;
}

function renderCommonMistakes(commonMistakes: string[]): string {
    if (!commonMistakes.length) return '';

    return `
    <section class="common-mistakes">
        <h3>Errores comunes a evitar</h3>
        <ul class="common-mistakes__list">
            ${commonMistakes.map(m => `<li>${m}</li>`).join('')}
        </ul>
    </section>`;
}

function renderTable(semantic: SectionSemanticData): string {
    const hasColumns = safeArray(semantic.table?.columns).length > 0;
    const hasRows = safeArray(semantic.table?.rows).length > 0;

    if (!hasColumns || !hasRows) return '';

    return `
    <div class="table-wrap" style="max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;">
        <table class="semantic-table" style="min-width:640px;width:100%;table-layout:fixed;">
            <thead>
                <tr>${semantic.table!.columns.map(c => `<th>${c}</th>`).join('')}</tr>
            </thead>
            <tbody>
                ${semantic.table!.rows.map(row => `
                    <tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>
                `).join('')}
            </tbody>
        </table>
    </div>`;
}

function renderCta(
    semantic: SectionSemanticData,
    weight: CtaWeight,
    strategy: CtaStrategy = 'terminal',
    label?: string
): string {
    if (!semantic.cta?.phone && !semantic.cta?.text) return '';

    const phone = semantic.cta?.phone || '';
    const href = toTelHref(phone);
    const text = semantic.cta?.text || label || 'Llamar ahora';

    return `
    <div class="section-cta section-cta--${weight} section-cta--${strategy}">
        <a class="cta-link cta-link--${weight}" href="${href}">
            ${escapeHtml(text)}
        </a>
    </div>`;
}

function renderSemanticCards(
    semantic: SectionSemanticData,
    variant: SectionPattern
): string {
    const items = safeArray(semantic.items);
    if (!items.length) return '';

    if (variant === 'directory') {
        return `
        <div class="semantic-directory">
            ${items.map((item, index) => `
                <article class="semantic-directory__item">
                    <div class="semantic-directory__index">${index + 1}</div>
                    <div class="semantic-directory__body">
                        <h3>${escapeHtml(stripHtml(item.title || ''))}</h3>
                        <p>${item.body}</p>
                    </div>
                </article>
            `).join('')}
        </div>`;
    }

    if (variant === 'mosaic') {
        return `
        <div class="semantic-mosaic">
            ${items.map((item, index) => `
                <article class="semantic-card semantic-card--mosaic semantic-card--${index % 3 === 0 ? 'large' : 'standard'}">
                    <h3>${escapeHtml(stripHtml(item.title || ''))}</h3>
                    <p>${item.body}</p>
                </article>
            `).join('')}
        </div>`;
    }

    return `
    <div class="semantic-items">
        ${items.map(item => `
            <article class="semantic-card service-card">
                <h3>${escapeHtml(stripHtml(item.title || ''))}</h3>
                <p>${item.body}</p>
            </article>
        `).join('')}
    </div>`;
}

function renderProcessTimeline(semantic: SectionSemanticData): string {
    const items = safeArray(semantic.items);
    if (!items.length) return '';

    return `
    <ol class="process-timeline process-steps">
        ${items.map((item, index) => `
            <li class="process-timeline__step step-card">
                <span class="step-card__index">${index + 1}</span>
                <div class="process-timeline__content">
                    <h3>${escapeHtml(stripHtml(item.title || ''))}</h3>
                    <p>${item.body}</p>
                </div>
            </li>
        `).join('')}
    </ol>`;
}

function renderFaqClassic(semantic: SectionSemanticData): string {
    const faqs = safeArray(semantic.faqItems);
    if (!faqs.length) return '';

    return `
    <div class="faq-list">
        ${faqs.map(f => `
            <details class="faq-item" data-faq-item="true">
                <summary data-faq-question="true">${escapeHtml(f.question)}</summary>
                <div><p>${f.answer}</p></div>
            </details>
        `).join('')}
    </div>`;
}

function renderFaqColumns(semantic: SectionSemanticData): string {
    const faqs = safeArray(semantic.faqItems);
    if (!faqs.length) return '';

    return `
    <div class="faq-columns">
        ${faqs.map(f => `
            <article class="faq-card faq-item" data-faq-item="true">
                <h3 data-faq-question="true">${escapeHtml(f.question)}</h3>
                <p>${f.answer}</p>
            </article>
        `).join('')}
    </div>`;
}

function renderMapSection(semantic: SectionSemanticData, opts: RenderSemanticSectionOpts): string {
    const note = semantic.mapNote ? `<p class="map-note">${semantic.mapNote}</p>` : '';
    const intro = renderParagraphs(safeArray(semantic.intro));
    const city = opts.city || 'España';
    const query = encodeURIComponent(city);
    const mapUrl = `https://www.google.com/maps?q=${query}&output=embed`;

    if (opts.pageSkeleton === 'local-directory') {
        return `
        <div class="map-directory">
            <div class="map-directory__content">
                ${intro}
                ${note}
            </div>
            <div class="map-directory__visual">
                <div class="map-frame-wrapper" style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:1rem;box-shadow:var(--shadow-soft);">
                    <iframe 
                        src="${mapUrl}" 
                        width="100%" 
                        height="100%" 
                        style="position:absolute;top:0;left:0;border:0;" 
                        allowfullscreen="" 
                        loading="lazy">
                    </iframe>
                </div>
            </div>
        </div>`;
    }

    return `
    <div class="map-block">
        ${intro}
        ${note}
        <div class="map-frame-wrapper" style="position:relative;padding-bottom:45%;height:0;overflow:hidden;border-radius:1rem;box-shadow:var(--shadow-soft);margin-top:2rem;">
            <iframe 
                src="${mapUrl}" 
                width="100%" 
                height="100%" 
                style="position:absolute;top:0;left:0;border:0;" 
                allowfullscreen="" 
                loading="lazy">
            </iframe>
        </div>
    </div>`;
}

function renderProofAside(semantic: SectionSemanticData, opts: RenderSemanticSectionOpts): string {
    if (opts.proofStrategy === 'distributed' || opts.trustDistribution === 'separate') {
        const proofBullets = safeArray(semantic.bullets).slice(0, 3);
        if (!proofBullets.length) return '';

        return `
        <aside class="proof-aside">
            <span class="proof-aside__eyebrow">Confianza</span>
            ${renderBullets(proofBullets, 'proof-aside__list')}
        </aside>`;
    }

    return '';
}

function wrapSection(
    inner: string,
    sectionId: string,
    h2: string,
    classes: string,
    opts: RenderSemanticSectionOpts
): string {
    const eyebrow = opts.sectionContract?.eyebrow || '';
    const eyebrowValue = String(eyebrow || '').trim();
    const isInternalLabel = /^(generic|hero|services_grid|faq|urgency_panel|local_proof|trust_band|process_steps|cta_panel|price_guidance|map|case_story|before_after|objections|micro_cta|comparison_table|directory|mosaic|timeline|stacked_cards|two_column_story|quote_proof|cta_inline|undefined|null)$/i.test(eyebrowValue);
    
    const safeEyebrow = eyebrowValue && !isInternalLabel ? `<span class="block__eyebrow">${escapeHtml(eyebrowValue)}</span>` : '';
    const shellClass = opts.sectionContract?.shell ? `shell-${opts.sectionContract.shell}` : '';
    const densityClass = opts.sectionContract?.density ? `density-${opts.sectionContract.density}` : '';

    return `
    <section class="${classes}" id="${sectionId}">
        <div class="el-container">
            <div class="semantic-section__container section-shell ${shellClass} ${densityClass}">
                ${h2 || safeEyebrow ? `<header class="block__header">${safeEyebrow}${h2 ? `<h2 class="block__title">${h2}</h2>` : ''}</header>` : ''}
                <div class="generic-layout generic-layout--${opts.sectionContract?.density || 'standard'}">
                    ${inner}
                </div>
            </div>
        </div>
    </section>`;
}


function renderGenericByFlow(
    semantic: SectionSemanticData,
    opts: RenderSemanticSectionOpts,
    pattern: SectionPattern,
    flow: ContentFlow
): string {
    const intro = renderParagraphs(safeArray(semantic.intro));
    const bullets = renderBullets(safeArray(semantic.bullets));
    const table = renderTable(semantic);
    const cards = renderSemanticCards(semantic, pattern);
    const decisionFactors = renderDecisionFactors(safeArray(opts.decisionFactors));
    const commonMistakes = renderCommonMistakes(safeArray(opts.commonMistakes));
    const proofAside = renderProofAside(semantic, opts);

    if (pattern === 'comparison_table' && table) {
        return `
        <div class="layout-block layout-block--comparison">
            <div class="layout-main">
                ${intro}
                ${table}
            </div>
            ${proofAside}
        </div>
        ${decisionFactors}
        ${commonMistakes}`;
    }

    if (pattern === 'two_column_story' || flow === 'split' || flow === 'zigzag' || flow === 'asymmetric') {
        const auxiliary = `${decisionFactors || ''}${proofAside || ''}${commonMistakes || ''}`.trim();
        return `
        <div class="layout-block layout-block--split">
            <div class="layout-main">
                ${intro}
                ${cards}
                ${bullets}
            </div>
            ${auxiliary ? `<div class="layout-side">${auxiliary}</div>` : ''}
        </div>`;
    }

    return `
    <div class="layout-block layout-block--stack">
        ${intro}
        ${cards}
        ${bullets}
        ${table}
        ${decisionFactors}
        ${commonMistakes}
    </div>`;
}

export function renderSemanticSection(
    semantic: SectionSemanticData,
    opts: RenderSemanticSectionOpts
): string {
    const sectionId = opts.sectionId || 'section';
    const h2 = opts.sectionH2 || '';
    const blockType = opts.blockType || 'generic';

    const shell = resolveShell(opts);
    const system = opts.visualSystem || 'minimal';
    const flow = resolveFlow(opts);
    const media = resolveMedia(opts);
    const density = resolveDensity(opts);
    const ctaWeight = resolveCtaWeight(opts);
    const trustDistribution = resolveTrustDistribution(opts);
    const variant = opts.visualVariant || 'default';
    const pattern = inferSectionPattern(blockType, opts, flow);

    const classes = buildSectionClasses(opts, {
        shell,
        system,
        flow,
        media,
        density,
        ctaWeight,
        trustDistribution,
        pattern,
        variant
    });

    const introHtml = renderParagraphs(safeArray(semantic.intro));
    const bulletsHtml = renderBullets(safeArray(semantic.bullets));
    const ctaHtml = renderCta(semantic, ctaWeight, opts.ctaStrategy);
    const decisionFactorsHtml = renderDecisionFactors(safeArray(opts.decisionFactors));
    const commonMistakesHtml = renderCommonMistakes(safeArray(opts.commonMistakes));
    const proofAside = renderProofAside(semantic, opts);

    switch (blockType) {
        case 'services_grid': {
            const cards = renderSemanticCards(semantic, pattern);

            if (pattern === 'comparison_table' && semantic.table?.columns?.length) {
                return wrapSection(`
                    <div class="services-layout services-layout--comparison">
                        <div class="services-layout__main">
                            ${introHtml}
                            ${renderTable(semantic)}
                        </div>
                        <div class="services-layout__aside">
                            ${decisionFactorsHtml}
                            ${commonMistakesHtml}
                            ${ctaHtml}
                        </div>
                    </div>
                `, sectionId, h2, classes, opts);
            }

            if (pattern === 'mosaic') {
                return wrapSection(`
                    <div class="services-layout services-layout--mosaic">
                        ${introHtml}
                        ${cards}
                        ${ctaHtml}
                    </div>
                `, sectionId, h2, classes, opts);
            }

            if (pattern === 'two_column_story') {
                return wrapSection(`
                    <div class="services-layout services-layout--story">
                        <div class="services-layout__main">
                            ${introHtml}
                            ${cards}
                        </div>
                        <aside class="services-layout__aside">
                            ${decisionFactorsHtml}
                            ${commonMistakesHtml}
                            ${ctaHtml}
                        </aside>
                    </div>
                `, sectionId, h2, classes, opts);
            }

            return wrapSection(`
                <div class="services-layout services-layout--default">
                    ${introHtml}
                    ${cards}
                    ${decisionFactorsHtml}
                    ${commonMistakesHtml}
                    ${ctaHtml}
                </div>
            `, sectionId, h2, classes, opts);
        }

        case 'urgency_panel': {
            const splitLayout = flow === 'split' || flow === 'asymmetric';

            return wrapSection(`
                <div class="urgency-layout urgency-layout--${splitLayout ? 'split' : 'stack'}">
                    <div class="urgency-layout__copy">
                        ${introHtml}
                        ${bulletsHtml}
                    </div>
                    <aside class="urgency-layout__action">
                        ${proofAside}
                        ${ctaHtml}
                    </aside>
                </div>
            `, sectionId, h2, classes, opts);
        }

        case 'local_proof':
        case 'trust_band': {
            const cards = renderSemanticCards(semantic, pattern);

            if (opts.pageSkeleton === 'local-directory') {
                return wrapSection(`
                    <div class="trust-layout trust-layout--directory">
                        <div class="trust-layout__main">
                            ${introHtml}
                            ${cards}
                        </div>
                        <aside class="trust-layout__side">
                            ${bulletsHtml}
                            ${decisionFactorsHtml}
                        </aside>
                    </div>
                `, sectionId, h2, classes, opts);
            }

            if (trustDistribution === 'separate') {
                return wrapSection(`
                    <div class="trust-layout trust-layout--separate">
                        ${introHtml}
                        <div class="trust-layout__grid">
                            <div class="trust-layout__cards">${cards}</div>
                            <aside class="trust-layout__proof">
                                ${bulletsHtml}
                                ${decisionFactorsHtml}
                                ${commonMistakesHtml}
                            </aside>
                        </div>
                    </div>
                `, sectionId, h2, classes, opts);
            }

            return wrapSection(`
                <div class="trust-layout trust-layout--embedded">
                    ${introHtml}
                    ${cards}
                    ${bulletsHtml}
                    ${decisionFactorsHtml}
                    ${commonMistakesHtml}
                </div>
            `, sectionId, h2, classes, opts);
        }

        case 'process_steps': {
            const processHtml =
                pattern === 'timeline'
                    ? renderProcessTimeline(semantic)
                    : `
                    <ol class="process-steps">
                        ${safeArray(semantic.items).map((item, index) => `
                            <li class="process-step">
                                <div class="process-step__content">
                                    <div class="process-step__body">
                                        <h3>${escapeHtml(stripHtml(item.title || ''))}</h3>
                                        <p>${item.body}</p>
                                    </div>
                                </div>
                            </li>
                        `).join('')}
                    </ol>`;

            return wrapSection(`
                <div class="process-layout">
                    ${introHtml}
                    ${processHtml}
                    ${decisionFactorsHtml}
                    ${ctaHtml}
                </div>
            `, sectionId, h2, classes, opts);
        }

        case 'price_guidance': {
            const table = renderTable(semantic);

            if (pattern === 'comparison_table' && table) {
                return wrapSection(`
                    <div class="pricing-layout pricing-layout--comparison">
                        <div class="pricing-layout__main">
                            ${introHtml}
                            ${table}
                        </div>
                        <aside class="pricing-layout__aside">
                            ${bulletsHtml}
                            ${decisionFactorsHtml}
                            ${ctaHtml}
                        </aside>
                    </div>
                `, sectionId, h2, classes, opts);
            }

            return wrapSection(`
                <div class="pricing-layout pricing-layout--default">
                    ${introHtml}
                    ${table || bulletsHtml}
                    ${ctaHtml}
                </div>
            `, sectionId, h2, classes, opts);
        }

        case 'faq': {
            const faqHtml =
                opts.pageSkeleton === 'conversion-funnel' || pattern === 'stacked_cards'
                    ? renderFaqClassic(semantic)
                    : renderFaqColumns(semantic);

            return wrapSection(`
                <div class="faq-layout faq-layout--${opts.pageSkeleton === 'conversion-funnel' ? 'classic' : 'editorial'}">
                    ${faqHtml}
                    ${ctaWeight === 'high' ? ctaHtml : ''}
                </div>
            `, sectionId, h2, classes, opts);
        }

        case 'cta_panel': {
            if (opts.ctaStrategy === 'distributed' || pattern === 'cta_inline') {
                return wrapSection(`
                    <div class="cta-panel cta-panel--inline">
                        <div class="cta-panel__copy">
                            ${introHtml}
                            ${commonMistakesHtml}
                        </div>
                        <div class="cta-panel__action">
                            ${ctaHtml}
                        </div>
                    </div>
                `, sectionId, h2, classes, opts);
            }

            return wrapSection(`
                <div class="cta-panel cta-panel--centered">
                    ${introHtml}
                    ${commonMistakesHtml}
                    ${ctaHtml}
                </div>
            `, sectionId, h2, classes, opts);
        }

        case 'map': {
            return wrapSection(renderMapSection(semantic, opts), sectionId, h2, classes, opts);
        }

        default: {
            const generic = renderGenericByFlow(semantic, opts, pattern, flow);
            const trailingCta =
                opts.ctaStrategy === 'distributed' || opts.emphasis === 'cta'
                    ? ctaHtml
                    : '';

            return wrapSection(`
                <div class="generic-layout">
                    ${generic}
                    ${trailingCta}
                </div>
            `, sectionId, h2, classes, opts);
        }
    }
}

