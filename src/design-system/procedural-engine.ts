import { SectionBlockType, GeneratedSection, DesignSystemTheme } from './types.js';
import * as components from './components/index.js';
import { getFamilyCSSOverride } from './families/index.js';
import { getFamilyDefinition } from './families/index.js';
import { ResolvedPageRenderPlan } from '../types/design.js';
import { blockRegistry } from '../renderers/blocks/index.js';
import type { BlockRendererInput } from '../renderers/blocks/types.js';
import type { RenderedSeoContract } from '../seo/types.js';
import { adaptSectionToBlockInput } from './blockPayloadAdapter.js';
import { renderTokenAliases } from './tokenAliases.js';

function svgToDataUri(svg: string): string {
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function buildDefaultEditorialImage(kind: 'hero' | 'section', context: {
    niche?: string;
    city?: string;
    businessName?: string;
    title?: string;
    subtitle?: string;
} = {}): string {
    const title = String(context.title || context.niche || 'Servicio premium').slice(0, 36);
    const subtitle = String(context.subtitle || context.city || context.businessName || 'Cobertura local').slice(0, 40);
    const palette = kind === 'hero'
        ? { bgA: '#0f172a', bgB: '#0f766e', glow: 'rgba(37,99,235,0.40)' }
        : { bgA: '#111827', bgB: '#2563eb', glow: 'rgba(16,185,129,0.28)' };

    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1100" role="img" aria-label="${title} ${subtitle}">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${palette.bgA}"/>
          <stop offset="100%" stop-color="${palette.bgB}"/>
        </linearGradient>
        <filter id="blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="42"/>
        </filter>
      </defs>
      <rect width="1600" height="1100" rx="42" fill="url(#bg)"/>
      <circle cx="1260" cy="190" r="210" fill="${palette.glow}" filter="url(#blur)"/>
      <circle cx="290" cy="900" r="180" fill="rgba(255,255,255,0.08)" filter="url(#blur)"/>
      <g opacity="0.98">
        <rect x="104" y="118" width="680" height="864" rx="36" fill="rgba(255,255,255,0.14)" stroke="rgba(255,255,255,0.18)"/>
        <rect x="160" y="176" width="568" height="318" rx="26" fill="rgba(255,255,255,0.08)"/>
        <rect x="160" y="544" width="388" height="26" rx="13" fill="rgba(255,255,255,0.86)"/>
        <rect x="160" y="590" width="468" height="18" rx="9" fill="rgba(255,255,255,0.36)"/>
        <rect x="160" y="626" width="424" height="18" rx="9" fill="rgba(255,255,255,0.26)"/>
        <rect x="160" y="742" width="224" height="64" rx="32" fill="rgba(255,255,255,0.88)"/>
      </g>
      <g opacity="0.92">
        <rect x="904" y="224" width="430" height="226" rx="28" fill="rgba(255,255,255,0.10)"/>
        <rect x="904" y="498" width="498" height="344" rx="34" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.18)"/>
        <rect x="956" y="566" width="324" height="22" rx="11" fill="rgba(255,255,255,0.84)"/>
        <rect x="956" y="610" width="380" height="18" rx="9" fill="rgba(255,255,255,0.36)"/>
        <rect x="956" y="646" width="344" height="18" rx="9" fill="rgba(255,255,255,0.24)"/>
      </g>
      <text x="160" y="878" fill="white" font-size="72" font-family="Arial, Helvetica, sans-serif" font-weight="700">${title}</text>
      <text x="160" y="944" fill="rgba(255,255,255,0.78)" font-size="34" font-family="Arial, Helvetica, sans-serif">${subtitle}</text>
    </svg>`;

    return svgToDataUri(svg);
}

function renderEditorialImageSection(context: { niche?: string; city?: string; businessName?: string }, slot = 'editorial-default'): string {
    const src = buildDefaultEditorialImage('section', {
        niche: context.niche,
        city: context.city,
        businessName: context.businessName,
        title: context.niche || 'Servicio premium',
        subtitle: context.city || context.businessName || 'Cobertura local'
    });
    const alt = `${context.niche || 'Servicio profesional'} en ${context.city || 'tu zona'} · imagen provisional de apoyo`;

    return `
    <section class="editorial-visual-strip" data-image-slot="${slot}" data-image-kind="editorial" data-image-status="provisional">
        <div class="el-container">
            <figure class="editorial-visual-card">
                <div class="editorial-visual-card__frame">
                    <img src="${src}" alt="${alt}" loading="lazy" decoding="async" data-image-origin="fallback-svg">
                </div>
            </figure>
        </div>
    </section>`;
}

export type PageFamily = 'premium_classic' | 'modern_trust' | 'local_authority' | 'editorial_luxury' | 'technical_clean' | string;
export type { GeneratedSection };

function hexToRgb(hex: string): string {
    const sanitized = hex.replace('#', '');
    const r = parseInt(sanitized.slice(0, 2), 16);
    const g = parseInt(sanitized.slice(2, 4), 16);
    const b = parseInt(sanitized.slice(4, 6), 16);
    return `${r}, ${g}, ${b}`;
}

function generateThemeCssVariables(theme: DesignSystemTheme): string {
    const { colors, typography, spacing, radius, shadow, breakpoints, motion } = theme.tokens;
    const verticalRhythm = theme.rules.verticalRhythm;
    const rhythmSpacing = spacing[verticalRhythm] || spacing.standard;
    const sectionY = (rhythmSpacing as any)?.sectionY
        || (verticalRhythm === 'spacious' || (verticalRhythm as string) === 'airy'
            ? 'clamp(7.5rem, 11vw, 9.5rem)'
            : verticalRhythm === 'compact'
                ? 'clamp(4.75rem, 7vw, 6rem)'
                : 'clamp(6rem, 9vw, 8rem)');
    const blockGap = (rhythmSpacing as any)?.cardGap
        || (verticalRhythm === 'spacious' || (verticalRhythm as string) === 'airy' ? '2.25rem' : verticalRhythm === 'compact' ? '1.25rem' : '1.75rem');
    const contentGap = (rhythmSpacing as any)?.contentGap
        || (verticalRhythm === 'spacious' || (verticalRhythm as string) === 'airy' ? '2.75rem' : verticalRhythm === 'compact' ? '1.5rem' : '2.1rem');
    const shellPadding = (rhythmSpacing as any)?.shellPadding
        || (verticalRhythm === 'spacious' || (verticalRhythm as string) === 'airy'
            ? 'clamp(2rem, 3vw, 3.5rem)'
            : verticalRhythm === 'compact'
                ? 'clamp(1.25rem, 2vw, 2rem)'
                : 'clamp(1.6rem, 2.6vw, 2.8rem)');

    return `
        :root {
            /* Colors */
            --bg: ${colors.bg};
            --surface: ${colors.surface};
            --surface-2: color-mix(in srgb, var(--primary) 2%, #ffffff);
            --surface-alt: #f1f5f9;
            --text: ${colors.text};
            --muted: #475569; /* Darker muted color for better legibility (Point 6) */
            --primary: ${colors.primary};
            --primary-rgb: ${hexToRgb(colors.primary)};
            --accent: ${colors.accent};
            --success: ${colors.success};
            --warning: ${colors.warning};
            --border: rgba(148, 163, 184, 0.12); /* Subtler border (Point 3) */
            --inverse: ${colors.inverse};
            
            /* Typography Scale */
            --font-display: ${typography.fontDisplay};
            --font-body: ${typography.fontBody};
            
            --hero-title-size: clamp(2.6rem, 5.5vw, 4.8rem); /* Slightly more controlled (Point 5) */
            --hero-title-weight: 900;
            --h1-size: clamp(2.2rem, 4.5vw, 4rem);
            --h1-weight: 900;
            --h2-size: clamp(1.75rem, 3.2vw, 2.6rem); /* More editorial hierarchy (Point 6) */
            --h2-weight: 800;
            --h3-size: clamp(1.3rem, 2.2vw, 1.7rem);
            --h3-weight: 700;
            --body-lg-size: 1.1rem;
            --body-md-size: 1.05rem;
            --caption-size: 0.85rem;
            
            /* Spacing Rules - resolved from theme rhythm */
            --section-y: ${sectionY};
            --gap: ${blockGap};
            --content-gap: ${contentGap};
            --block-gap: ${blockGap};
            --flow-gap: ${contentGap};
            --shell-padding: ${shellPadding};
            --shell-padding-tight: calc(var(--shell-padding) * 0.78);
            --shell-padding-loose: calc(var(--shell-padding) * 1.22);
            --trust-strip-y: clamp(1.5rem, 2.5vw, 2.4rem);

            --rhythm-header: 2.25rem; /* 36px separation */
            --rhythm-grid: 2rem;      /* 32px gap */
            --rhythm-cta: 3rem;       /* 48px gap */
            
            /* Radius Policy - Unified (Point 14) */
            --radius-card: 1rem;      /* More discrete (Point 7) */
            --radius-btn: 999px;
            --radius-section: 1.25rem;
            
            /* Shadow Policy - Softer, less dramatic (Point 3, 14) */
            --shadow-soft: 0 4px 20px rgba(15, 23, 42, 0.04);
            --shadow-lift: 0 12px 30px rgba(15, 23, 42, 0.07);
            --shadow-dramatic: 0 20px 48px rgba(15, 23, 42, 0.1);
            
            /* Motion */
            --trans-main: 240ms cubic-bezier(0.4, 0, 0.2, 1);
            
            /* Breakpoints */
            --bp-md: ${breakpoints.md}px;
            --bp-lg: ${breakpoints.lg}px;

            /* Unified Aliases (Point 14) */
            --shadow-lg: var(--shadow-lift);
            --radius: var(--radius-section);
            ${renderTokenAliases()}
        }
    `;
}

function renderBreadcrumbs(items: any[]): string {
    if (!items || items.length < 2) return '';
    return `
        <nav class="el-breadcrumbs" aria-label="Breadcrumb">
            <div class="el-container">
                <ol class="el-breadcrumbs__list" itemscope itemtype="https://schema.org/BreadcrumbList">
                    ${items.map((item, idx) => `
                        <li class="el-breadcrumbs__item" itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
                            <a class="el-breadcrumbs__link" href="${item.url}" itemprop="item">
                                <span itemprop="name">${item.name}</span>
                            </a>
                            <meta itemprop="position" content="${idx + 1}" />
                        </li>
                    `).join('')}
                </ol>
            </div>
        </nav>
        <style>
            .el-breadcrumbs { padding: 1rem 0 0.4rem; font-size: 0.85rem; border-bottom: none; background: transparent; }
            .el-breadcrumbs__list {
                list-style: none; display: flex; align-items: center; gap: 0.5rem; color: var(--muted); flex-wrap: wrap;
                background: rgba(255, 255, 255, 0.7); border: 1px solid rgba(255, 255, 255, 0.82);
                box-shadow: 0 10px 26px rgba(15, 23, 42, 0.06); border-radius: 999px; padding: 0.78rem 1rem; width: max-content; max-width: 100%;
            }
            .el-breadcrumbs__item { display: inline-flex; align-items: center; gap: 0.5rem; }
            .el-breadcrumbs__link { text-decoration: none; color: var(--primary); font-weight: 700; transition: all var(--trans-main); }
            .el-breadcrumbs__link:hover { color: var(--text); }
            .el-breadcrumbs__item:not(:last-child)::after {
                content: "/";
                color: #94a3b8;
                font-size: 0.9rem;
                opacity: 0.7;
            }
            .el-breadcrumbs__item:last-child .el-breadcrumbs__link { color: var(--text); pointer-events: none; }
        </style>
    `;
}

export interface RenderPageOptions {
    niche: string;
    city: string;
    h1: string;
    meta: {
        title: string;
        description: string;
        seo?: any;
    };
    sections: GeneratedSection[];
    designDNA?: any;
    layoutContract?: any;
    business?: any;
    breadcrumbs?: any[];
    composition?: string;
    resolvedPlan: ResolvedPageRenderPlan;
    extraScripts?: string;
    pageType?: string;
    heroVariant?: string;
}

export function renderPage(options: RenderPageOptions): string {
    const { 
        sections, 
        resolvedPlan, 
        breadcrumbs = [], 
        layoutContract,
        composition: pageComposition = 'conversion',
        heroVariant,
        pageType = 'service',
        meta: { seo } = {}
    } = options;

    if (!resolvedPlan) {
        throw new Error('[procedural-engine] resolvedPlan is required for the new design system.');
    }

    const { theme } = resolvedPlan;
    const { tokens, rules } = theme;

    const businessName = options.business?.business_name || options.business?.name || '';
    const phone = options.business?.phone || '';
    const city = options.city || '';

    const normalizedSections = (sections || []).map((section: any) => ({
        ...section,
        sectionId: section?.sectionId || section?.id || section?.metadata?.section_id || '',
        blockType: section?.blockType || section?.type || section?.block_type || section?.metadata?.block_type || '',
        h2: section?.h2 || section?.metadata?.heading || '',
        html: String(section?.html || '')
    }));

    const mappingData = {
        niche: options.niche,
        city: options.city,
        businessName: businessName,
        phone: phone,
        seo: seo,
        local: options.business
    };

    const title = options.meta.title || options.h1 || 'Servicio Local';

    const cssVars = generateThemeCssVariables(theme);

    // Derived "DNA" for backward compatibility
    const dna = {
        family: resolvedPlan.visualSystem.family,
        surfaceStyle: resolvedPlan.visualSystem.surfaceStyle,
        visualSystem:
            resolvedPlan.visualSystem.visualSystem
            || resolvedPlan.visualSystem.system
            || ({
                editorial: 'editorial',
                conversion_heavy: 'grid',
                local_trust: 'panelled',
                technical_grid: 'grid',
                asymmetric_premium: 'mixed',
                minimal_authority: 'minimal'
            } as Record<string, string>)[resolvedPlan.visualSystem.family]
            || 'panelled',
        heroDisposition: rules.hero.disposition,
        heroTemplate: rules.hero.template,
        navbarTreatment: resolvedPlan.visualSystem.navbarTreatment,
        footerTreatment: resolvedPlan.visualSystem.footerTreatment,
        pageSkeleton: rules.shellUsage.default
    };

    const effectiveFamilyId = dna.family;
    const familyDef = getFamilyDefinition(effectiveFamilyId);

    // Macro Strategy Classes from Theme Rules
    const skeleton = resolvedPlan.visualSystem.pageComposition || 'editorial';
    const macroHeroTemplate = rules.hero.template;
    const macroCadence = rules.verticalRhythm || 'standard';
    const macroProof = rules.hero.emphasis === 'proof' ? 'early' : 'distributed';
    const macroCta = rules.hero.maxPrimaryCtas > 1 ? 'hero-heavy' : 'minimal';

    const globalStyles = `
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { 
            font-family: var(--font-body); 
            background: radial-gradient(circle at top left, rgba(var(--primary-rgb), 0.08), transparent 28%), 
                        radial-gradient(circle at top right, rgba(37, 99, 235, 0.08), transparent 22%), 
                        linear-gradient(180deg, #f8fbff 0%, #edf3f8 100%);
            color: var(--text); 
            line-height: 1.68; 
            font-size: var(--body-size);
            overflow-x: hidden;
        }
        body:before { 
            content: ""; position: fixed; inset: 0; pointer-events: none; 
            background: linear-gradient(to bottom, rgba(255, 255, 255, 0.45), transparent 25%); 
            z-index: -1; 
        }
        h1, h2, h3 { 
            font-family: var(--font-display); 
            color: var(--heading); 
            line-height: 1.1; 
            letter-spacing: -0.02em; 
            margin-bottom: var(--rhythm-header); 
        }
        h1 { font-size: var(--h1-size); font-weight: 900; letter-spacing: -0.04em; }
        h2 { font-size: var(--h2-size); font-weight: 800; letter-spacing: -0.025em; max-width: 800px; margin-top: 1rem; } /* Point 6 */
        h3 { font-size: var(--h3-size); font-weight: 700; letter-spacing: -0.01em; margin-top: 1rem; }
        p { margin-bottom: 1.5rem; color: var(--muted); line-height: 1.8; max-width: 72ch; } /* AIRE Update */

        /* Dynamic Layout & Components */
        .el-container { max-width: 1200px; margin: 0 auto; padding: 0 1.5rem; width: 100%; }
        .el-section { padding: var(--family-section-y, var(--section-y)) 0; width: 100%; }
        .el-section-wrapper {
            padding-block: calc(var(--family-section-y, var(--section-y)) * 0.55);
        }
        .el-section-wrapper > .block-section,
        .el-section-wrapper > .semantic-section,
        .el-section-wrapper > .el-section {
            margin: 0;
        }

        .section-tone-base {
            background: transparent;
        }
        .section-tone-soft {
            background: linear-gradient(180deg, rgba(255,255,255,0.26), rgba(255,255,255,0));
        }
        .section-tone-alt {
            background: linear-gradient(180deg, rgba(255,255,255,0.4), rgba(248,250,252,0.16));
        }
        .section-tone-contrast {
            background:
                radial-gradient(circle at top right, rgba(var(--primary-rgb), 0.08), transparent 26%),
                linear-gradient(180deg, rgba(255,255,255,0.52), rgba(241,245,249,0.28));
        }
        .el-section-wrapper.section-tone-soft .block-section__inner.shell-plain,
        .el-section-wrapper.section-tone-alt .block-section__inner.shell-plain,
        .el-section-wrapper.section-tone-contrast .block-section__inner.shell-plain {
            border-radius: calc(var(--radius-section) + 0.15rem);
            border: 1px solid rgba(148, 163, 184, 0.12);
            padding: clamp(1.35rem, 2.8vw, 2.3rem);
            box-shadow: var(--shadow-soft);
        }
        .el-section-wrapper.section-tone-soft .block-section__inner.shell-plain {
            background: linear-gradient(180deg, rgba(255,255,255,0.74), rgba(255,255,255,0.58));
        }
        .el-section-wrapper.section-tone-alt .block-section__inner.shell-plain {
            background: linear-gradient(180deg, rgba(255,255,255,0.88), rgba(248,250,252,0.74));
        }
        .el-section-wrapper.section-tone-contrast .block-section__inner.shell-plain {
            background:
                radial-gradient(circle at top right, rgba(var(--primary-rgb), 0.09), transparent 24%),
                linear-gradient(180deg, rgba(255,255,255,0.96), rgba(248,250,252,0.86));
            border-color: rgba(var(--primary-rgb), 0.12);
            box-shadow: var(--shadow-lift);
        }

        .skeleton-conversion-funnel { --section-y: clamp(5.25rem, 8vw, 6.6rem); }
        .skeleton-editorial-longform { --section-y: clamp(8rem, 10vw, 10rem); }
        .skeleton-premium-showcase { --section-y: clamp(8.5rem, 11vw, 11.5rem); }
        .skeleton-local-directory { --section-y: clamp(6.4rem, 9vw, 8rem); }

        /* Section Shells & Layout Systems */
        .section-shell { width: 100%; transition: all 0.35s ease; position: relative; }
        .shell-panel { 
            background: rgba(255, 255, 255, 0.9); 
            border: 1px solid rgba(148, 163, 184, 0.1); 
            border-radius: var(--radius); 
            padding: clamp(1.4rem, 3vw, 3rem); 
            margin: 2rem 0; 
            box-shadow: var(--shadow-lg); 
            backdrop-filter: blur(8px); /* Point 3 */
        }
        .shell-band { background: var(--surface-alt); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); padding: 5rem 0; }
        .shell-editorial { padding: 8rem 0; border-left: 8px solid var(--primary); background: linear-gradient(to right, var(--surface-alt), transparent); }
        .shell-plain { padding: var(--section-y) 0; }

        .system-panelled .semantic-card, .service-card, .proof-card, .step-card, .faq-item, .trust-strip, .urgency-layout__copy, .cta-panel__bar, .urgency-banner, .section-cta--terminal {
            background: #ffffff; 
            padding: var(--family-shell-padding, var(--shell-padding));
            border-radius: var(--radius-card); 
            border: 1px solid var(--border); 
            box-shadow: var(--shadow-soft); 
            transition: transform var(--trans-main), box-shadow var(--trans-main), border-color var(--trans-main); 
            position: relative; 
            overflow: hidden; 
        }
        .system-panelled .semantic-card:hover, .service-card:hover, .proof-card:hover, .step-card:hover, .faq-item:hover, .trust-strip:hover, .urgency-layout__copy:hover, .cta-panel__bar:hover, .urgency-banner:hover {
            transform: translateY(-2px); /* Point 7 - Sutil hover */
            box-shadow: var(--shadow-lift); 
            border-color: rgba(var(--primary-rgb), 0.15); 
        }
        .system-panelled .semantic-card:before, .service-card:before, .proof-card:before, .step-card:before, .trust-strip:before, .urgency-layout__copy:before, .cta-panel__bar:before, .urgency-banner:before, .section-cta--terminal:before, .hero__minimal:before {
            content: ""; position: absolute; left: 0; right: 0; top: 0; height: 1px; 
            background: linear-gradient(90deg, transparent, rgba(var(--primary-rgb), 0.1), rgba(var(--primary-rgb), 0.1), transparent); /* Point 7 - Less shine */
        }

        .system-grid .services-grid, .system-grid .trust-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.2rem; }
        .system-minimal .semantic-card { border: none; padding: 1rem 0; border-bottom: 1px solid var(--border); border-radius: 0; }
        .system-editorial .semantic-card { border-left: 4px solid var(--primary); padding-left: 2rem; margin-bottom: 3rem; }

        /* Point 8 - Solid Hero Card */
        .hero-card--solid {
            background: #ffffff !important;
            border: 1px solid var(--border) !important;
            padding: 2.5rem !important;
            box-shadow: var(--shadow-lift) !important;
        }
        .card__title-small { font-size: 1.25rem; font-weight: 800; margin-bottom: 0.75rem; color: var(--text); }
        .card__text-compact { font-size: 0.95rem; line-height: 1.5; color: var(--muted); margin-bottom: 1.5rem; }

        .emphasis-trust { --primary: #10b981; border-color: #10b981; }
        .emphasis-cta { --primary: #f59e0b; background: rgba(245, 158, 11, 0.05); }

        .hero__aside--visual { display: grid; gap: 1.15rem; align-content: start; }
        .hero__centered--with-media { display: grid; gap: 1.4rem; justify-items: center; }
        .hero-visual, .editorial-visual-card { margin: 0; width: 100%; }
        .hero-visual__frame, .editorial-visual-card__frame {
            position: relative;
            overflow: hidden;
            border-radius: calc(var(--radius-card) + 0.45rem);
            border: 1px solid rgba(255,255,255,0.22);
            background: linear-gradient(180deg, rgba(255,255,255,0.16), rgba(255,255,255,0.06));
            box-shadow: var(--shadow-lift);
        }
        .hero-visual__frame { aspect-ratio: 4 / 3; }
        .editorial-visual-card__frame { aspect-ratio: 16 / 9; }
        .hero-visual__frame img, .editorial-visual-card__frame img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
            transform: scale(1.02);
            transition: transform 0.8s ease;
        }
        .hero-visual:hover img { transform: scale(1.05); }

        .hero-visual__caption, .editorial-visual-card__caption {
            display: none !important; /* Systemic removal of all captions as requested */
        }
        .editorial-visual-strip {
            padding: 0 0 calc(var(--section-y) * 0.9);
        }
        .editorial-visual-card {
            max-width: 1040px;
            margin: 0 auto;
            padding: 1rem;
            border-radius: calc(var(--radius-section) + 0.4rem);
            background: linear-gradient(180deg, rgba(255,255,255,0.78), rgba(255,255,255,0.58));
            border: 1px solid rgba(255,255,255,0.76);
            box-shadow: var(--shadow-soft);
            backdrop-filter: blur(12px);
        }

        .semantic-items, .services-grid, .trust-grid, .services-grid__cards, .local-proof__grid, .process-steps__timeline {
            margin-top: var(--rhythm-grid);
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: clamp(1.1rem, 2vw, 1.7rem);
        }
        .services-grid__editorial {
            margin-top: var(--rhythm-grid);
            display: grid;
            grid-template-columns: minmax(0, 0.92fr) minmax(0, 1.08fr);
            gap: clamp(1.1rem, 2.6vw, 2rem);
            align-items: start;
        }
        .services-grid__lead,
        .services-grid__column-list {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            min-width: 0;
        }
        .service-row {
            padding: 1rem 0 1.1rem;
            border-top: 1px solid rgba(148, 163, 184, 0.16);
        }
        .service-row:first-child {
            border-top: none;
            padding-top: 0;
        }
        .services-grid__trust, .services-grid__pills, .block__pills {
            list-style: none;
            display: flex;
            flex-wrap: wrap;
            gap: 0.65rem 0.85rem;
            padding: 0;
            margin: 0.8rem 0 0;
            width: 100%;
        }
        .service-row__meta li, .block__pill {
            display: inline-flex;
            align-items: center;
            min-height: 2.1rem;
            padding: 0 0.85rem;
            border-radius: 6px; /* Slightly sharper premium look */
            background: linear-gradient(135deg, rgba(var(--primary-rgb), 0.08) 0%, rgba(var(--primary-rgb), 0.03) 100%);
            border: 1px solid rgba(var(--primary-rgb), 0.12);
            font-size: 0.86rem;
            font-weight: 600;
            color: var(--text);
            box-shadow: 0 1px 2px rgba(0,0,0,0.02);
            white-space: nowrap;
        }
        .services-grid__cards,
        .local-proof__grid,
        .process-steps__timeline {
            align-items: stretch;
        }
        .semantic-card h3, .service-card h3, .step-card h3 { font-size: var(--h3-size); margin-bottom: 1rem; color: var(--text); line-height: 1.2; }
        .semantic-card p, .service-card p, .proof-card p, .step-card p { font-size: var(--body-md-size); color: var(--muted); opacity: 1; line-height: 1.65; }
        .generic-layout { margin-top: 1.5rem; }

        .proof-card__label { display: block; font-family: var(--font-display); font-size: 1.18rem; font-weight: 800; color: var(--text); margin-bottom: 0.7rem; }

        .local-proof__signal-list,
        .trust-band__signal-grid,
        .trust-band__pills--cards {
            display: grid;
            gap: 0.9rem;
        }
        .local-proof__signal-list {
            margin-top: 1.1rem;
        }
        .local-proof__signal,
        .trust-band__signal-card {
            display: grid;
            grid-template-columns: auto minmax(0, 1fr);
            gap: 0.85rem;
            align-items: start;
            padding: 1rem 1.05rem;
            border-radius: 1rem;
            background: rgba(255,255,255,0.82);
            border: 1px solid rgba(148, 163, 184, 0.16);
            box-shadow: var(--shadow-soft);
        }
        .local-proof__signal-index,
        .trust-band__signal-index,
        .proof-row__ordinal,
        .step-card__index,
        .step-tile__index {
            display: inline-grid;
            place-items: center;
            width: 2.8rem;
            height: 2.8rem;
            border-radius: 0.75rem;
            background: linear-gradient(135deg, var(--primary) 0%, color-mix(in srgb, var(--primary), #000 15%) 100%);
            color: #ffffff;
            font-size: 1.1rem;
            font-weight: 900;
            letter-spacing: 0.05em;
            flex: 0 0 auto;
            box-shadow: 0 4px 12px rgba(var(--primary-rgb), 0.25);
            border: 1px solid rgba(255,255,255,0.2);
        }
        .step-tile__index { margin-bottom: 1.25rem; }
        .local-proof__signal-copy,
        .trust-band__signal-copy {
            display: grid;
            gap: 0.28rem;
            min-width: 0;
        }
        .local-proof__signal-copy strong,
        .trust-band__signal-copy h3,
        .trust-band__pill-title {
            color: var(--text);
            line-height: 1.2;
            margin: 0;
        }
        .local-proof__signal-copy span,
        .trust-band__signal-copy p,
        .trust-band__pill-text {
            color: var(--muted);
            font-size: 0.95rem;
            line-height: 1.55;
            margin: 0;
        }
        .local-proof__evidence-layout {
            display: grid;
            grid-template-columns: minmax(0, 0.92fr) minmax(0, 1.08fr);
            gap: clamp(1.1rem, 2.6vw, 2rem);
            align-items: start;
        }
        .local-proof__evidence-stack,
        .local-proof__details {
            display: grid;
            gap: 0.95rem;
        }
        .proof-row {
            display: grid;
            gap: 0.7rem;
            padding: 1.05rem 1.1rem;
            border-radius: 1rem;
            background: rgba(255,255,255,0.84);
            border: 1px solid rgba(148, 163, 184, 0.16);
            box-shadow: var(--shadow-soft);
        }
        .proof-row--stacked {
            grid-template-columns: auto minmax(0, 1fr);
            gap: 0.95rem;
            align-items: start;
        }
        .proof-row__content {
            display: grid;
            gap: 0.45rem;
        }
        .proof-row__meta {
            list-style: none;
            display: flex;
            flex-wrap: wrap;
            gap: 0.45rem;
            padding: 0;
            margin: 0.15rem 0 0;
        }
        .proof-row__meta li {
            display: inline-flex;
            align-items: center;
            min-height: 1.8rem;
            padding: 0 0.65rem;
            border-radius: 999px;
            background: rgba(15,23,42,0.04);
            border: 1px solid rgba(148, 163, 184, 0.14);
            font-size: 0.82rem;
            color: var(--muted);
        }
        .trust-band__pills--cards {
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        }
        .trust-band__pill-card {
            display: grid;
            gap: 0.45rem;
            padding: 1rem 1.05rem;
            border-radius: 1rem;
            background: rgba(255,255,255,0.88);
            border: 1px solid rgba(148, 163, 184, 0.16);
            box-shadow: var(--shadow-soft);
        }
        .trust-band__pill-kicker {
            font-size: 0.82rem;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            font-weight: 800;
            color: var(--primary);
        }

        .editorial-lead { font-size: 1.15rem; max-width: 60ch; margin-bottom: 2.5rem; color: var(--muted); } /* Point 6 */
        .block__header {
            display: flex;
            flex-direction: column;
            gap: 0.7rem;
            margin-bottom: clamp(1rem, 2vw, 1.5rem);
        }
        .block__header .block__title,
        .block__header h2,
        .block__header h3,
        .semantic-card h3,
        .service-card h3,
        .proof-card h3,
        .step-card h3 {
            margin-bottom: 0;
        }
        .block__intro,
        .urgency-layout__intro,
        .faq-block__intro,
        .pricing-layout__intro {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }
        .block__intro p,
        .urgency-layout__intro p,
        .faq-block__intro p,
        .pricing-layout__intro p,
        .semantic-card p,
        .service-card p,
        .proof-card p,
        .step-card p,
        .faq-item p,
        .cta-panel p {
            margin-bottom: 0;
        }
        .semantic-card > :last-child,
        .service-card > :last-child,
        .proof-card > :last-child,
        .step-card > :last-child,
        .faq-item > :last-child,
        .trust-strip > :last-child,
        .urgency-layout__copy > :last-child,
        .cta-panel__bar > :last-child,
        .urgency-banner > :last-child,
        .section-cta--terminal > :last-child {
            margin-bottom: 0;
        }
        .block__cta-group {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 0.75rem 1rem;
            width: 100%;
        }
        .block__cta-phone,
        .block__cta-note {
            display: inline-flex;
            align-items: center;
            min-height: 2.4rem;
            padding: 0.45rem 0.8rem;
            border-radius: 999px;
            background: rgba(15,23,42,0.045);
            border: 1px solid rgba(148, 163, 184, 0.16);
            font-size: 0.92rem;
            line-height: 1.2;
        }
        .block__cta-phone {
            color: var(--text);
            font-weight: 800;
        }
        .block__cta-note {
            color: var(--muted);
            font-weight: 600;
        }

        /* Point 11 - Refined FAQ */
        .faq-list-clean { display: flex; flex-direction: column; gap: 0.9rem; }
        .faq-block__accordion,
        .faq-block__editorial-list {
            display: grid;
            gap: 0.95rem;
            margin-top: 1.1rem;
        }
        .faq-item-refined {
            background: #ffffff;
            border: 1px solid var(--border);
            border-radius: 0.9rem;
            overflow: hidden;
            transition: all var(--trans-main);
        }
        .faq-item-refined:hover { border-color: rgba(var(--primary-rgb), 0.2); }
        .faq-summary-refined { 
            padding: 1.25rem 1.5rem; 
            list-style: none; 
            cursor: pointer; 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            font-weight: 700;
            color: var(--text);
        }
        .faq-summary-refined::-webkit-details-marker { display: none; }
        .faq-icon-arrow:after { content: "↓"; font-size: 1.1rem; color: var(--primary); transition: transform 0.3s; opacity: 0.6; }
        .faq-item-refined[open] .faq-icon-arrow:after { transform: rotate(180deg); }
        .faq-content-refined { padding: 0 1.5rem 1.5rem 1.5rem; color: var(--muted); font-size: 1rem; border-top: 1px solid var(--border); padding-top: 1rem; margin-top: -1px; }
        .faq-block__editorial-list {
            grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .faq-entry {
            display: flex;
            flex-direction: column;
            gap: 0.7rem;
            padding: 1.25rem 1.35rem;
            border-radius: 1rem;
            border: 1px solid rgba(148, 163, 184, 0.16);
            background: rgba(255,255,255,0.84);
            box-shadow: var(--shadow-soft);
        }
        .faq-entry h3 {
            margin: 0;
            font-size: 1.05rem;
            line-height: 1.25;
        }
        .faq-entry p {
            margin: 0;
            color: var(--muted);
            line-height: 1.65;
        }

        .table-wrap { overflow-x: auto; margin: 3rem 0; border-radius: 1rem; border: 1px solid var(--border); }
        .section-cta { margin-top: 0; text-align: center; }

        .faq-item { margin-bottom: 0.85rem; border-radius: 1.2rem; }
        .faq-item summary { padding: 1.2rem 1.25rem; font-weight: 800; cursor: pointer; list-style: none; display: flex; justify-content: space-between; align-items: center; color: var(--text); }
        .faq-item summary::-webkit-details-marker { display: none; }
        .faq-item summary:after { content: "+"; font-size: 1.5rem; color: var(--primary); }
        .faq-item[open] summary:after { content: "−"; }
        .faq-item div { padding: 0 1.25rem 1.2rem 1.25rem; border-top: 1px solid var(--border); }
        
        /* Layout Flow Systems */
        .flow-stack { display: flex; flex-direction: column; gap: var(--family-content-gap, var(--flow-gap)); }
        .flow-centered { max-width: 800px; margin-left: auto; margin-right: auto; text-align: center; }
        .flow-split { display: grid; grid-template-columns: 1fr 1fr; gap: calc(var(--family-content-gap, var(--flow-gap)) * 1.45); align-items: center; }
        .flow-asymmetric { display: grid; grid-template-columns: 1.4fr 0.6fr; gap: calc(var(--family-content-gap, var(--flow-gap)) * 1.45); align-items: center; }
        .flow-zigzag:nth-child(even) { direction: rtl; }
        .flow-zigzag:nth-child(even) > * { direction: ltr; }
        .flow-zigzag { display: grid; grid-template-columns: 1fr 1fr; gap: calc(var(--family-content-gap, var(--flow-gap)) * 1.45); align-items: center; }

        /* Header & Navigation */
        .site-header { background: transparent; backdrop-filter: blur(8px); position: sticky; top: 0; z-index: 1000; border-bottom: none; padding: 0.75rem 0; }
        .site-header__inner { 
            display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding: 0.6rem 1rem;
            border-radius: 999px; background: rgba(255, 255, 255, 0.9); border: 1px solid rgba(255, 255, 255, 0.1); 
            box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06); backdrop-filter: blur(12px); 
        }
        .site-header[data-nav-style="prestige"] {
            padding: 0;
            background: linear-gradient(90deg, #07111d 0%, #102033 52%, #07111d 100%);
            backdrop-filter: none;
            box-shadow: 0 14px 32px rgba(2, 6, 23, 0.26);
            border-bottom: 1px solid rgba(199, 165, 74, 0.16);
        }
        .site-header[data-nav-style="prestige"] .el-container { max-width: 100%; padding: 0; }
        .site-header[data-nav-style="prestige"] .site-header__inner {
            background: transparent;
            border: none;
            box-shadow: none;
            border-radius: 0;
            padding: 0.95rem clamp(1.2rem, 4vw, 2.4rem);
        }
        .site-header[data-nav-style="prestige"] .brand__name { color: #f8fafc; font-size: 0.98rem; letter-spacing: 0.16em; text-transform: uppercase; }
        .site-header[data-nav-style="prestige"] .nav { margin-left: auto; }
        .site-header[data-nav-style="prestige"] .nav__links-group { gap: 0.35rem; }
        .site-header[data-nav-style="prestige"] .nav__link {
            color: rgba(255,255,255,0.9);
            font-size: 0.88rem;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            padding: 0.9rem 1rem;
            border-radius: 0;
            position: relative;
        }
        .site-header[data-nav-style="prestige"] .nav__link::after {
            content: "";
            position: absolute;
            left: 0.9rem;
            right: 0.9rem;
            bottom: 0.2rem;
            height: 2px;
            background: linear-gradient(90deg, transparent, #c7a54a, transparent);
            transform: scaleX(0);
            transform-origin: center;
            transition: transform var(--trans-main);
        }
        .site-header[data-nav-style="prestige"] .nav__link:hover,
        .site-header[data-nav-style="prestige"] .nav__link.is-active { color: #ffffff; background: transparent; }
        .site-header[data-nav-style="prestige"] .nav__link:hover::after,
        .site-header[data-nav-style="prestige"] .nav__link.is-active::after { transform: scaleX(1); }
        .site-header[data-nav-style="prestige"] .nav__cta {
            background: rgba(255,255,255,0.08);
            border: 1px solid rgba(255,255,255,0.14);
            box-shadow: none;
            color: #f8fafc;
        }
        .nav__links-group { display: flex; gap: 0.25rem; }
        .brand { text-decoration: none; display: flex; align-items: center; gap: 0.5rem; }
        .brand__name { font-family: var(--font-display); font-weight: 900; color: var(--primary); font-size: 1.12rem; letter-spacing: -0.02em; }
        .nav { display: flex; align-items: center; gap: 1rem; }
        .nav-mobile { display: none; margin-left: auto; width: min(100%, 22rem); }
        .nav-mobile__summary { list-style: none; display: inline-flex; align-items: center; justify-content: space-between; gap: 0.75rem; min-height: 2.85rem; width: 100%; padding: 0 1rem; border-radius: 999px; background: rgba(255,255,255,0.9); border: 1px solid rgba(148,163,184,0.14); box-shadow: 0 8px 24px rgba(15,23,42,0.06); cursor: pointer; font-weight: 800; color: var(--text); }
        .nav-mobile__summary::-webkit-details-marker { display: none; }
        .nav-mobile__summary-icon { position: relative; width: 1.1rem; height: 0.9rem; display: inline-block; }
        .nav-mobile__summary-icon::before, .nav-mobile__summary-icon::after, .nav-mobile__summary-icon span { content: ''; position: absolute; left: 0; right: 0; height: 2px; border-radius: 999px; background: currentColor; transition: transform var(--trans-main), opacity var(--trans-main), top var(--trans-main); }
        .nav-mobile__summary-icon::before { top: 0.1rem; }
        .nav-mobile__summary-icon::after { bottom: 0.1rem; }
        .nav-mobile__summary-icon { border-top: 2px solid currentColor; border-bottom: 0; }
        .nav-mobile[open] .nav-mobile__summary-icon { border-top-color: transparent; }
        .nav-mobile[open] .nav-mobile__summary-icon::before { top: 0.4rem; transform: rotate(45deg); }
        .nav-mobile[open] .nav-mobile__summary-icon::after { bottom: 0.35rem; transform: rotate(-45deg); }
        .nav-mobile__panel { margin-top: 0.75rem; padding: 1rem; border-radius: 1.2rem; background: rgba(255,255,255,0.96); border: 1px solid rgba(148,163,184,0.14); box-shadow: var(--shadow-lift); display: grid; gap: 0.9rem; }
        .nav-mobile__links { display: grid; gap: 0.55rem; }
        .nav-mobile__link { display: block; padding: 0.9rem 1rem; border-radius: 0.95rem; text-decoration: none; font-weight: 700; color: var(--text); background: rgba(15,23,42,0.03); border: 1px solid rgba(148,163,184,0.12); }
        .nav-mobile__cta { width: 100%; justify-content: center; }
        .nav__link { text-decoration: none; color: var(--muted); font-weight: 600; transition: all var(--trans-main); font-size: 0.95rem; padding: 0.6rem 0.9rem; border-radius: 999px; }
        .nav__link:hover { color: var(--text); background: rgba(15, 23, 42, 0.04); }
        .nav__cta { 
            height: 2.85rem !important;
            padding: 0 1.25rem !important; 
            font-size: 0.9rem !important; 
            gap: 0.5rem;
        }
        .cta-primary__icon { font-size: 1rem; }

        /* Point 10 - Refined Trust Strip */
        .section-trust-strip {
            padding: clamp(2rem, 4vw, 3rem) 0;
            background: linear-gradient(180deg, rgba(255,255,255,0.36), rgba(241,245,249,0.7));
            border-top: 1px solid rgba(148, 163, 184, 0.18);
            border-bottom: 1px solid rgba(148, 163, 184, 0.12);
        }
        .trust-strip-editorial {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 3rem;
            flex-wrap: wrap;
            padding: 0.8rem 1rem;
            border-radius: 999px;
            background: rgba(255,255,255,0.7);
            border: 1px solid rgba(255,255,255,0.82);
            box-shadow: 0 12px 28px rgba(15,23,42,0.06);
        }
        .trust-strip__label { font-size: 0.82rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em; color: var(--muted); opacity: 0.7; }
        .trust-strip__pills { display: flex; gap: 1.5rem; flex-wrap: wrap; justify-content: center; }
        .trust-pill-refined { font-size: 0.88rem; font-weight: 600; color: var(--text); display: flex; align-items: center; gap: 0.5rem; }
        .trust-pill-refined:before { content: "•"; color: var(--primary); font-size: 1.2rem; }

        .cta-panel__bar {
            margin-top: calc(var(--rhythm-cta) * 0.75);
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            gap: 1rem 1.5rem;
            align-items: center;
        }
        .cta-panel__copy {
            display: flex;
            flex-direction: column;
            gap: 0.7rem;
            min-width: 0;
        }
        .cta-panel__bar .block__cta-group {
            justify-content: flex-end;
        }
        .cta-panel__banner {
            display: grid;
            grid-template-columns: minmax(0, 1.1fr) minmax(280px, 0.9fr);
            gap: clamp(1.25rem, 2.5vw, 2rem);
            align-items: stretch;
            padding: clamp(1.5rem, 3vw, 2.2rem);
            border-radius: calc(var(--radius-card) + 0.35rem);
            background:
                radial-gradient(circle at top right, rgba(var(--primary-rgb), 0.10), transparent 26%),
                linear-gradient(135deg, rgba(255,255,255,0.98), rgba(248,250,252,0.94));
            border: 1px solid rgba(var(--primary-rgb), 0.14);
            box-shadow: var(--shadow-lift);
        }
        .cta-panel__banner-copy,
        .cta-panel__banner-actions {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            min-width: 0;
        }
        .cta-panel__banner-actions {
            justify-content: center;
            padding: clamp(1rem, 2vw, 1.35rem);
            border-radius: calc(var(--radius-card) + 0.15rem);
            background: rgba(255,255,255,0.76);
            border: 1px solid rgba(148, 163, 184, 0.16);
        }
        .cta-panel__trust {
            display: flex;
            flex-wrap: wrap;
            gap: 0.65rem;
        }
        .cta-panel__bullets {
            display: grid;
            gap: 0.65rem;
        }
        .cta-panel--luxury .block__cta-group,
        .cta-panel--bar .block__cta-group {
            margin-top: 0.4rem;
        }

        @media (max-width: 820px) {
            .services-grid__editorial,
            .faq-block__editorial-list,
            .cta-panel__bar {
                grid-template-columns: 1fr;
            }
            .cta-panel__bar .block__cta-group {
                justify-content: flex-start;
            }
        }

        /* Urgency & Map System */
        .card--strong-border {
            position: relative;
            overflow: hidden;
            border: 1px solid rgba(var(--primary-rgb), 0.18);
            box-shadow: var(--shadow-lift);
        }
        .card--strong-border::after {
            content: "";
            position: absolute;
            inset: 0 0 auto 0;
            height: 3px;
            background: linear-gradient(90deg, rgba(var(--primary-rgb), 0.18), rgba(var(--primary-rgb), 0.72), rgba(var(--primary-rgb), 0.18));
            pointer-events: none;
        }

        .urgency-layout {
            display: grid;
            gap: clamp(1rem, 2vw, 1.5rem);
            align-items: stretch;
            margin-top: 1rem;
        }
        .urgency-layout__copy,
        .urgency-layout__action {
            height: 100%;
        }
        .urgency-layout__copy {
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 1rem;
        }
        .urgency-layout__action {
            display: flex;
            align-items: stretch;
        }
        .urgency-layout__action .section-cta,
        .urgency-layout__action .section-cta--terminal {
            width: 100%;
        }

        .urgency-banner {
            position: relative;
            display: grid;
            grid-template-columns: minmax(0, 1.15fr) minmax(240px, 0.85fr);
            gap: clamp(1rem, 2vw, 1.75rem);
            align-items: center;
            padding: clamp(1.35rem, 2.4vw, 2rem);
            background: linear-gradient(135deg, rgba(255,255,255,0.97), rgba(248,250,252,0.92));
            border-radius: calc(var(--radius-card) + 0.3rem);
            isolation: isolate;
        }
        .urgency-banner--command {
            grid-template-columns: minmax(0, 1fr) minmax(180px, 0.42fr) minmax(250px, 0.7fr);
        }
        .urgency-banner__rail,
        .urgency-banner__sidebar {
            position: absolute;
            left: 0.8rem;
            top: 0.9rem;
            bottom: 0.9rem;
            width: 0.4rem;
            border-radius: 999px;
            background: linear-gradient(180deg, rgba(var(--primary-rgb), 0.96), rgba(var(--primary-rgb), 0.18));
            opacity: 0.92;
        }
        .urgency-banner__content {
            display: flex;
            flex-direction: column;
            gap: 0.9rem;
            min-width: 0;
            padding-left: 1rem;
        }
        .urgency-banner__status,
        .status-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.65rem;
            flex-wrap: wrap;
            width: fit-content;
            max-width: 100%;
            padding: 0.55rem 0.85rem;
            border-radius: 999px;
            background: rgba(var(--primary-rgb), 0.08);
            border: 1px solid rgba(var(--primary-rgb), 0.14);
            color: var(--text);
            font-size: 0.8rem;
            font-weight: 800;
            letter-spacing: 0.04em;
            text-transform: uppercase;
        }
        .urgency-banner__dot,
        .status-badge__dot {
            width: 0.72rem;
            height: 0.72rem;
            border-radius: 999px;
            background: #22c55e;
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.42);
            animation: pulse 2s infinite;
            flex: 0 0 auto;
        }
        .urgency-banner__kicker,
        .urgency-banner__title,
        .counter-box__label {
            color: var(--text);
            font-weight: 800;
        }
        .urgency-banner__title {
            margin-bottom: 0.45rem;
        }
        .urgency-banner__subtitle {
            color: var(--muted);
            margin-bottom: 0;
            max-width: 58ch;
        }
        .urgency-banner__pills {
            display: flex;
            flex-wrap: wrap;
            gap: 0.6rem;
        }
        .urgency-banner__pills .block__pill,
        .map-block__pills .block__pill,
        .map-footer .cta-secondary,
        .map-status {
            display: inline-flex;
            align-items: center;
            gap: 0.45rem;
            padding: 0.58rem 0.85rem;
            border-radius: 999px;
            background: rgba(15,23,42,0.035);
            border: 1px solid rgba(148, 163, 184, 0.2);
            font-size: 0.9rem;
            line-height: 1.1;
        }
        .urgency-banner__cta {
            display: flex;
            justify-content: flex-end;
            align-items: center;
        }
        .urgency-banner__cta .block__cta-group {
            width: 100%;
            justify-content: flex-end;
        }
        .urgency-banner__statbox,
        .counter-box {
            position: relative;
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 0.35rem;
            min-height: 100%;
            padding: 1.15rem 1.1rem;
            border-radius: calc(var(--radius-card) + 0.15rem);
            background: linear-gradient(180deg, rgba(var(--primary-rgb), 0.08), rgba(var(--primary-rgb), 0.03));
            border: 1px solid rgba(var(--primary-rgb), 0.14);
            text-align: left;
        }
        .urgency-banner__statlabel,
        .counter-box__label {
            font-size: 0.82rem;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            opacity: 0.72;
        }
        .urgency-banner__statvalue,
        .counter-box__value {
            font-family: var(--font-display);
            font-size: clamp(1.6rem, 2.2vw, 2rem);
            line-height: 1;
            color: var(--heading);
        }
        .urgency-banner__statnote,
        .counter-box__unit {
            font-size: 0.9rem;
            font-weight: 700;
            color: var(--primary);
            opacity: 0.8;
        }
        .urgency-banner--command .urgency-banner__statbox {
            background: linear-gradient(135deg, rgba(var(--primary-rgb), 0.12) 0%, rgba(var(--primary-rgb), 0.04) 100%);
            border-color: rgba(var(--primary-rgb), 0.2);
        }

        .map-block {
            display: flex;
            flex-direction: column;
            gap: clamp(1rem, 2vw, 1.5rem);
        }
        .map-block__split,
        .map-directory,
        .map-grid {
            display: grid;
            grid-template-columns: minmax(0, 0.88fr) minmax(0, 1.12fr);
            gap: clamp(1.1rem, 2.6vw, 2rem);
            align-items: stretch;
        }
        .map-block__spotlight {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }
        .map-block__spotlight-head,
        .map-block__copy,
        .map-directory__content,
        .map-info {
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 0.95rem;
            min-width: 0;
        }
        .map-block__frame,
        .map-wrapper,
        .map-boxed-wrapper,
        .map-directory__visual {
            position: relative;
            display: block;
            min-height: clamp(300px, 38vw, 480px);
            height: 100%; /* Ensure it fills the flex/grid container (User Fix) */
            border-radius: clamp(1.1rem, 2vw, 1.6rem);
            overflow: hidden;
            border: 1px solid rgba(var(--primary-rgb), 0.14);
            box-shadow: 0 18px 42px rgba(15, 23, 42, 0.1);
            background:
                linear-gradient(180deg, rgba(255,255,255,0.94), rgba(248,250,252,0.9)),
                radial-gradient(circle at top right, rgba(var(--primary-rgb), 0.12), transparent 28%);
        }
        .map-block__frame iframe,
        .map-wrapper iframe,
        .map-boxed-wrapper iframe {
            height: 100% !important;
        }
        .map-block__overlay {
            position: absolute;
            top: 1rem;
            left: 1rem;
            right: 1rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 0.75rem;
            pointer-events: none;
        }
        .map-block__overlay-badge,
        .map-block__overlay-city {
            display: inline-flex;
            align-items: center;
            min-height: 2.2rem;
            padding: 0 0.9rem;
            border-radius: 999px;
            background: rgba(255,255,255,0.78);
            border: 1px solid rgba(255,255,255,0.88);
            backdrop-filter: blur(12px);
            box-shadow: 0 8px 22px rgba(15, 23, 42, 0.08);
            font-size: 0.8rem;
            font-weight: 800;
            color: var(--text);
        }
        .map-block__overlay-city {
            color: var(--primary);
        }
        .map-block__meta,
        .map-block__actions,
        .map-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 0.85rem 1rem;
            flex-wrap: wrap;
        }
        .map-block__pills {
            display: flex;
            flex-wrap: wrap;
            gap: 0.65rem;
        }
        .map-block__note,
        .map-description {
            color: var(--muted);
            margin-bottom: 0;
            max-width: 60ch;
        }
        .map-fallback {
            min-height: inherit;
            display: grid;
            place-items: center;
            padding: 1.5rem;
            background:
                linear-gradient(135deg, rgba(var(--primary-rgb), 0.08), rgba(15,23,42,0.03)),
                repeating-linear-gradient(135deg, rgba(255,255,255,0.26) 0 16px, rgba(255,255,255,0.1) 16px 32px);
        }
        .map-fallback__inner,
        .map-block__fallback {
            display: grid;
            gap: 0.55rem;
            justify-items: center;
            text-align: center;
            padding: 1.5rem;
            border-radius: 1.2rem;
            border: 1px dashed rgba(var(--primary-rgb), 0.28);
            background: rgba(255,255,255,0.62);
            color: var(--muted);
        }
        .map-status .status-dot {
            color: #22c55e;
            font-size: 1rem;
            line-height: 1;
        }

        /* Hero Blocks */
        .hero { position: relative; padding: clamp(1.5rem, 3vw, 2.5rem) 0 0; overflow: hidden; background: transparent; }
        .hero--grid .el-container { max-width: 1360px; width: 100%; }
        .hero-immersive { display: grid; gap: 1rem; }
        .hero-immersive__media {
            position: relative;
            min-height: clamp(520px, 72vh, 760px);
            border-radius: 0 0 1.8rem 1.8rem;
            overflow: hidden;
            margin: 0;
            box-shadow: 0 28px 60px rgba(15, 23, 42, 0.22);
        }
        .hero-immersive__media img {
            width: 100%; height: 100%; object-fit: cover; display: block;
            position: absolute; inset: 0;
            transform: scale(1.02);
        }
        .hero-immersive__shade {
            position: absolute; inset: 0;
            background: linear-gradient(180deg, rgba(6,12,22,0.28) 0%, rgba(6,12,22,0.28) 12%, rgba(6,12,22,0.44) 48%, rgba(6,12,22,0.62) 100%);
        }
        .hero-immersive__copy {
            position: absolute;
            left: 50%; top: 50%; transform: translate(-50%, -44%);
            width: min(920px, calc(100% - 2rem));
            text-align: center;
            color: #ffffff;
            z-index: 2;
        }
        .hero-immersive__title { color: #ffffff; font-size: clamp(2.8rem, 6.2vw, 5rem); margin: 0 0 1rem; text-shadow: 0 10px 24px rgba(0,0,0,0.24); }
        .hero-immersive__subtitle { margin: 0 auto; max-width: 42rem; font-size: clamp(1.02rem, 1.7vw, 1.32rem); color: rgba(255,255,255,0.92); line-height: 1.55; }
        .hero__eyebrow--luxury {
            background: rgba(255,255,255,0.08);
            color: #f8fafc;
            border-color: rgba(199, 165, 74, 0.34);
            box-shadow: inset 0 0 0 1px rgba(255,255,255,0.04);
        }
        .cta-row--hero-overlay { justify-content: center; margin-top: 2rem; }
        .hero-immersive__lower {
            display: grid;
            grid-template-columns: minmax(0, 1.25fr) minmax(320px, 0.75fr);
            gap: 1rem;
            margin-top: -3rem;
            position: relative;
            z-index: 3;
        }
        .hero-immersive__highlights {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 1rem;
        }
        .hero-highlight,
        .hero-card--floating {
            background: rgba(255,255,255,0.96);
            border: 1px solid rgba(148, 163, 184, 0.14);
            box-shadow: 0 18px 40px rgba(15, 23, 42, 0.12);
            border-radius: 1.3rem;
        }
        .hero-highlight {
            display: grid;
            grid-template-columns: auto minmax(0, 1fr);
            gap: 1rem;
            align-items: center; /* Centered text (User Fix) */
            padding: 1.25rem 1.5rem;
            height: 100%; /* Ensure alignment works in large blocks */
        }
        .hero-highlight__index {
            display: inline-grid; place-items: center;
            width: 2.4rem; height: 2.4rem; border-radius: 999px;
            background: rgba(15, 23, 42, 0.08); color: #0f172a; font-size: 0.82rem; font-weight: 900; letter-spacing: 0.08em;
        }
        .hero-highlight__copy { display: grid; gap: 0.2rem; }
        .hero-highlight__copy strong { color: var(--text); line-height: 1.2; }
        .hero-highlight__copy span { color: var(--muted); font-size: 0.9rem; }
        .hero-card--floating { padding: 1.35rem 1.4rem; align-self: stretch; }
        .hero--split .hero__shell { display: grid; grid-template-columns: minmax(0, 1.12fr) minmax(320px, 0.88fr); gap: clamp(2.75rem, 5vw, 5rem); align-items: center; }
        .hero__minimal, .semantic-section__container, .block-section > .el-container, .el-section.vibe-premium > .el-container { 
            background: rgba(255, 255, 255, 0.74); border: 1px solid rgba(255, 255, 255, 0.82); 
            box-shadow: var(--shadow-soft); border-radius: 1.75rem; backdrop-filter: blur(14px); position: relative; overflow: hidden; 
        }
        .hero__minimal {
            padding: clamp(2.3rem, 5vw, 4.6rem);
            max-width: 980px;
            background:
                radial-gradient(circle at top right, rgba(37, 99, 235, 0.12), transparent 26%),
                linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(247, 250, 252, 0.94));
            box-shadow: var(--shadow-dramatic);
        }

        .hero__eyebrow, .block__eyebrow, .card__eyebrow, .trust-strip__label { 
            display: inline-flex; align-items: center; background: rgba(var(--primary-rgb), 0.08); color: var(--primary); 
            padding: 0.55rem 0.95rem; border-radius: 999px; font-weight: 800; font-size: 0.82rem; text-transform: uppercase; 
            letter-spacing: 0.08em; margin-bottom: 1rem; border: 1px solid rgba(var(--primary-rgb), 0.16); 
        }
        .hero__subtitle { font-size: 1.12rem; color: var(--muted); margin-bottom: 2rem; max-width: 650px; }
        .hero__bullets { list-style: none ; }
        .hero__bullets li::before { content: "✔" ; color: var(--primary); margin-right: 0.5rem; font-weight: 900; }
        .cta-row { display: flex; gap: 1.1rem; align-items: center; flex-wrap: wrap; }
        .cta-secondary { font-weight: 700; color: var(--text); text-decoration: none; border-bottom: 2px solid var(--primary); padding-bottom: 2px; }

        /* Typography & Content Body - Procedural Global Lists */
        .rich-content ul,
        .rich-content ol:not(.process-steps__list),
        .shell-plain ul,
        .shell-plain ol:not(.process-steps__list),
        .block-section__inner ul,
        .block-section__inner ol:not(.process-steps__list),
        .semantic-section__container ul,
        .semantic-section__container ol,
        .generic-layout ul,
        .generic-layout ol { 
            list-style: none; 
            margin: 1.5rem 0 2rem; 
            padding: 0;
            display: grid;
            gap: 1.1rem; /* More space for premium feel */
        }
        .rich-content li,
        .shell-plain li,
        .block-section__inner li,
        .semantic-section__container li,
        .generic-layout li { 
            position: relative; 
            padding-left: 2.5rem; 
            font-weight: 500; 
            line-height: 1.55;
            color: var(--text);
            font-size: 1.05rem;
        }
        .rich-content ul > li::before,
        .rich-content ol:not(.process-steps__list) > li::before,
        .shell-plain ul > li::before,
        .shell-plain ol:not(.process-steps__list) > li::before,
        .block-section__inner ul > li::before,
        .block-section__inner ol:not(.process-steps__list) > li::before,
        .semantic-section__container ul > li::before,
        .semantic-section__container ol > li::before,
        .generic-layout ul > li::before,
        .generic-layout ol > li::before { 
            content: ""; 
            position: absolute; 
            left: 0; 
            top: 0.25rem;
            width: 1.6rem;
            height: 1.6rem;
            background: linear-gradient(135deg, rgba(var(--primary-rgb), 0.12) 0%, rgba(var(--primary-rgb), 0.05) 100%);
            border: 1px solid rgba(var(--primary-rgb), 0.18);
            border-radius: 8px; /* Square-ish premium icons */
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.03);
        }
        .rich-content ul > li::after,
        .shell-plain ul > li::after,
        .block-section__inner ul > li::after,
        .semantic-section__container ul > li::after,
        .generic-layout ul > li::after {
            content: "✓";
            position: absolute;
            left: 0.45rem;
            top: 0.28rem;
            color: var(--primary);
            font-weight: 950;
            font-size: 0.95rem;
        }
        .rich-content ol:not(.process-steps__list) > li::after,
        .shell-plain ol:not(.process-steps__list) > li::after,
        .block-section__inner ol:not(.process-steps__list) > li::after,
        .semantic-section__container ol > li::after,
        .generic-layout ol > li::after {
            content: counter(li-counter);
            counter-increment: li-counter;
            position: absolute;
            left: 0;
            top: 0.25rem;
            width: 1.6rem;
            height: 1.6rem;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--primary);
            font-weight: 900;
            font-size: 0.85rem;
        }
        .process-steps__list li {
            list-style: none;
            display: grid;
            grid-template-columns: auto minmax(0, 1fr);
            gap: 1.5rem;
            align-items: start;
            padding: 1.5rem;
            border-radius: 1.25rem;
            background: rgba(255,255,255,0.7);
            border: 1px solid rgba(148, 163, 184, 0.12);
            margin-bottom: 1rem;
            transition: all 0.3s ease;
        }
        .process-steps__list li:hover {
            background: #ffffff;
            box-shadow: var(--shadow-lift);
            border-color: rgba(var(--primary-rgb), 0.2);
        }
        .process-steps__list .step-card__body {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }
        .rich-content ol, .shell-plain ol, .block-section__inner ol {
            counter-reset: li-counter;
        }
        
        /* Tables */
        table { width: 100%; border-collapse: collapse; background: var(--surface); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; margin: 2rem 0; box-shadow: var(--shadow-soft); }
        th, td { padding: 1.15rem 1.35rem; border-bottom: 1px solid var(--border); text-align: left; }
        th { background: var(--surface-alt); font-weight: 800; color: var(--heading); text-transform: uppercase; font-size: 0.8rem; letter-spacing: 0.05em; }

        /* Buttons & Signals */
        .cta-primary { 
            display: inline-flex; align-items: center; justify-content: center; 
            background: linear-gradient(135deg, #0f766e, #0b5c56); 
            color: #ffffff; 
            height: 3.5rem; /* Point 9 - Unified height */
            padding: 0 2.25rem; 
            border-radius: 999px; 
            text-decoration: none; 
            font-weight: 800; 
            transition: all var(--trans-main);
            box-shadow: 0 10px 24px rgba(var(--primary-rgb), 0.15); /* Point 3 - Soft shadow */
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .cta-primary:hover { transform: translateY(-2px); box-shadow: 0 18px 44px rgba(var(--primary-rgb), 0.28); }

        .cta-row--unified { gap: 1.5rem; margin-top: var(--rhythm-cta); } /* Point 9 */

        .testimonials-section { padding-top: calc(var(--section-y) * 0.7); }
        .testimonials-section__header { margin-bottom: 1.6rem; }
        .testimonials-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 1rem;
        }
        .testimonial-card {
            display: grid;
            gap: 1rem;
            padding: 1.35rem;
            border-radius: 1.2rem;
            background: rgba(255,255,255,0.94);
            border: 1px solid rgba(148, 163, 184, 0.16);
            box-shadow: var(--shadow-soft);
        }
        .testimonial-card__stars {
            color: #c7a54a;
            letter-spacing: 0.12em;
            font-size: 0.95rem;
        }
        .testimonial-text {
            margin: 0;
            color: var(--text);
            line-height: 1.7;
            font-size: 0.98rem;
        }
        .testimonial-meta {
            display: flex;
            align-items: center;
            gap: 0.8rem;
        }
        .avatar {
            width: 2.5rem;
            height: 2.5rem;
            border-radius: 999px;
            display: inline-grid;
            place-items: center;
            background: rgba(15, 23, 42, 0.08);
            color: var(--text);
            font-weight: 800;
        }
        .testimonial-name { font-weight: 800; color: var(--text); }
        .testimonial-date { font-size: 0.84rem; color: var(--muted); }

        /* Point 12 - Luxury Footer */
        .footer-editorial { background: #0f172a; color: #ffffff; padding: 6rem 0 4rem; position: relative; }
        .footer__grid-refined { display: grid; grid-template-columns: 1fr 1.5fr; gap: 6rem; align-items: start; }
        .footer__brand-block { max-width: 400px; }
        .footer__brand-name { font-size: 1.75rem; font-weight: 900; margin-bottom: 1.25rem; color: #ffffff; }
        .footer__tagline { font-size: 1rem; color: #94a3b8; line-height: 1.6; }
        .footer__links-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; }
        .footer__group-title { font-size: 0.82rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.2em; color: #64748b; margin-bottom: 2rem; }
        .footer__phone-link { font-size: 1.5rem; font-weight: 800; color: #ffffff; margin-bottom: 0.5rem; display: block; }
        .footer__availability { font-size: 0.9rem; color: #94a3b8; }
        .footer__nav-list { display: flex; flex-direction: column; gap: 0.85rem; }
        .footer__nav-link { color: #94a3b8; text-decoration: none; font-weight: 500; font-size: 0.95rem; transition: color 0.2s; }
        .footer__nav-link:hover { color: #ffffff; }
        .footer__bottom { margin-top: 6rem; padding-top: 2rem; border-top: 1px solid rgba(255, 255, 255, 0.05); text-align: center; font-size: 0.85rem; color: #64748b; }

        /* Footer */
        .footer { background: transparent; color: #fff; padding: 2rem 0 3rem 0; border-top: none; }
        .footer__grid { 
            display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 2rem; padding: 2rem; 
            border-radius: 1.8rem; background: linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(15, 23, 42, 0.94)); 
            box-shadow: 0 28px 70px rgba(15, 23, 42, 0.18); 
        }
        .footer__title { color: #fff; margin-bottom: 1rem; font-size: 1.5rem; }
        .footer__subtitle { color: rgba(255, 255, 255, 0.56); font-weight: 800; margin-bottom: 1rem; text-transform: uppercase; font-size: 0.82rem; letter-spacing: 0.12em; }
        .footer__text { color: rgba(255, 255, 255, 0.74); font-size: 0.95rem; margin-bottom: 0.8rem; }
        .footer__phone { font-size: 1.45rem; font-weight: 900; color: #fff; margin-bottom: 0.45rem; display: block; text-decoration: none; }
        .footer__nav { display: flex; flex-direction: column; gap: 0.75rem; }
        .footer__link { color: rgba(255, 255, 255, 0.72); text-decoration: none; transition: color 0.2s; font-size: 0.92rem; }
        .footer__link:hover { color: #fff; }

        @keyframes pulse {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.45); }
            70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }

        /* Mobile Responsiveness */
        @media (max-width: 1024px) {
            :root { 
                --h1-size: 3.4rem; 
                --h2-size: 2.2rem; 
                --section-y: clamp(5rem, 8vw, 6.25rem); 
                --shell-padding: clamp(1.4rem, 2vw, 2rem);
            }
            .el-container { padding: 0 1.4rem; }
            .semantic-items, .services-grid, .trust-grid, .services-grid__cards, .local-proof__grid, .process-steps__timeline, .footer__grid, .testimonials-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 768px) {
            :root { 
                --h1-size: 2.7rem; 
                --h2-size: 1.85rem; 
                --section-y: clamp(4rem, 7vw, 5rem); 
                --shell-padding: 1.15rem;
                --block-gap: 1rem;
                --flow-gap: 1.4rem;
            }
            .el-container { padding: 0 1rem; }
            .site-header__inner { justify-content: space-between; border-radius: 1.2rem; padding: 1rem; }
            .nav--desktop { display: none; }
            .nav-mobile { display: block; }
            .site-header[data-nav-style="prestige"] .site-header__inner { padding: 0.9rem 1rem; }
            .site-header[data-nav-style="prestige"] .nav-mobile__summary { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.16); color: #f8fafc; box-shadow: none; }
            .site-header[data-nav-style="prestige"] .nav-mobile__panel { background: rgba(7,17,29,0.98); border-color: rgba(255,255,255,0.1); }
            .site-header[data-nav-style="prestige"] .nav-mobile__link { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.08); color: #f8fafc; }
            .site-header[data-nav-style="prestige"] .nav-mobile__cta { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.14); color: #f8fafc; box-shadow: none; }
            .hero-immersive__copy { position: absolute; top: 50%; transform: translate(-50%, -48%); width: min(92%, 42rem); }
            .hero-immersive__media { min-height: 520px; border-radius: 0 0 1.4rem 1.4rem; }
            .hero--split .hero__shell, .hero-immersive__lower, .hero-immersive__highlights { grid-template-columns: 1fr !important; gap: 1rem; text-align: center; direction: ltr !important; }
            .hero__subtitle { margin-left: auto; margin-right: auto; }
            .cta-row { justify-content: center; flex-direction: column; width: 100%; }
            .cta-primary { width: 100%; text-align: center; }
            .block__cta-group { flex-direction: column; align-items: stretch; }
            .block__cta-phone, .block__cta-note { justify-content: center; width: 100%; }
            .footer__grid, .footer__grid-refined, .footer__links-grid, .semantic-items, .services-grid, .trust-grid, .services-grid__cards, .local-proof__grid, .process-steps__timeline, .testimonials-grid { grid-template-columns: 1fr !important; text-align: left; gap: 1.5rem; }
            .map-block__split, .map-directory, .map-grid, .urgency-banner, .urgency-banner--command, .urgency-layout--stack { grid-template-columns: 1fr !important; }
            .footer__grid-refined { gap: 3rem; }
            .footer__links-grid { gap: 2rem; }
            .map-block__frame, .map-wrapper, .map-boxed-wrapper, .map-directory__visual { min-height: 260px; }
            .map-block__overlay { flex-direction: column; align-items: flex-start; }
            .local-proof__evidence-layout, .trust-band__signal-grid, .trust-band__pills--cards { grid-template-columns: 1fr !important; }
            .urgency-banner__content { padding-left: 0.6rem; }
            .site-header__inner { max-width: calc(100vw - 2rem); margin: 0 auto; }
            .urgency-banner__cta, .urgency-banner__cta .block__cta-group, .map-block__actions .block__cta-group, .cta-panel__banner .block__cta-group { width: 100%; justify-content: stretch; }
        }
    `;

    const surfaceClass = dna.surfaceStyle ? `page-surface-${dna.surfaceStyle}` : '';
    const systemClass = dna.visualSystem ? `system-${dna.visualSystem}` : '';
    const heroDispClass = dna.heroDisposition ? `hero-disposition-${dna.heroDisposition.replace('content_', '')}` : '';

    const visualContract = (dna as any).visualIdentityContract || {};
    const visualDialectClass = visualContract.visualDialect ? `dialect-${visualContract.visualDialect}` : "";
    const pageArchetypeClass = visualContract.pageArchetype ? `archetype-${visualContract.pageArchetype}` : "";
    const signatureClass = visualContract.layoutSignature?.rhythm ? `signature-${visualContract.layoutSignature.rhythm}` : "";
    const macroClasses = `skeleton-${skeleton} strategy-proof-${macroProof} strategy-cta-${macroCta} cadence-${macroCadence} family-${dna.family || 'general'} ${visualDialectClass} ${pageArchetypeClass} ${signatureClass}`;


    const slugify = (text: string) =>
        text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

    const resolveGeneratedSectionId = (section: any): string =>
        String(section?.sectionId || section?.id || slugify(section?.h2 || 'section'));

    const resolveGeneratedBlockType = (section: any): string =>
        String(section?.blockType || section?.type || section?.metadata?.block_type || '').trim();

    const navItems = normalizedSections
        .filter(s => ['services_grid', 'urgency_panel', 'local_proof', 'faq'].includes(resolveGeneratedBlockType(s) as any))
        .map(s => {
            const resolvedBlockType = resolveGeneratedBlockType(s);
            const labelMap: Record<string, string> = {
                'services_grid': 'Servicios',
                'urgency_panel': 'Urgencia',
                'local_proof': 'Áreas',
                'faq': 'Dudas'
            };
            return {
                label: labelMap[resolvedBlockType] || 'Detalles',
                href: `#${resolveGeneratedSectionId(s)}`
            };
        })
        .slice(0, 4);

    const bodyParts: string[] = [];

    // 1. Header (Varía según skeleton)
    const headerVariant = theme.id === 'premiumClassic' ? 'prestige' : (skeleton === 'conversion-funnel' ? 'glass' : (dna.navbarTreatment || 'glass'));
    bodyParts.push(
        components.renderHeader({
            tokens: tokens as any,
            content: { businessName: businessName, phone, navItems },
            visualVariant: headerVariant
        })
    );

    // 1.5 Breadcrumbs
    if (seo?.breadcrumbs) {
        bodyParts.push(renderBreadcrumbs(seo.breadcrumbs));
    } else if (breadcrumbs && breadcrumbs.length > 0) {
        bodyParts.push(renderBreadcrumbs(breadcrumbs));
    }

    // 2. Hero
    const heroData = (options as any).hero || { h1: title, subtitle: options.meta.description, phone, city: options.city };
    const heroRenderData = {
        tokens: tokens as any,
        content: {
            h1: heroData.h1 || title,
            subtitle: heroData.subtitle || options.meta.description,
            phone,
            city: options.city,
            niche: options.niche,
            businessName: businessName,
            trust_bullets: heroData.trust_bullets
        },
        heroLayout: (rules?.hero?.template as any) || macroHeroTemplate || (headerVariant as any),
        visualVariant: rules.hero.template
    };

    const heroLayoutStr = ((rules?.hero?.template as any) || macroHeroTemplate || (headerVariant as any) || 'split');
    const heroPatternClass = `pattern-hero_${heroLayoutStr}`;
    bodyParts.push(`<div class="${heroDispClass} ${heroPatternClass}">`);

    switch (heroLayoutStr) {
        case 'centered':
            bodyParts.push(components.renderHeroCentered?.(heroRenderData) || components.renderHeroPremium(heroRenderData));
            break;
        case 'stacked':
            bodyParts.push(components.renderHeroStacked?.(heroRenderData) || components.renderHeroPremium(heroRenderData));
            break;
        case 'cta-heavy':
            bodyParts.push(components.renderHeroCtaHeavy?.(heroRenderData) || components.renderHeroPremium(heroRenderData));
            break;
        case 'proof_first':
            bodyParts.push(components.renderHeroPremium(heroRenderData));
            break;
        case 'split':
        default:
            bodyParts.push(components.renderHeroPremium(heroRenderData));
            break;
    }

    bodyParts.push(`</div>`);

    // 3. Trust Strip (Solo si no es minimal y no está distribuido)
    if (skeleton !== 'premium-showcase' && macroProof !== 'distributed') {
        bodyParts.push(components.renderTrustStrip({ tokens: tokens as any, content: {} }));
    }

    const cadence = pageComposition || 'alternating';
    let editorialImageInserted = false;
    const imageEligibleBlocks = new Set(['services_grid', 'local_proof', 'process_steps', 'price_guidance', 'comparison_table']);
    const allowAmbientSupportImage = skeleton === 'editorial-longform'
        || ['editorial', 'asymmetric_premium', 'minimal_authority'].includes(String(effectiveFamilyId));

    // 4. Sections
    normalizedSections.forEach((s, idx) => {
        const sectionId = resolveGeneratedSectionId(s);
        const blockType = resolveGeneratedBlockType(s);
        if (blockType === 'hero_trust') return;

        // Priorizar el contrato del ResolvedPlan
        const contract = resolvedPlan?.sections.find(sc => sc.sectionId === sectionId) || (layoutContract?.sections?.[sectionId] as any) || {};

        const shell = contract.shell || 'plain';
        const flow = contract.flow || 'stack';
        const media = contract.media || 'none';
        const ctaWeight = contract.emphasis === 'cta' ? 'high' : (contract.cta || 'medium');
        const density = contract.density || 'standard';
        const pattern = contract.sectionPattern || 'section_banded';
        const visualVariant = contract.visualVariant || 'default';

        const premiumToneBlocks = new Set(['cta_panel', 'urgency_panel', 'comparison_table']);
        const calmToneBlocks = new Set(['faq', 'map']);
        let toneClass = 'section-tone-base';
        if (macroCadence === 'compact') {
            toneClass = 'section-tone-base';
        } else if (premiumToneBlocks.has(blockType)) {
            toneClass = 'section-tone-contrast';
        } else if (calmToneBlocks.has(blockType)) {
            toneClass = idx % 2 === 0 ? 'section-tone-soft' : 'section-tone-base';
        } else if (resolvedPlan.visualSystem.cadence === 'contrast-bursts') {
            toneClass = (idx % 4 === 1) ? 'section-tone-contrast' : (idx % 2 === 1 ? 'section-tone-soft' : 'section-tone-base');
        } else {
            toneClass = (idx % 2 === 1) ? 'section-tone-alt' : 'section-tone-base';
        }

        const shellClass = `shell-${shell}`;
        const flowClass = `flow-${flow}`;
        const mediaClass = `media-${media}`;
        const ctaClass = `cta-weight-${ctaWeight}`;
        const densityClass = `density-${density}`;
        const patternClass = `pattern-${pattern}`;
        const variantClass = `variant-${visualVariant}`;

        const isRegistryBlock = Boolean(blockType) && (blockType in blockRegistry);

        if (isRegistryBlock) {
            const renderer = blockRegistry[blockType as keyof typeof blockRegistry];
            const blockInput = adaptSectionToBlockInput({
                sectionId,
                section: s,
                contract,
                data: mappingData,
                theme
            });

            try {
                const renderedHtml = renderer(blockInput);
                bodyParts.push(`<div class="el-section-wrapper ${toneClass}">${renderedHtml}</div>`);
            } catch (err) {
                console.error(`[ProceduralEngine] Error rendering block ${blockType}:`, err);
                // Fallback to legacy
                bodyParts.push(`<div class="el-section-wrapper ${toneClass}">${s.html}</div>`);
            }
        } else if (String(s.html || '').includes('section-shell')) {
            // Si el bloque ya viene con su propia estructura de shell/section, lo insertamos directamente
            // agregando solo el ID si no lo tiene, pero sin duplicar el wrapper estructural.
            bodyParts.push(`<div class="el-section-wrapper ${toneClass}">${s.html}</div>`);
        } else {
            if (s.blockType === 'map') {
                bodyParts.push(
                    components.renderMap({
                        tokens: tokens as any,
                        content: { h2: s.h2, city: options.city, address: options.business?.address, description: s.html },
                        vibe: 'minimal',
                        id: sectionId
                    })
                );
            } else {
                bodyParts.push(`
                    <section class="el-section ${toneClass} ${shellClass} ${patternClass}" id="${sectionId}">
                        <div class="el-container section-shell ${shellClass}">
                            <div class="layout-flow ${flowClass} ${mediaClass} ${ctaClass} ${densityClass} ${variantClass} rich-content">
                                ${s.html}
                            </div>
                        </div>
                    </section>
                `);
            }
        }

        if (allowAmbientSupportImage && !editorialImageInserted && imageEligibleBlocks.has(String(s.blockType || ''))) {
            bodyParts.push(renderEditorialImageSection({
                niche: options.niche,
                city: options.city,
                businessName: businessName
            }));
            editorialImageInserted = true;
        }
    });

    if (allowAmbientSupportImage && !editorialImageInserted) {
        bodyParts.push(renderEditorialImageSection({
            niche: options.niche,
            city: options.city,
            businessName: businessName
        }));
    }

    const shouldRenderTestimonials = theme.id === 'premiumClassic' && ['service', 'urgent', 'service_area', 'comparison', 'home_local', 'category'].includes(pageType);
    if (shouldRenderTestimonials) {
        const authorityLinks = Array.isArray((mappingData.seo as any)?.metadata?.authorityLinks)
            ? (mappingData.seo as any).metadata.authorityLinks
            : Array.isArray((mappingData.local as any)?.authority_links)
                ? (mappingData.local as any).authority_links
                : [];
        const localTestimonials = Array.isArray((mappingData.local as any)?.reviews)
            ? (mappingData.local as any).reviews
            : [];

        bodyParts.push(
            components.renderTestimonials({
                content: {
                    h2: localTestimonials.length ? 'Opiniones verificadas' : 'Qué puedes comprobar antes de contratar',
                    city: options.city,
                    niche: options.niche,
                    businessName: businessName,
                    napData: mappingData.local,
                    authorityLinks,
                    testimonials: localTestimonials,
                },
                vibe: 'premium'
            })
        );
    }

    // 5. Final CTA / Urgency (Varía posición y estilo según skeleton)
    if (skeleton !== 'editorial-longform') {
        const finalUrgencyVariant = pageComposition === 'editorial' ? 'minimal_phone_bar' : 'luxury_banner';
        bodyParts.push(
            components.renderUrgencyCounter({
                tokens: tokens as any,
                content: { h2: '¿Necesitas un especialista ahora?', phone, businessName },
                visualVariant: finalUrgencyVariant
            })
        );
    }

    // 6. Footer
    const footerVariant = theme.id === 'premiumClassic' ? 'editorial' : (skeleton === 'local-directory' ? 'directory' : dna.footerTreatment);
    bodyParts.push(
        components.renderFooter({
            tokens: tokens as any,
            content: { businessName: businessName, city, phone },
            visualVariant: footerVariant
        })
    );
    const familyRuntimeCSS = `
.family-${effectiveFamilyId} {
    --family-section-y: var(--section-y);
    --family-card-gap: var(--block-gap);
    --family-content-gap: var(--flow-gap);
    --family-shell-padding: var(--shell-padding);
}
.family-conversion_heavy {
    --family-section-y: calc(var(--section-y) * 0.90);
    --family-shell-padding: calc(var(--shell-padding) * 0.88);
}
.family-local_trust {
    --family-section-y: calc(var(--section-y) * 1.02);
}
.family-technical_grid {
    --family-section-y: calc(var(--section-y) * 0.95);
    --family-card-gap: calc(var(--block-gap) * 0.92);
}
.family-asymmetric_premium {
    --family-section-y: calc(var(--section-y) * 1.12);
    --family-shell-padding: calc(var(--shell-padding) * 1.08);
}
.family-editorial,
.family-minimal_authority {
    --family-section-y: calc(var(--section-y) * 1.08);
    --family-content-gap: calc(var(--flow-gap) * 1.08);
}
`;


    let fullHtml = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <title>${seo?.title || title}</title>
    <meta name="description" content="${seo?.metaDescription || options.meta.description || ''}">
    <link rel="canonical" href="${seo?.canonical || ''}">
    <meta name="robots" content="${seo?.robots || 'index, follow'}">

    <!-- Open Graph -->
    <meta property="og:type" content="${seo?.openGraph?.type || 'website'}">
    <meta property="og:title" content="${seo?.openGraph?.title || seo?.title || title}">
    <meta property="og:description" content="${seo?.openGraph?.description || seo?.metaDescription || options.meta.description || ''}">
    <meta property="og:url" content="${seo?.openGraph?.url || seo?.canonical || ''}">
    <meta property="og:site_name" content="${seo?.openGraph?.siteName || businessName || ''}">
    <meta property="og:locale" content="${seo?.openGraph?.locale || 'es_ES'}">
    ${seo?.openGraph?.image ? `<meta property="og:image" content="${seo.openGraph.image}">` : ''}

    <!-- Twitter -->
    <meta name="twitter:card" content="${seo?.twitter?.card || 'summary'}">
    <meta name="twitter:title" content="${seo?.twitter?.title || seo?.title || title}">
    <meta name="twitter:description" content="${seo?.twitter?.description || seo?.metaDescription || options.meta.description || ''}">
    ${seo?.twitter?.image ? `<meta name="twitter:image" content="${seo.twitter.image}">` : ''}

    <!-- Schema.org (JSON-LD) -->
    ${seo?.schemaJsonLd ? `<script type="application/ld+json">${JSON.stringify(seo.schemaJsonLd)}</script>` : ''}

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    ${(() => {
        const families = new Set<string>();
        // Extraer nombres de familia, limpiar comillas y reemplazar espacios
        const extract = (f: string) => f.split(',')[0].replace(/['"]/g, '').trim();
        if (tokens.typography.fontDisplay) families.add(extract(tokens.typography.fontDisplay));
        if (tokens.typography.fontBody) families.add(extract(tokens.typography.fontBody));
        
        const familyParams = Array.from(families).map(f => `family=${f.replace(/\s+/g, '+')}:wght@400;700;900`).join('&');
        return `<link href="https://fonts.googleapis.com/css2?${familyParams}&display=swap" rel="stylesheet">`;
    })()}
    <style>
        ${cssVars}
        ${globalStyles}
        
        /* --- ADDITIONAL SECTION PATTERNS --- */
        .pattern-section_two_column_story { display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: start; }
        .pattern-section_stacked_cards .layout-flow { display: flex; flex-direction: column; gap: 3rem; }
        .pattern-section_stacked_cards .layout-flow > * { background: var(--surface); padding: 3rem; border-radius: 1.5rem; border: 1px solid var(--border); box-shadow: var(--shadow-soft); }
        .pattern-section_comparison_table { display: grid; grid-template-columns: 1fr 1fr; gap: 0; border: 1px solid var(--border); border-radius: 1rem; overflow: hidden; }
        .pattern-section_comparison_table > * { padding: 2rem; border: 1px solid var(--border); }
        .pattern-section_quote_proof blockquote { font-size: 2rem; font-style: italic; position: relative; padding: 4rem 0; border-top: 4px solid var(--primary); }
        .pattern-section_quote_proof blockquote::after { content: "CERTIFICADO"; position: absolute; top: -1rem; right: 0; background: var(--primary); color: white; padding: 0.5rem 1rem; font-size: 0.75rem; font-style: normal; font-weight: 800; }
        .pattern-cta_inline { display: flex; align-items: center; justify-content: space-between; background: var(--surface-alt); padding: 2rem 4rem; border-radius: 1rem; }
        /* --- VISUAL IDENTITY CONTRACT V3: structural visual dialects --- */
        .archetype-emergency_dispatch_console .hero__shell, .dialect-emergency_console .hero__shell { border: 1px solid rgba(255,255,255,.18); background: radial-gradient(circle at top right, rgba(255,255,255,.16), transparent 34%), linear-gradient(135deg, rgba(12,18,28,.98), rgba(34,45,64,.94)); color: #fff; box-shadow: 0 24px 80px rgba(0,0,0,.28); }
        .archetype-emergency_dispatch_console .site-header, .dialect-emergency_console .site-header { border-bottom: 1px solid rgba(255,255,255,.12); backdrop-filter: blur(16px); }
        .dialect-emergency_console .el-section-wrapper:nth-of-type(odd) { background: linear-gradient(135deg, rgba(15,23,42,.96), rgba(30,41,59,.92)); color: #fff; }
        .pattern-diagnostic_rows .services-grid__cards, .variant-diagnostic_rows .services-grid__cards { display: flex !important; flex-direction: column; gap: 1rem; }
        .pattern-diagnostic_rows .service-card, .variant-diagnostic_rows .service-card { display: grid; grid-template-columns: 3rem 1fr auto; align-items: center; border-left: 5px solid var(--primary); }
        .pattern-coverage_map_panel, .variant-coverage_map_panel, .pattern-large_zone_map, .variant-large_zone_map { border-radius: 2rem; overflow: hidden; background: radial-gradient(circle at 20% 20%, rgba(37,99,235,.12), transparent 38%), var(--surface-alt); }
        .pattern-dispatch_timeline .process-steps__timeline, .variant-dispatch_timeline .process-steps__timeline, .pattern-inspection_protocol .process-steps__timeline, .variant-inspection_protocol .process-steps__timeline { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); }
        .pattern-compact_decision_tree .faq-list, .variant-compact_decision_tree .faq-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
        .archetype-technical_diagnosis_report .el-section-wrapper, .dialect-technical_report .el-section-wrapper { border-top: 1px solid var(--border); }
        .pattern-icon_table .services-grid__cards, .variant-icon_table .services-grid__cards { display: grid !important; grid-template-columns: 1fr; }
        .pattern-icon_table .service-card, .variant-icon_table .service-card { display: grid; grid-template-columns: 4rem 1.2fr 2fr; gap: 1.2rem; align-items: start; border-radius: .8rem; box-shadow: none; }
        .pattern-estimate_matrix, .variant-estimate_matrix, .pattern-report_qa, .variant-report_qa { background: repeating-linear-gradient(0deg, transparent 0 3rem, rgba(0,0,0,.025) 3rem calc(3rem + 1px)); }
        .archetype-local_newspaper_report, .dialect-editorial_local { background: linear-gradient(90deg, rgba(0,0,0,.025) 1px, transparent 1px), var(--background); background-size: 33.33% 100%; }
        .pattern-feature_article, .variant-feature_article { max-width: 900px; margin-inline: auto; font-size: 1.12rem; }
        .pattern-editorial_service_rows .services-grid__cards, .variant-editorial_service_rows .services-grid__cards { display: flex !important; flex-direction: column; counter-reset: service; }
        .pattern-editorial_service_rows .service-card, .variant-editorial_service_rows .service-card { counter-increment: service; display: grid; grid-template-columns: 5rem 1fr; border-bottom: 1px solid var(--border); box-shadow: none; border-radius: 0; }
        .pattern-editorial_service_rows .service-card::before, .variant-editorial_service_rows .service-card::before { content: counter(service, decimal-leading-zero); font-size: 2rem; font-weight: 900; color: var(--primary); }
        .dialect-luxury_studio .services-grid__cards, .pattern-masonry_tiles .services-grid__cards, .variant-masonry_tiles .services-grid__cards, .pattern-before_after_tiles .services-grid__cards, .variant-before_after_tiles .services-grid__cards { columns: 2 320px; display: block !important; }
        .dialect-luxury_studio .service-card, .pattern-masonry_tiles .service-card, .variant-masonry_tiles .service-card, .pattern-before_after_tiles .service-card, .variant-before_after_tiles .service-card { break-inside: avoid; margin-bottom: 1.25rem; min-height: 220px; }
        .dialect-directory_map .services-grid__cards, .pattern-horizontal_rows .services-grid__cards, .variant-horizontal_rows .services-grid__cards, .pattern-area_directory_rows, .variant-area_directory_rows { display: flex !important; flex-direction: column; gap: .8rem; }
        .dialect-directory_map .service-card, .pattern-horizontal_rows .service-card, .variant-horizontal_rows .service-card { display: grid; grid-template-columns: 1fr auto; align-items: center; border-radius: 999px; box-shadow: none; }
        .dialect-minimal_authority_quote .el-section-wrapper { padding-block: clamp(4rem, 8vw, 8rem); }
        .pattern-minimal_columns .services-grid__cards, .variant-minimal_columns .services-grid__cards { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 4rem; }
        .pattern-minimal_columns .service-card, .variant-minimal_columns .service-card { background: transparent; box-shadow: none; border: 0; border-top: 1px solid var(--border); border-radius: 0; }
        @media (max-width: 780px) { .pattern-dispatch_timeline .process-steps__timeline, .variant-dispatch_timeline .process-steps__timeline, .pattern-inspection_protocol .process-steps__timeline, .variant-inspection_protocol .process-steps__timeline, .pattern-compact_decision_tree .faq-list, .variant-compact_decision_tree .faq-list, .pattern-minimal_columns .services-grid__cards, .variant-minimal_columns .services-grid__cards { grid-template-columns: 1fr !important; } }

        
        /* --- MODULAR FAMILY CSS --- */
        ${familyRuntimeCSS}
${getFamilyCSSOverride(effectiveFamilyId)}
    </style>
    ${options.extraScripts || ''}
</head>
<body class="page-visual-mode--premium ${surfaceClass} ${systemClass} ${macroClasses}">
    ${bodyParts.join('\n')}
</body>
</html>`;

    // 1.9 Final Token Replacement (Emergency Fallback)
    fullHtml = fullHtml
        .replace(/\{\{PHONE\}\}/gi, phone)
        .replace(/\{\{CITY\}\}/gi, city)
        .replace(/\{\{NAP\}\}/gi, businessName)
        .replace(/\{\{BUSINESS_NAME\}\}/gi, businessName)
        .replace(/\[\[CITY\]\]/gi, city);

    // CRITICAL: Final Cleanup of all template tokens that survived
    return fullHtml
        .replace(/\{\{[A-Z0-9_]+\}\}/gi, '') // Removes {{PHONE}}, {{NAP}}, etc.
        .replace(/\[\[[A-Z0-9_]+\]\]/gi, '') // Removes [[CITY]], etc.
        .replace(/__[A-Z0-9_]+__/g, (match) => {
            // Keep BEM-like classes (lowercase) but remove uppercase placeholders
            if (/[a-z]/.test(match)) return match;
            return '';
        })
        .replace(/\[INSERT\s[^\]]+\]/gi, '') // Removes [INSERT LOCATION], etc.
        .replace(/\[PLACEHOLDER\]/gi, '');
}

