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
import { getProceduralGlobalStyles } from './proceduralStyles.js';
import { normalizeThemeContrast, normalizePremiumTokens, renderContrastGuardCss, textOn, hexToRgbString } from './contrastGuard.js';
import { buildDefaultHeroTrustBullets, renderEarlyTrustStrip, renderMobileStickyCta } from './conversionUxPatch.js';

function svgToDataUri(svg: string): string {
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function getContrastColor(hexcolor: string): string {
    return textOn(hexcolor);
}

function hexToRgb(hex: string): string {
    return hexToRgbString(hex);
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


function generateThemeCssVariables(theme: DesignSystemTheme & { premiumInjections?: Record<string, unknown> }): string {
    const contrastTheme = normalizeThemeContrast(theme as DesignSystemTheme);
    const { colors, typography, spacing, radius, shadow, breakpoints, motion } = contrastTheme.tokens;
    const safePremiumInjections = normalizePremiumTokens((theme as any).premiumInjections, colors as any);
    const verticalRhythm = contrastTheme.rules.verticalRhythm;
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
            --muted: ${colors.muted};
            --primary: ${colors.primary};
            --primary-rgb: ${hexToRgb(colors.primary)};
            --text-on-primary: ${getContrastColor(colors.primary)};
            --on-primary: ${getContrastColor(colors.primary)};
            --accent: ${colors.accent};
            --accent-rgb: ${hexToRgb(colors.accent)};
            --text-on-accent: ${getContrastColor(colors.accent)};
            --on-accent: ${getContrastColor(colors.accent)};
            --text-on-bg: ${getContrastColor(colors.bg)};
            --text-on-surface: ${getContrastColor(colors.surface)};
            --success: ${colors.success};
            --warning: ${colors.warning};
            --border: rgba(148, 163, 184, 0.12);
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
            
            /* Radical Overrides */
            ${contrastTheme.radicalOverrides ? Object.entries(contrastTheme.radicalOverrides).map(([k, v]) => `${k}: ${v};`).join('\n') : ''}
            
            /* Gravity 200-Pack Injections & Contrast Guard */
            ${safePremiumInjections ? Object.entries(safePremiumInjections).map(([k, v]) => {
                const val = v as string;
                const key = k.replace(/_/g, '-');
                let extra = `--${key}: ${val};`;
                if (['primary', 'bg', 'surface', 'accent', 'accent-secondary'].includes(key)) {
                    extra += `\n--text-on-${key}: ${getContrastColor(val)};`;
                    extra += `\n--${key}-rgb: ${hexToRgb(val)};`;
                }
                return extra;
            }).join('\n') : ''}
            
            /* Reset for Radical Designs */
            ${safePremiumInjections ? `
                --service-card-bg: var(--surface, #ffffff);
                --service-card-text: var(--text-on-surface, var(--text));
                --hero-bg: var(--bg);
                --hero-text: var(--text-on-bg, var(--text));
            ` : ''}
        }
    `;
}

function sanitizeLateContrastCss(html: string): string {
    return html
        .replace(/background:\s*rgba\(255,\s*255,\s*255,\s*0\.7[0-9]\)\s*;/gi, 'background: var(--glass-panel-bg, var(--surface));')
        .replace(/border:\s*1px\s+solid\s+rgba\(255,\s*255,\s*255,\s*0\.8[0-9]\)\s*;/gi, 'border: 1px solid var(--glass-panel-border, var(--border));')
        .replace(/color:\s*rgba\(255,\s*255,\s*255,\s*0\.7[0-9]\)\s*;/gi, 'color: var(--footer-muted);')
        .replace(/color:\s*#ffffff\s*;(?=\s*[^{}]*\.footer__|\s*[^{}]*footer)/gi, 'color: var(--footer-text);');
}

function renderBreadcrumbs(items: any[]): string {
    if (!items || items.length < 2) return '';
    return `
        <nav class="el-breadcrumbs" aria-label="Breadcrumb">
            <div class="el-container">
                <ol class="el-breadcrumbs__list" itemscope itemtype="https://schema.org/BreadcrumbList">
                    ${items.map((item, idx) => `
                        <li class="el-breadcrumbs__item" itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
                            <span class="el-breadcrumbs__text" itemprop="name">${item.name}</span>
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
                background: var(--glass-panel-bg, var(--surface)); border: 1px solid var(--glass-panel-border, var(--border));
                box-shadow: 0 10px 26px rgba(15, 23, 42, 0.06); border-radius: 999px; padding: 0.78rem 1rem; width: max-content; max-width: 100%;
            }
            .el-breadcrumbs__item { display: inline-flex; align-items: center; gap: 0.5rem; }
             .el-breadcrumbs__text { color: var(--text); font-weight: 700; }
            .el-breadcrumbs__item:not(:last-child)::after {
                content: "/";
                color: #94a3b8;
                font-size: 0.9rem;
                opacity: 0.7;
            }
            .el-breadcrumbs__item:last-child .el-breadcrumbs__text { color: var(--text); }
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

    const { radicalConfig } = resolvedPlan;
    const theme = normalizeThemeContrast(resolvedPlan.theme as any);
    const { tokens } = theme;
    const rules = {
        ...((theme as any).rules || {}),
        hero: {
            disposition: "content_left",
            template: "split",
            emphasis: "proof",
            maxPrimaryCtas: 1,
            ...((theme as any).rules?.hero || {})
        },
        shellUsage: {
            hero: "plain",
            trust: "plain",
            faq: "panel",
            comparison: "plain",
            default: "plain",
            ...((theme as any).rules?.shellUsage || {})
        },
        verticalRhythm: ((theme as any).rules || {})?.verticalRhythm || "standard"
    } as any;

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

    const cssVars = generateThemeCssVariables({
        ...theme,
        radicalOverrides: radicalConfig?.themeOverrides,
        premiumInjections: (options as any).masterclass?.design_system_injection?.tokens
    } as any);
    
    const customCss = radicalConfig?.customCss || (options as any).masterclass?.design_system_injection?.custom_css || '';
    const layoutParadigm = radicalConfig?.layoutParadigm || (options as any).masterclass?.architecture?.layout_paradigm || 'standard';

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

    const globalStyles = getProceduralGlobalStyles();

    const surfaceClass = dna.surfaceStyle ? `page-surface-${dna.surfaceStyle}` : '';
    const systemClass = dna.visualSystem ? `system-${dna.visualSystem}` : '';
    const heroDispClass = dna.heroDisposition ? `hero-disposition-${dna.heroDisposition.replace('content_', '')}` : '';

    const macroClasses = `skeleton-${skeleton} strategy-proof-${macroProof} strategy-cta-${macroCta} cadence-${macroCadence} family-${dna.family || 'general'}`;


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

    const hasUrgencyPanel = normalizedSections.some((section: any) => resolveGeneratedBlockType(section) === 'urgency_panel');

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
            trust_bullets: Array.isArray(heroData.trust_bullets) && heroData.trust_bullets.length ? heroData.trust_bullets : buildDefaultHeroTrustBullets(options.niche, options.city)
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

    // 3. Early conversion proof strip: dynamic by niche/city and independent from the visual family.
    // It keeps every generated page different while solving the generic/low-trust first fold.
    if (skeleton !== 'premium-showcase') {
        bodyParts.push(renderEarlyTrustStrip({
            niche: options.niche,
            city: options.city,
            phone,
            businessName
        }));
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
            const blockRenderer = blockRegistry[s.blockType as keyof typeof blockRegistry];
            if (blockRenderer) {
                // Sincronizar variant y visualVariant para evitar caídas a 'default' (Diagnostic Patch Fix)
                const activeVariant = s.variant || s.visualVariant || 'default';
                
                const blockInput = adaptSectionToBlockInput({
                    sectionId,
                    section: { ...s, variant: activeVariant, visualVariant: activeVariant },
                    data: mappingData,
                    theme
                });

                try {
                    const blockStartedAt = Date.now();
                    const renderedHtml = blockRenderer(blockInput);
                    const blockDurationMs = Date.now() - blockStartedAt;
                    if (blockDurationMs > 2000) {
                        console.warn(`[ProceduralEngine] Slow block render ${blockType}#${sectionId}: ${blockDurationMs}ms`);
                    }
                    bodyParts.push(`<div class="el-section-wrapper ${toneClass}">${renderedHtml}</div>`);
                } catch (err) {
                    console.error(`[ProceduralEngine] Error rendering block ${blockType}#${sectionId}:`, err);
                    // Fallback to legacy HTML for this block. If legacy HTML is empty, keep a minimal visible section so the page can complete.
                    const fallbackHtml = String(s.html || '').trim() || `<section class="el-section block-render-fallback" id="${sectionId}"><div class="el-container"><h2>${s.h2 || 'Información del servicio'}</h2><p>Sección no disponible temporalmente.</p></div></section>`;
                    bodyParts.push(`<div class="el-section-wrapper ${toneClass}" data-render-fallback="${blockType}">${fallbackHtml}</div>`);
                }
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

    const shouldRenderTestimonials = ['service', 'urgent', 'service_area', 'comparison', 'home_local', 'category'].includes(pageType);
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
    if (skeleton !== 'editorial-longform' && !hasUrgencyPanel) {
        const finalUrgencyVariant = pageComposition === 'editorial' ? 'minimal_phone_bar' : 'luxury_banner';
        bodyParts.push(
            components.renderUrgencyCounter({
                tokens: tokens as any,
                content: { h2: '¿Necesitas un especialista ahora?', phone, businessName },
                visualVariant: finalUrgencyVariant
            })
        );
    }

    // 5.5 Mobile sticky CTA: only visible on small screens through CSS.
    bodyParts.push(renderMobileStickyCta({ phone, niche: options.niche, city: options.city }));

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
        const extract = (f: string) => f.split(',')[0].replace(/['"]/g, '').trim();
        if (tokens.typography.fontDisplay) families.add(extract(tokens.typography.fontDisplay));
        if (tokens.typography.fontBody) families.add(extract(tokens.typography.fontBody));
        
        const familyParams = Array.from(families).map(f => `family=${f.replace(/\s+/g, '+')}:wght@400;700;900`).join('&');
        return `<link href="https://fonts.googleapis.com/css2?${familyParams}&display=swap" rel="stylesheet">`;
    })()}
    <style>
        ${cssVars}
        ${globalStyles}
        body { 
            font-family: var(--font-body); 
            background-color: var(--bg);
            background-image: 
                radial-gradient(circle at top left, rgba(var(--primary-rgb), 0.12), transparent 35%), 
                radial-gradient(circle at bottom right, rgba(var(--primary-rgb), 0.08), transparent 30%);
            color: var(--text); 
            line-height: 1.68; 
            overflow-x: hidden;
            min-height: 100vh;
        }

        h1, h2, h3 { 
            font-family: var(--font-display); 
            color: var(--heading, var(--text)); 
            line-height: 1.1; 
            letter-spacing: -0.02em; 
            margin-bottom: var(--rhythm-header); 
        }

        .section-tone-soft { background: linear-gradient(180deg, rgba(var(--primary-rgb), 0.03), transparent); }
        .section-tone-alt { background: var(--surface-alt); }
        .section-tone-contrast { background: radial-gradient(circle at top right, rgba(var(--primary-rgb), 0.12), transparent 30%), var(--bg); }

        .system-panelled .semantic-card, .service-card, .proof-card, .step-card, .faq-item, .trust-strip, .urgency-layout__copy, .cta-panel__bar, .urgency-banner, .section-cta--terminal {
            background: var(--surface); 
            color: var(--text-on-surface, var(--text));
            padding: var(--family-shell-padding, var(--shell-padding));
            border-radius: var(--radius-card); 
            border: 1px solid var(--border); 
            box-shadow: var(--shadow-soft); 
        }

        /* Additional Pattern overrides */
        .pattern-section_two_column_story { display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: start; }
        .pattern-section_stacked_cards .layout-flow { display: flex; flex-direction: column; gap: 3rem; }
        .pattern-section_stacked_cards .layout-flow > * { background: var(--surface); padding: 3rem; border-radius: 1.5rem; border: 1px solid var(--border); box-shadow: var(--shadow-soft); }
        .pattern-section_comparison_table { display: grid; grid-template-columns: 1fr 1fr; gap: 0; border: 1px solid var(--border); border-radius: 1rem; overflow: hidden; }
        .pattern-section_comparison_table > * { padding: 2rem; border: 1px solid var(--border); }
        .pattern-section_quote_proof blockquote { font-size: 2rem; font-style: italic; position: relative; padding: 4rem 0; border-top: 4px solid var(--primary); }
        .pattern-section_quote_proof blockquote::after { content: "CERTIFICADO"; position: absolute; top: -1rem; right: 0; background: var(--primary); color: white; padding: 0.5rem 1rem; font-size: 0.75rem; font-style: normal; font-weight: 800; }
        .pattern-cta_inline { display: flex; align-items: center; justify-content: space-between; background: var(--surface-alt); padding: 2rem 4rem; border-radius: 1rem; }
        ${familyRuntimeCSS}
        ${getFamilyCSSOverride(effectiveFamilyId)}
        ${customCss ? customCss : ''}
        ${renderContrastGuardCss()}
    </style>
    ${options.extraScripts || ''}
</head>
<body class="page-visual-mode--premium ${surfaceClass} ${systemClass} ${macroClasses} paradigm-${layoutParadigm}">
    ${layoutParadigm === 'vertical_sidebar' ? `
        <div class="site-layout-sidebar">
            <aside class="sidebar-nav">
                ${bodyParts[0]}
            </aside>
            <main class="main-content">
                ${bodyParts.slice(1).join('\n')}
            </main>
        </div>
        <style>
            .service-card p { color: var(--service-card-text) !important; opacity: 0.8; }
            .hero { background: var(--hero-bg) !important; color: var(--hero-text) !important; }
            .hero h1, .hero p { color: var(--hero-text) !important; }
            
            /* Clean Up Inheritance */
            ${layoutParadigm !== 'standard' ? `
                .service-card, .proof-card, .step-card { box-shadow: var(--shadow-policy, var(--shadow-soft)); border-radius: var(--radius-policy, var(--radius-card)); }
            ` : ''}
        </style>
    ` : bodyParts.join('\n')}
    
    <style>
        .paradigm-bento_grid_system .services-grid { 
            display: grid; 
            grid-template-columns: repeat(4, 1fr); 
            grid-template-rows: repeat(2, 300px);
            gap: 1.5rem; 
        }
        .paradigm-bento_grid_system .service-card:nth-child(1) { grid-column: span 2; grid-row: span 2; }
        
        .paradigm-cinematic_scroll .el-section-wrapper { 
            height: 100vh; 
            display: flex; 
            align-items: center; 
            scroll-snap-align: start; 
        }
    </style>
</body>
</html>`;

    // 1.9 Final Token Replacement (Emergency Fallback)
    fullHtml = fullHtml
        .replace(/\{\{PHONE\}\}/gi, phone)
        .replace(/\{\{CITY\}\}/gi, city)
        .replace(/\{\{NAP\}\}/gi, businessName)
        .replace(/\{\{BUSINESS_NAME\}\}/gi, businessName)
        .replace(/\[\[CITY\]\]/gi, city);

    fullHtml = sanitizeLateContrastCss(fullHtml);

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
