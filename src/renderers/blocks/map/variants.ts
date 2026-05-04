import { escapeAttribute, escapeHtml, renderBullets, renderCta, renderInlinePills, renderParagraphs, renderSectionHeading, wrapSectionBlock } from '../shared.js';
import type { BlockRendererInput } from '../types.js';

function buildFallbackMapUrl(input: BlockRendererInput): string {
  const address = String(input.local?.address || '').trim();
  const city = String(input.seo?.city || input.local?.city || 'España').trim();
  const query = encodeURIComponent(address || city);
  return `https://www.google.com/maps?q=${query}&output=embed`;
}

function normalizeMapEmbedUrl(input: BlockRendererInput): string {
  const raw = String(input.local?.mapEmbedUrl || '').trim();
  if (!raw) return buildFallbackMapUrl(input);
  if (!/^https?:\/\//i.test(raw)) return buildFallbackMapUrl(input);

  const looksOpaqueGoogleEmbed = /google\.[^/]+\/maps\/embed\?pb=/i.test(raw);
  const hasSearchQuery = /[?&](?:q|query|place|destination)=/i.test(raw);

  if (looksOpaqueGoogleEmbed && !hasSearchQuery) {
    return buildFallbackMapUrl(input);
  }

  return raw;
}

function renderMapFrame(input: BlockRendererInput, className = 'map-block__frame'): string {
  const embedUrl = normalizeMapEmbedUrl(input);
  const city = escapeHtml(input.seo?.city || input.local?.city || 'Ubicación');

  if (!embedUrl) {
    return `
      <div class="${className} map-block__frame--fallback" aria-label="Mapa de cobertura local">
        <div class="map-block__fallback">
          <strong>${city}</strong>
          <span>Cobertura orientativa basada en la ubicación declarada del servicio.</span>
        </div>
      </div>
    `;
  }

  return `
    <div class="${className}">
      <iframe
        class="map-block__iframe"
        src="${escapeAttribute(embedUrl)}"
        allowfullscreen=""
        loading="lazy"
        referrerpolicy="no-referrer-when-downgrade"
        aria-label="Mapa de cobertura en ${city}"
        title="Mapa de cobertura en ${city}"
        style="display:block;width:100%;height:100%;min-height:inherit;border:0;"
        fetchpriority="low"
      ></iframe>
      <div class="map-block__overlay">
        <span class="map-block__overlay-badge">Cobertura local</span>
        <span class="map-block__overlay-city">${city}</span>
      </div>
    </div>
  `;
}

function renderMapMeta(input: BlockRendererInput): string {
  const items = (input.content.bullets || []).filter(Boolean).slice(0, 3);
  const fallback = [input.seo?.city, input.local?.niche, 'Respuesta local'].filter(Boolean).slice(0, 3);
  const values = items.length ? items : fallback;
  return values.length ? renderInlinePills(values, 'map-block__pills') : '';
}

function renderSupportCard(input: BlockRendererInput): string {
  const address = escapeHtml(String(input.local?.address || '').trim() || `Cobertura en ${input.seo?.city || input.local?.city || 'tu zona'}`);
  const city = escapeHtml(String(input.seo?.city || input.local?.city || 'tu zona').trim());
  return `
    <article class="map-block__support">
      <span class="service-card__kicker">Ubicación operativa</span>
      <h3>${city}</h3>
      <p>${address}</p>
      ${input.content.mapNote ? `<p class="map-block__note">${escapeHtml(input.content.mapNote)}</p>` : ''}
    </article>
  `;
}

const fullWidth = (input: BlockRendererInput): string => {
  return wrapSectionBlock(
    input,
    `
      ${renderSectionHeading(input.content.heading, input.seo?.city || 'Ubicación')}
      ${renderParagraphs(input.content.subheading, 'map-block__intro')}
      ${renderMapFrame(input, 'map-block__frame map-block__frame--panorama')}
      <div class="map-block__meta">
        ${renderMapMeta(input)}
        ${input.content.mapNote ? `<p class="map-block__note">${escapeHtml(input.content.mapNote)}</p>` : ''}
      </div>
    `,
    'map-block map-block--full'
  );
};

const boxedWithText = (input: BlockRendererInput): string => {
  return wrapSectionBlock(
    input,
    `
      <div class="map-block__split">
        <div class="map-block__copy">
          ${renderSectionHeading(input.content.heading, input.seo?.city || 'Ubicación')}
          ${renderParagraphs(input.content.subheading, 'map-block__intro')}
          ${renderBullets(input.content.bullets, 'map-block__bullets')}
          ${input.content.mapNote ? `<p class="map-block__note">${escapeHtml(input.content.mapNote)}</p>` : ''}
          <div class="map-block__actions">
            ${renderCta(input.content.cta, input.local, input)}
          </div>
        </div>
        ${renderMapFrame(input, 'map-block__frame map-block__frame--boxed')}
      </div>
    `,
    'map-block map-block--split'
  );
};

const spotlightCard = (input: BlockRendererInput): string => {
  return wrapSectionBlock(
    input,
    `
      <div class="map-block__spotlight">
        <div class="map-block__spotlight-head">
          ${renderSectionHeading(input.content.heading, input.seo?.city || 'Cobertura local')}
          ${renderParagraphs(input.content.subheading, 'map-block__intro')}
          ${renderMapMeta(input)}
        </div>
        ${renderMapFrame(input, 'map-block__frame map-block__frame--spotlight')}
        <div class="map-block__actions map-block__actions--spotlight">
          ${input.content.mapNote ? `<p class="map-block__note">${escapeHtml(input.content.mapNote)}</p>` : ''}
          ${renderCta(input.content.cta, input.local, input)}
        </div>
      </div>
    `,
    'map-block map-block--spotlight'
  );
};

const minimalEmbed = (input: BlockRendererInput): string => {
  return wrapSectionBlock(
    input,
    `
      <div class="map-block__split map-block__split--minimal">
        <div class="map-block__copy">
          ${renderSectionHeading(input.content.heading, input.seo?.city || 'Cobertura local')}
          ${renderParagraphs(input.content.subheading, 'map-block__intro')}
          ${renderMapMeta(input)}
          ${input.content.mapNote ? `<p class="map-block__note">${escapeHtml(input.content.mapNote)}</p>` : ''}
          <div class="map-block__actions">
            ${renderCta(input.content.cta, input.local, input)}
          </div>
        </div>
        ${renderMapFrame(input, 'map-block__frame map-block__frame--minimal')}
      </div>
    `,
    'map-block map-block--minimal'
  );
};

const contextFrame = (input: BlockRendererInput): string => {
  return wrapSectionBlock(
    input,
    `
      ${renderSectionHeading(input.content.heading, input.seo?.city || 'Cobertura local')}
      <div class="map-block__context">
        <div class="map-block__context-copy">
          ${renderParagraphs(input.content.subheading, 'map-block__intro')}
          ${renderMapMeta(input)}
          ${renderSupportCard(input)}
          <div class="map-block__actions">${renderCta(input.content.cta, input.local, input)}</div>
        </div>
        ${renderMapFrame(input, 'map-block__frame map-block__frame--context')}
      </div>
    `,
    'map-block map-block--context-frame'
  );
};

export const renderMapVariants: Record<string, (input: BlockRendererInput) => string> = {
  full_width: fullWidth,
  boxed_with_text: boxedWithText,
  spotlight_card: spotlightCard,
  minimal_embed: minimalEmbed,
  context_frame: contextFrame
};
