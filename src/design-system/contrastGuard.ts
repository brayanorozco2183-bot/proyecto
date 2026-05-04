import type { DesignSystemTheme } from './types.js';

type HexColor = `#${string}`;

type ContrastPair = {
    foreground: string;
    background: string;
    ratio: number;
    passesAA: boolean;
};

export type ContrastAuditReport = {
    minRatio: number;
    pairs: Record<string, ContrastPair>;
    adjusted: string[];
};

const DARK_TEXT = '#0F172A';
const LIGHT_TEXT = '#FFFFFF';
const MUTED_DARK = '#475569';
const MUTED_LIGHT = '#E2E8F0';
const DEFAULT_BG = '#F8FAFC';
const DEFAULT_SURFACE = '#FFFFFF';
const DEFAULT_PRIMARY = '#0F766E';
const DEFAULT_ACCENT = '#2563EB';
const AA_NORMAL = 4.5;
const AA_LARGE = 3;

function isHexColor(value: unknown): value is HexColor {
    return typeof value === 'string' && /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim());
}

function normalizeHex(value: unknown, fallback: string): string {
    if (!isHexColor(value)) return fallback;
    const raw = value.trim();
    if (raw.length === 4) {
        return `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`.toUpperCase();
    }
    return raw.toUpperCase();
}

export function hexToRgbTuple(value: unknown): [number, number, number] {
    const hex = normalizeHex(value, DEFAULT_PRIMARY).slice(1);
    return [0, 2, 4].map((idx) => parseInt(hex.slice(idx, idx + 2), 16)) as [number, number, number];
}

export function hexToRgbString(value: unknown, fallback = DEFAULT_PRIMARY): string {
    const [r, g, b] = hexToRgbTuple(normalizeHex(value, fallback));
    return `${r}, ${g}, ${b}`;
}

function channelToLinear(channel: number): number {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(value: unknown): number {
    const [r, g, b] = hexToRgbTuple(value);
    return 0.2126 * channelToLinear(r) + 0.7152 * channelToLinear(g) + 0.0722 * channelToLinear(b);
}

export function contrastRatio(foreground: unknown, background: unknown): number {
    const fg = relativeLuminance(foreground);
    const bg = relativeLuminance(background);
    const lighter = Math.max(fg, bg);
    const darker = Math.min(fg, bg);
    return (lighter + 0.05) / (darker + 0.05);
}

export function textOn(background: unknown, level: 'normal' | 'large' = 'normal'): string {
    const bg = normalizeHex(background, DEFAULT_BG);
    const min = level === 'large' ? AA_LARGE : AA_NORMAL;
    const darkRatio = contrastRatio(DARK_TEXT, bg);
    const lightRatio = contrastRatio(LIGHT_TEXT, bg);
    if (darkRatio >= min || darkRatio >= lightRatio) return DARK_TEXT;
    return LIGHT_TEXT;
}

function ensureReadableText(text: string, background: string, fallbackBackground: string): string {
    const normalizedText = normalizeHex(text, textOn(background));
    const normalizedBackground = normalizeHex(background, fallbackBackground);
    if (contrastRatio(normalizedText, normalizedBackground) >= AA_NORMAL) return normalizedText;
    return textOn(normalizedBackground);
}

function ensureAccentReadable(accent: string, background: string, fallback: string): string {
    const normalizedAccent = normalizeHex(accent, fallback);
    const normalizedBackground = normalizeHex(background, DEFAULT_BG);
    if (contrastRatio(normalizedAccent, normalizedBackground) >= 3) return normalizedAccent;
    return contrastRatio(DEFAULT_PRIMARY, normalizedBackground) >= 3 ? DEFAULT_PRIMARY : DEFAULT_ACCENT;
}

export function normalizePremiumTokens(tokens: Record<string, unknown> | undefined, baseColors: Record<string, string>): Record<string, string> | undefined {
    if (!tokens || typeof tokens !== 'object') return undefined;

    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(tokens)) {
        out[key] = String(value);
    }

    const bg = normalizeHex(out.bg || baseColors.bg, DEFAULT_BG);
    const surface = normalizeHex(out.surface || baseColors.surface, DEFAULT_SURFACE);
    const primary = normalizeHex(out.primary || baseColors.primary, DEFAULT_PRIMARY);
    const accent = normalizeHex(out.accent || out.accent_secondary || baseColors.accent, DEFAULT_ACCENT);

    out.bg = bg;
    out.surface = surface;
    out.text = ensureReadableText(out.text || baseColors.text, bg, DEFAULT_BG);
    out.muted = ensureReadableText(out.muted || baseColors.muted || MUTED_DARK, bg, DEFAULT_BG);
    out.primary = ensureAccentReadable(primary, bg, DEFAULT_PRIMARY);
    out.accent = ensureAccentReadable(accent, bg, DEFAULT_ACCENT);
    out.on_primary = ensureReadableText(out.on_primary || out.text_on_primary || textOn(out.primary), out.primary, DEFAULT_PRIMARY);
    out.on_accent = ensureReadableText(out.on_accent || out.text_on_accent || textOn(out.accent), out.accent, DEFAULT_ACCENT);
    out.text_on_bg = ensureReadableText(out.text_on_bg || out.text, bg, DEFAULT_BG);
    out.text_on_surface = ensureReadableText(out.text_on_surface || out.text, surface, DEFAULT_SURFACE);

    return out;
}

export function normalizeThemeContrast<T extends DesignSystemTheme>(theme: T): T {
    const colors = theme?.tokens?.colors || {} as any;
    const bg = normalizeHex(colors.bg, DEFAULT_BG);
    const surface = normalizeHex(colors.surface, DEFAULT_SURFACE);
    const primary = normalizeHex(colors.primary, DEFAULT_PRIMARY);
    const accent = normalizeHex(colors.accent, DEFAULT_ACCENT);
    const text = ensureReadableText(colors.text, bg, DEFAULT_BG);
    const mutedCandidate = normalizeHex(colors.muted, contrastRatio(MUTED_DARK, bg) >= AA_NORMAL ? MUTED_DARK : MUTED_LIGHT);
    const muted = contrastRatio(mutedCandidate, bg) >= AA_NORMAL ? mutedCandidate : text;

    return {
        ...theme,
        tokens: {
            ...theme.tokens,
            colors: {
                ...colors,
                bg,
                surface,
                text,
                muted,
                primary: ensureAccentReadable(primary, bg, DEFAULT_PRIMARY),
                accent: ensureAccentReadable(accent, bg, DEFAULT_ACCENT),
                inverse: normalizeHex(colors.inverse, textOn(text)),
                success: normalizeHex(colors.success, '#15803D'),
                warning: normalizeHex(colors.warning, '#B45309'),
                border: colors.border || 'rgba(148, 163, 184, 0.22)'
            }
        }
    } as T;
}

export function auditThemeContrast(theme: DesignSystemTheme, premiumTokens?: Record<string, unknown>): ContrastAuditReport {
    const normalized = normalizeThemeContrast(theme);
    const colors = normalized.tokens.colors as any;
    const injected = normalizePremiumTokens(premiumTokens, colors) || {};
    const bg = injected.bg || colors.bg;
    const surface = injected.surface || colors.surface;
    const primary = injected.primary || colors.primary;
    const accent = injected.accent || colors.accent;
    const text = injected.text || colors.text;

    const pairs: Record<string, ContrastPair> = {
        bg_text: makePair(text, bg),
        surface_text: makePair(injected.text_on_surface || text, surface),
        primary_on_primary: makePair(injected.on_primary || textOn(primary), primary),
        accent_on_accent: makePair(injected.on_accent || textOn(accent), accent)
    };

    return {
        minRatio: Math.min(...Object.values(pairs).map((pair) => pair.ratio)),
        pairs,
        adjusted: []
    };
}

function makePair(foreground: string, background: string): ContrastPair {
    const ratio = Number(contrastRatio(foreground, background).toFixed(2));
    return {
        foreground,
        background,
        ratio,
        passesAA: ratio >= AA_NORMAL
    };
}

export function renderContrastGuardCss(): string {
    return `
/* === Gravity Contrast Guard v2: final readability and visual-variant pass === */
:root {
  --cta-text: var(--text-on-primary, #ffffff);
  --glass-panel-bg: color-mix(in srgb, var(--surface) 88%, transparent);
  --glass-panel-border: color-mix(in srgb, var(--border) 70%, var(--surface) 30%);
  --footer-bg: #0f172a;
  --footer-text: #ffffff;
  --footer-muted: #cbd5e1;
  --footer-border: rgba(255, 255, 255, 0.12);
}
body { background: var(--bg) !important; color: var(--text) !important; }
a { color: color-mix(in srgb, var(--primary) 82%, var(--text) 18%); }
.hero, .hero__shell, .hero__minimal, .radical-hero { color: var(--hero-text, var(--text-on-bg, var(--text))) !important; }
.hero h1, .hero h2, .hero h3, .hero p, .hero li, .hero__title, .hero__subtitle, .hero__bullets li { color: inherit !important; }
.hero__minimal, .semantic-section__container, .block-section > .el-container, .el-section.vibe-premium > .el-container, .shell-panel, .trust-strip, .cta-panel__bar, .urgency-layout__copy, .map-block__frame, .map-wrapper, .map-boxed-wrapper, .el-breadcrumbs__list {
  background: var(--glass-panel-bg, var(--surface)) !important;
  border-color: var(--glass-panel-border, var(--border)) !important;
  color: var(--text-on-surface, var(--text)) !important;
}
.service-card, .proof-card, .step-card, .price-card, .faq-item, .faq-entry, .faq-item-refined, .testimonial-card, .semantic-card, .trust-band__pill-card, .conversion-proof-item {
  background: var(--surface) !important;
  color: var(--text-on-surface, var(--text)) !important;
}
.service-card h2, .service-card h3, .proof-card h2, .proof-card h3, .step-card h2, .step-card h3, .price-card h2, .price-card h3, .faq-item h2, .faq-item h3, .faq-entry h2, .faq-entry h3, .testimonial-card h2, .testimonial-card h3, .semantic-card h2, .semantic-card h3, .hero-highlight__copy strong { color: var(--text-on-surface, var(--text)) !important; }
.service-card p, .proof-card p, .step-card p, .price-card p, .faq-item p, .faq-entry p, .testimonial-card p, .semantic-card p, .conversion-proof-item__text, .hero-highlight__copy span { color: var(--muted) !important; }
.hero-highlight, .hero-card--floating { background: var(--surface) !important; color: var(--text-on-surface, var(--text)) !important; border-color: var(--border) !important; }
.cta-primary, .nav__cta, .nav-mobile__cta, .card__btn, .mobile-sticky-cta__button, .section-cta--terminal a, .urgency-banner a, .cta-panel a[class*="primary"] {
  background: var(--primary) !important;
  color: var(--text-on-primary) !important;
  border-color: color-mix(in srgb, var(--primary), #000 12%) !important;
}
.cta-secondary, .nav a, .nav__links-group a { color: var(--text) !important; }
.section-tone-contrast, .urgency-banner, .cta-panel__banner, .section-cta--terminal { background: var(--surface) !important; color: var(--text-on-surface, var(--text)) !important; }
.section-tone-contrast h2, .section-tone-contrast h3, .section-tone-contrast p, .urgency-banner h2, .urgency-banner p, .cta-panel__banner h2, .cta-panel__banner p { color: inherit !important; }
.footer-editorial {
  background: radial-gradient(circle at top left, rgba(var(--primary-rgb), 0.28), transparent 34%), linear-gradient(135deg, var(--footer-bg), color-mix(in srgb, var(--footer-bg) 84%, var(--primary) 16%)) !important;
  color: var(--footer-text) !important;
  border-top: 1px solid var(--footer-border) !important;
}
.footer-editorial[data-style="minimal"] { --footer-bg: color-mix(in srgb, var(--bg) 86%, #020617 14%); --footer-text: var(--text-on-bg, var(--text)); --footer-muted: var(--muted); --footer-border: var(--border); background: linear-gradient(180deg, color-mix(in srgb, var(--surface) 92%, transparent), var(--bg)) !important; }
.footer-editorial[data-style="directory"] { --footer-bg: color-mix(in srgb, #0f172a 82%, var(--primary) 18%); }
.footer-editorial[data-style="editorial"] { --footer-bg: #0f172a; }
.family-technical_grid .footer-editorial, .family-local_trust .footer-editorial { --footer-bg: color-mix(in srgb, #111827 80%, var(--primary) 20%); }
.family-asymmetric_premium .footer-editorial { --footer-bg: color-mix(in srgb, #020617 74%, var(--primary) 26%); }
.family-minimal_authority .footer-editorial, .family-editorial .footer-editorial { --footer-bg: color-mix(in srgb, var(--bg) 88%, #020617 12%); --footer-text: var(--text-on-bg, var(--text)); --footer-muted: var(--muted); --footer-border: var(--border); }
.footer-editorial h2, .footer-editorial h3, .footer-editorial h4, .footer-editorial .footer__brand-name, .footer-editorial .footer__phone-link { color: var(--footer-text) !important; }
.footer-editorial p, .footer-editorial .footer__tagline, .footer-editorial .footer__availability, .footer-editorial .footer__nav-link, .footer-editorial .footer__bottom, .footer-editorial .footer__group-title, .footer__text, .footer__link, .footer__subtitle { color: var(--footer-muted) !important; }
.footer-editorial .footer__nav-link:hover, .footer__link:hover { color: var(--footer-text) !important; }
.footer-editorial .footer__bottom { border-top-color: var(--footer-border) !important; }
[style*="color: #fff"], [style*="color:#fff"], [style*="color: white"], [style*="color:white"] { text-shadow: 0 1px 2px rgba(0,0,0,.25); }
@supports not (color: color-mix(in srgb, #000, #fff)) {
  a { color: var(--primary); }
  .hero__minimal, .semantic-section__container, .block-section > .el-container, .el-section.vibe-premium > .el-container, .el-breadcrumbs__list { background: var(--surface) !important; }
  .footer-editorial { background: #0f172a !important; color: #ffffff !important; }
  .footer-editorial[data-style="minimal"] { background: var(--bg) !important; color: var(--text) !important; }
  .service-card p, .proof-card p, .step-card p, .price-card p, .faq-item p, .faq-entry p, .testimonial-card p, .semantic-card p, .conversion-proof-item__text { color: var(--muted) !important; }
}
`;
}
