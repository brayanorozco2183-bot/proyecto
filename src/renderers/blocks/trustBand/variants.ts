import { escapeHtml, renderCta, renderInlinePills, renderParagraphs, renderSectionHeading, safeArray, wrapSectionBlock } from '../shared.js';
import type { BlockContentItem, BlockRendererInput } from '../types.js';

function resolveTrustLabels(input: BlockRendererInput): string[] {
  const { content, local } = input;
  const labels = [
    ...(content.bullets || []),
    ...(content.h3s || []),
    ...(local?.labels?.trustPills || [])
  ].filter(Boolean);
  
  return Array.from(new Set(labels)).slice(0, 5);
}

function resolveTrustEntries(input: BlockRendererInput): Array<{ title: string; body: string }> {
  const items = safeArray(input.content.items)
    .filter((item): item is BlockContentItem => Boolean(item?.title))
    .map((item) => ({
      title: String(item.title).trim(),
      body: String(item.body || '').trim()
    }));

  if (items.length) return items.slice(0, 4);

  return resolveTrustLabels(input).map((label) => ({
    title: label,
    body: 'Conviene comprobar que el criterio esté explicado antes de aceptar la intervención.'
  }));
}

const scrollingStrip = (input: BlockRendererInput): string => {
  const labels = resolveTrustLabels(input);
  if (!labels.length) return '';
  
  return wrapSectionBlock(
    input,
    `
      <div class="trust-band__scroller">
        <div class="trust-band__track">
          ${[...labels, ...labels].map((label) => `<span class="trust-band__item">${escapeHtml(label)}</span>`).join('')}
        </div>
      </div>
    `,
    'trust-band trust-band--scroller'
  );
};

const staticPills = (input: BlockRendererInput): string => {
  const entries = resolveTrustEntries(input);
  if (!entries.length) return '';
  return wrapSectionBlock(
    input,
    `
      ${renderSectionHeading(input.content.heading, input.local?.labels?.trustEyebrow || 'Confianza visible')}
      ${renderParagraphs(input.content.subheading, 'trust-band__intro')}
      <div class="trust-band__pills trust-band__pills--cards">
        ${entries.map((entry, index) => `
          <article class="trust-band__pill-card">
            <span class="trust-band__pill-kicker">Señal ${String(index + 1).padStart(2, '0')}</span>
            <h3 class="trust-band__pill-title">${escapeHtml(entry.title)}</h3>
            <p class="trust-band__pill-text">${escapeHtml(entry.body)}</p>
          </article>
        `).join('')}
      </div>
    `,
    'trust-band trust-band--pills'
  );
};

const minimalIcons = (input: BlockRendererInput): string => {
  const labels = resolveTrustLabels(input);
  if (!labels.length) return '';
  
  return wrapSectionBlock(
    input,
    `
      <div class="trust-band__minimal">
        ${labels.map((label) => `
          <div class="trust-band__icon-item">
            <span class="trust-band__icon-circle"></span>
            <span class="trust-band__icon-text">${escapeHtml(label)}</span>
          </div>
        `).join('')}
      </div>
    `,
    'trust-band trust-band--minimal'
  );
};

const signalGrid = (input: BlockRendererInput): string => {
  const entries = resolveTrustEntries(input);
  if (!entries.length) return '';

  return wrapSectionBlock(
    input,
    `
      ${renderSectionHeading(input.content.heading, input.local?.labels?.trustEyebrow || 'Confianza visible')}
      ${renderParagraphs(input.content.subheading, 'trust-band__intro')}
      <div class="trust-band__signal-grid">
        ${entries.map((entry, index) => `
          <article class="trust-band__signal-card">
            <span class="trust-band__signal-index">${String(index + 1).padStart(2, '0')}</span>
            <div class="trust-band__signal-copy">
              <h3>${escapeHtml(entry.title)}</h3>
              <p>${escapeHtml(entry.body)}</p>
            </div>
          </article>
        `).join('')}
      </div>
      ${renderCta(input.content.cta, input.local, input)}
    `,
    'trust-band trust-band--signal-grid'
  );
};

export const renderTrustBandVariants: Record<string, (input: BlockRendererInput) => string> = {
  scrolling_strip: scrollingStrip,
  static_pills: staticPills,
  minimal_icons: minimalIcons,
  signal_grid: signalGrid
};
