import type { ContentDraft, GenerationMission, NormalizedContext, PagePlan } from '../types/pipeline_v2.js';
import { buildPublicFallbackParagraphs } from '../utils/fallbackQuality.js';
import { createPremiumFallbackHtml } from './fallbackRegistry.js';
import { hashString } from './layoutRecipes.js';

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeTel(value: unknown): string {
  return String(value || '').replace(/[^+0-9]/g, '');
}

function pickEmergencyClass(seed: string): string {
  const classes = ['emergency-editorial', 'emergency-split', 'emergency-cards', 'emergency-contrast', 'emergency-local'];
  return classes[hashString(seed) % classes.length];
}

function fallbackBlockHtml(args: {
  block: any;
  index: number;
  niche: string;
  city: string;
  phone: string;
  businessName: string;
  mission?: GenerationMission;
}): string {
  const heading = escapeHtml(args.block?.h2 || args.block?.metadata?.heading || args.block?.metadata?.block_type || 'Información del servicio');
  const rawHtml = String(args.block?.html || '').trim();
  const alreadySectioned = /<section\b/i.test(rawHtml) || /section-shell|semantic-section|block-section|\bpfb\b/i.test(rawHtml);
  if (rawHtml && alreadySectioned) {
    return `<div class="section section--embedded" data-fallback-block="${args.index}">${rawHtml}</div>`;
  }
  if (rawHtml) {
    return `<section class="section"><div class="section-kicker">${String(args.index + 1).padStart(2, '0')}</div><h2>${heading}</h2>${rawHtml}</section>`;
  }
  const premium = createPremiumFallbackHtml({
    niche: args.niche,
    city: args.city,
    phone: args.phone,
    businessName: args.businessName,
    blockType: args.block?.metadata?.block_type || args.block?.type || 'content',
    sectionTitle: String(args.block?.h2 || ''),
    sectionId: String(args.block?.id || `fallback-${args.index}`),
    contextualData: args.mission?.contextual_data,
    seedHint: `emergency:${args.index}`,
    reason: 'empty_block_emergency_render',
  });
  return premium.html;
}

export function renderEmergencyFallbackPage(input: {
  draft?: ContentDraft;
  plan?: PagePlan;
  context?: NormalizedContext;
  mission?: GenerationMission;
  error?: unknown;
}): string {
  const cityRaw = input.context?.city || input.mission?.city || 'tu zona';
  const nicheRaw = input.context?.niche || input.mission?.niche || 'servicio local';
  const businessNameRaw = input.context?.clean_nap?.business_name || input.mission?.local_nap?.business_name || 'Servicio local';
  const phoneRaw = input.context?.clean_nap?.phone || input.mission?.local_nap?.phone || '';
  const h1Raw = (input.draft as any)?.h1 || input.plan?.h1 || `${nicheRaw} en ${cityRaw}`;
  const titleRaw = (input.draft as any)?.meta_title || h1Raw;
  const descriptionRaw = (input.draft as any)?.meta_description || `Información práctica de ${nicheRaw} en ${cityRaw}.`;

  const city = escapeHtml(cityRaw);
  const niche = escapeHtml(nicheRaw);
  const h1 = escapeHtml(h1Raw);
  const title = escapeHtml(titleRaw);
  const description = escapeHtml(descriptionRaw);
  const businessName = escapeHtml(businessNameRaw);
  const phone = escapeHtml(phoneRaw);
  const tel = escapeTel(phoneRaw);
  const seed = `${nicheRaw}:${cityRaw}:${h1Raw}:${input.plan?.variant || ''}`;
  const emergencyClass = pickEmergencyClass(seed);

  const sourceBlocks = input.draft?.blocks?.length ? input.draft.blocks : [
    createPremiumFallbackHtml({ niche: nicheRaw, city: cityRaw, blockType: 'servicesGrid', phone: phoneRaw, businessName: businessNameRaw, contextualData: input.mission?.contextual_data, seedHint: `${seed}:services` }),
    createPremiumFallbackHtml({ niche: nicheRaw, city: cityRaw, blockType: 'processSteps', phone: phoneRaw, businessName: businessNameRaw, contextualData: input.mission?.contextual_data, seedHint: `${seed}:process` }),
    createPremiumFallbackHtml({ niche: nicheRaw, city: cityRaw, blockType: 'faq', phone: phoneRaw, businessName: businessNameRaw, contextualData: input.mission?.contextual_data, seedHint: `${seed}:faq` }),
  ].map((result, index) => ({ id: `emergency-${index}`, type: result.blockType, h2: result.h2, html: result.html, metadata: { block_type: result.blockType } }));

  const blocks = sourceBlocks
    .slice(0, 14)
    .map((block: any, index: number) => fallbackBlockHtml({ block, index, niche: nicheRaw, city: cityRaw, phone: phoneRaw, businessName: businessNameRaw, mission: input.mission }))
    .join('\n');

  const fallbackIntro = buildPublicFallbackParagraphs({ niche: nicheRaw, city: cityRaw, blockType: 'hero', phone: phoneRaw }).slice(0, 2);

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <style>
    :root{--primary:#0f766e;--primary-rgb:15,118,110;--ink:#0f172a;--muted:#475569;--line:rgba(148,163,184,.22);--surface:#fff;--soft:#f8fafc;--shadow:0 20px 54px rgba(15,23,42,.09)}
    *{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:var(--ink);line-height:1.65;background:linear-gradient(180deg,#f8fafc,#eef5f7)}
    body.emergency-editorial{background:radial-gradient(circle at 10% 0,rgba(var(--primary-rgb),.13),transparent 28%),#f8fafc}body.emergency-split{background:linear-gradient(90deg,#f8fafc 0 55%,rgba(var(--primary-rgb),.08) 55%)}body.emergency-cards{background:radial-gradient(circle at 80% 10%,rgba(var(--primary-rgb),.12),transparent 32%),#f1f5f9}body.emergency-contrast{background:#0f172a;color:#e5eef8}body.emergency-local{background:linear-gradient(135deg,#fff,#eff6ff)}
    main{max-width:1180px;margin:0 auto;padding:30px 18px 78px}.hero,.section,.pfb{background:rgba(255,255,255,.94);border:1px solid rgba(255,255,255,.88);border-radius:30px;padding:clamp(1.25rem,3vw,2.8rem);margin:18px 0;box-shadow:var(--shadow);overflow:hidden}.emergency-contrast .hero,.emergency-contrast .section,.emergency-contrast .pfb{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.15);color:#fff}.emergency-contrast p,.emergency-contrast li{color:rgba(255,255,255,.76)}
    .hero{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(270px,.85fr);gap:clamp(1.1rem,3vw,2.4rem);align-items:center}.emergency-editorial .hero{grid-template-columns:1fr}.emergency-cards .hero{grid-template-columns:minmax(0,.95fr) minmax(300px,1fr)}.hero__panel{display:grid;gap:1rem}.hero__eyebrow,.section-kicker,.pfb__kicker{display:inline-flex;width:max-content;max-width:100%;border-radius:999px;background:rgba(var(--primary-rgb),.09);border:1px solid rgba(var(--primary-rgb),.16);color:var(--primary);font-weight:850;font-size:.76rem;letter-spacing:.08em;text-transform:uppercase;padding:.45rem .76rem}.emergency-contrast .hero__eyebrow,.emergency-contrast .section-kicker,.emergency-contrast .pfb__kicker{background:rgba(255,255,255,.10);border-color:rgba(255,255,255,.18);color:#99f6e4}.hero__card{border-radius:24px;background:#0f172a;color:#fff;padding:1.35rem;box-shadow:0 22px 50px rgba(2,6,23,.20)}.hero__card p{color:rgba(255,255,255,.76)}
    h1{font-size:clamp(2.1rem,5.4vw,4.35rem);line-height:1.02;margin:0;letter-spacing:-.05em;max-width:14ch}h2{font-size:clamp(1.48rem,3vw,2.35rem);line-height:1.1;margin:.35rem 0 .85rem;letter-spacing:-.03em}h3{line-height:1.15;margin:0 0 .45rem}p{color:var(--muted);margin:0 0 1rem}.cta,.pfb__cta,.cta-link{display:inline-flex;align-items:center;justify-content:center;width:max-content;min-height:3.15rem;padding:.8rem 1.25rem;border-radius:999px;background:linear-gradient(135deg,var(--primary),#064e49);color:#fff!important;text-decoration:none;font-weight:850;box-shadow:0 16px 34px rgba(var(--primary-rgb),.23)}
    .trust-strip,.pfb__cards,.pfb__faq{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:.85rem;margin-top:1rem}.trust-pill,.pfb__card,.pfb__faq-item{padding:1rem;border:1px solid var(--line);border-radius:18px;background:#fff;box-shadow:0 10px 24px rgba(15,23,42,.045)}.emergency-contrast .trust-pill,.emergency-contrast .pfb__card,.emergency-contrast .pfb__faq-item{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.13)}.pfb__list{display:grid;gap:.5rem;margin:1rem 0;padding-left:1.15rem}.pfb-split .pfb__inner,.pfb-hero--split .pfb__inner{display:grid;grid-template-columns:minmax(0,1fr) minmax(260px,.75fr);gap:1.2rem;align-items:start}.pfb-contrast{background:#0f172a!important;color:#fff!important}.pfb-contrast p,.pfb-contrast li{color:rgba(255,255,255,.78)!important}.section--embedded{padding:0!important;background:transparent!important;border:0!important;box-shadow:none!important}.section--embedded>section{margin:0!important}.mobile-safe-cta{display:none}
    @media(max-width:760px){body{padding-bottom:5.4rem}main{padding:14px 10px 72px}.hero,.pfb-split .pfb__inner,.pfb-hero--split .pfb__inner{grid-template-columns:1fr}.hero,.section,.pfb{border-radius:22px}.cta,.pfb__cta,.cta-link{width:100%}.mobile-safe-cta{display:flex;position:fixed;left:.75rem;right:.75rem;bottom:.75rem;z-index:99;align-items:center;justify-content:space-between;gap:.8rem;padding:.75rem .85rem;border-radius:18px;background:#0f172a;color:#fff;box-shadow:0 18px 44px rgba(2,6,23,.32)}.mobile-safe-cta a{display:grid;place-items:center;width:3rem;height:3rem;border-radius:14px;background:var(--primary);color:#fff;text-decoration:none}}
  </style>
</head>
<body class="${emergencyClass}">
  <main>
    <section class="hero">
      <div class="hero__panel">
        <span class="hero__eyebrow">${businessName}</span>
        <h1>${h1}</h1>
        ${fallbackIntro.map((p) => `<p>${escapeHtml(p)}</p>`).join('')}
        ${phone ? `<a class="cta" data-cta="primary" href="tel:${tel}">Llamar ahora: ${phone}</a>` : `<a class="cta" data-cta="primary" href="#contacto">Solicitar orientación</a>`}
        <div class="trust-strip" aria-label="Señales de confianza">
          <div class="trust-pill">Presupuesto claro</div>
          <div class="trust-pill">Cobertura en ${city}</div>
          <div class="trust-pill">Criterio técnico</div>
        </div>
      </div>
      <aside class="hero__card"><strong>${niche}</strong><p>Contenido de seguridad editorial para mantener una página útil, coherente y publicable aunque falle la composición principal.</p></aside>
    </section>
    ${blocks}
  </main>
  <footer id="contacto" class="section"><h2>Contacto</h2><p>Describe brevemente el caso para orientar el alcance del trabajo en ${city}.</p></footer>
  ${phone ? `<div class="mobile-safe-cta"><span><strong>Llamar ahora</strong><br>${niche} en ${city}</span><a href="tel:${tel}" aria-label="Llamar">📞</a></div>` : ''}
</body>
</html>`;
}
