import { readFileSync } from 'node:fs';

let cachedProceduralGlobalStyles: string | null = null;

const PROCEDURAL_GLOBAL_STYLES_FALLBACK = `
/* === Gravity Procedural Base Fallback === */
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;font-family:var(--font-body,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif);background:var(--bg,#f8fafc);color:var(--text,#0f172a);line-height:1.68;overflow-x:hidden}.el-container{width:100%;max-width:1180px;margin-inline:auto;padding-inline:clamp(1rem,3vw,2rem)}.el-section,.block-section,.semantic-section{padding:clamp(3rem,5vw,5rem) 0}.site-header{position:sticky;top:0;z-index:80;background:rgba(255,255,255,.94);border-bottom:1px solid rgba(148,163,184,.12)}.site-header__inner{display:flex;align-items:center;justify-content:space-between;gap:1rem;min-height:4rem}.nav-mobile{display:none}.nav--desktop{display:flex}@media(max-width:760px){.nav--desktop{display:none!important}.nav-mobile{display:block!important}}.service-card,.proof-card,.step-card,.price-card,.faq-item,.faq-entry,.semantic-card{background:var(--surface,#fff);border:1px solid var(--border,rgba(148,163,184,.16));border-radius:1rem;box-shadow:var(--shadow-soft,0 6px 22px rgba(15,23,42,.055));padding:clamp(1rem,2vw,1.5rem)}.services-grid__cards,.semantic-items,.local-proof__grid,.price-guidance__cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,17rem),1fr));gap:1rem}img,iframe,svg,video{max-width:100%}ul:empty,ol:empty,p:empty,h2:empty,h3:empty{display:none!important}
`;

const PROCEDURAL_CONVERSION_UX_PATCH = `
/* === Gravity Conversion UX Super Patch === */
:root{--cta-bg:linear-gradient(135deg,#0f766e,#064e49);--cta-shadow:0 14px 34px rgba(var(--primary-rgb,15,118,110),.22);--section-tight-y:clamp(2.7rem,5vw,4.5rem)}
.cta-primary{min-height:3.15rem;background:var(--cta-bg)!important;box-shadow:var(--cta-shadow)!important;border-radius:999px;color:var(--text-on-primary,#fff)!important;text-decoration:none;font-weight:900}.conversion-proof-strip{padding:clamp(1rem,2.4vw,1.65rem) 0 clamp(1.35rem,3vw,2.25rem)}.conversion-proof-strip__grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:.85rem}.conversion-proof-item{display:grid;grid-template-columns:auto minmax(0,1fr);gap:.15rem .75rem;align-items:center;min-height:5.7rem;padding:1rem;border-radius:1.15rem;background:var(--surface,#fff);border:1px solid var(--border,rgba(148,163,184,.16));box-shadow:var(--shadow-soft,0 6px 22px rgba(15,23,42,.055))}@media(max-width:900px){.conversion-proof-strip__grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:640px){.conversion-proof-strip__grid{grid-template-columns:1fr}}
`;

function readProceduralGlobalCss(): string {
  try {
    return readFileSync(new URL('./procedural-global.css', import.meta.url), 'utf8');
  } catch (error) {
    console.warn('[ProceduralStyles] procedural-global.css not found; using compact fallback CSS.', error);
    return PROCEDURAL_GLOBAL_STYLES_FALLBACK;
  }
}

function appendOnce(styles: string, marker: string, extra: string): string {
  return styles.includes(marker) ? styles : `${styles}\n${extra}`;
}

export function getProceduralGlobalStyles(): string {
  if (cachedProceduralGlobalStyles !== null) return cachedProceduralGlobalStyles;

  let styles = readProceduralGlobalCss();

  // Default production path: one compact procedural base. The final delivery normalizer
  // appends the authoritative cascade lock at the end of the document. This prevents the
  // accumulated patch layers from fighting each other in the browser.
  const useLegacyLayeredCss = process.env.GRAVITY_LEGACY_LAYERED_CSS === 'true';

  if (useLegacyLayeredCss) {
    styles = appendOnce(styles, 'Gravity Conversion UX Super Patch', PROCEDURAL_CONVERSION_UX_PATCH);
  } else {
    styles = appendOnce(styles, 'Gravity Conversion UX Super Patch', PROCEDURAL_CONVERSION_UX_PATCH);
  }

  cachedProceduralGlobalStyles = styles;
  return styles;
}
