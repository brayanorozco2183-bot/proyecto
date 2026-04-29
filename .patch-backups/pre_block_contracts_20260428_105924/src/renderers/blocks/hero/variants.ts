import { escapeHtml, renderCta, renderInlinePills, toTelHref, wrapHeroBlock } from '../shared.js';
import type { BlockRendererInput } from '../types.js';

function resolvePhone(input: BlockRendererInput): string {
  return input.content.phone || input.local?.phone || '';
}

function resolvePrimaryCta(input: BlockRendererInput): string {
  return input.content.cta_text || input.local?.labels?.primaryCta || 'Llamar ahora';
}

function resolveSecondaryCta(input: BlockRendererInput): string {
  return input.content.secondary_cta_text || input.local?.labels?.secondaryCta || 'Ver servicios';
}

const splitPremium = (input: BlockRendererInput): string => {
  const phone = resolvePhone(input);
  const niche = input.seo?.niche || '';
  const city = input.seo?.city || '';
  
  return wrapHeroBlock(
    input,
    `
      <div class="hero-block__shell hero-block__shell--split">
        <div class="hero-block__copy">
          <span class="hero-block__eyebrow">${escapeHtml(input.content.eyebrow || `${niche} · ${city}`.trim())}</span>
          <h1>${escapeHtml(input.content.h1)}</h1>
          ${input.content.subtitle ? `<p class="hero-block__subtitle">${escapeHtml(input.content.subtitle)}</p>` : ''}
          ${renderInlinePills(input.content.trust_bullets, 'hero-block__trust')}
          <div class="hero-block__actions">
            ${renderCta({ text: resolvePrimaryCta(input), phone }, input.local, input)}
            <a href="#servicios" class="cta-secondary">${escapeHtml(resolveSecondaryCta(input))}</a>
          </div>
        </div>
        <aside class="hero-block__aside">
          <article class="hero-proof-card">
            <span class="hero-proof-card__eyebrow">${escapeHtml(input.content.hero_card_eyebrow || 'Atención directa')}</span>
            <strong>${escapeHtml(input.content.hero_card_title || 'Respuesta rápida y enfoque claro')}</strong>
            <p>${escapeHtml(input.content.hero_card_text || 'Bloque listo para conectar con tus datos locales, teléfono real y argumentos de confianza.')}</p>
            ${phone ? renderCta({ text: phone, phone }, input.local, input) : ''}
          </article>
        </aside>
      </div>
    `,
    'hero-block hero-block--split'
  );
};

const centeredClean = (input: BlockRendererInput): string => {
  const phone = resolvePhone(input);
  return wrapHeroBlock(
    input,
    `
      <div class="hero-block__shell hero-block__shell--centered">
        <span class="hero-block__eyebrow">${escapeHtml(input.content.eyebrow || input.seo?.city || 'Servicio local')}</span>
        <h1>${escapeHtml(input.content.h1)}</h1>
        ${input.content.subtitle ? `<p class="hero-block__subtitle">${escapeHtml(input.content.subtitle)}</p>` : ''}
        ${renderInlinePills(input.content.trust_bullets, 'hero-block__trust')}
        <div class="hero-block__actions hero-block__actions--centered">
          ${renderCta({ text: resolvePrimaryCta(input), phone }, input.local, input)}
        </div>
      </div>
    `,
    'hero-block hero-block--centered'
  );
};

const stackedDark = (input: BlockRendererInput): string => {
  const phone = resolvePhone(input);
  return wrapHeroBlock(
    input,
    `
      <div class="hero-block__shell hero-block__shell--stacked">
        <span class="hero-block__eyebrow">${escapeHtml(input.content.eyebrow || input.seo?.city || 'Servicio local')}</span>
        <h1>${escapeHtml(input.content.h1)}</h1>
        ${input.content.subtitle ? `<p class="hero-block__subtitle">${escapeHtml(input.content.subtitle)}</p>` : ''}
        ${renderInlinePills(input.content.trust_bullets, 'hero-block__trust hero-block__trust--dark')}
        <article class="hero-proof-card hero-proof-card--dark">
          <span class="hero-proof-card__eyebrow">${escapeHtml(input.content.hero_card_eyebrow || 'Garantía por escrito')}</span>
          <strong>${escapeHtml(input.content.hero_card_title || 'Arquitectura preparada para CTA fuerte')}</strong>
          <p>${escapeHtml(input.content.hero_card_text || 'Usa este bloque cuando tu ADN visual pida una hero más compacta y más intensa.')}</p>
          <div class="hero-block__actions">
            ${renderCta({ text: resolvePrimaryCta(input), phone }, input.local, input)}
            <a href="#servicios" class="cta-secondary">${escapeHtml(resolveSecondaryCta(input))}</a>
          </div>
        </article>
      </div>
    `,
    'hero-block hero-block--stacked'
  );
};

export const renderHeroVariants: Record<string, (input: BlockRendererInput) => string> = {
  split_premium: splitPremium,
  centered_clean: centeredClean,
  stacked_dark: stackedDark
};