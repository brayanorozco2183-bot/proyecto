import { escapeHtml, renderBullets, renderCta, renderParagraphs, renderSectionHeading, renderMeta, wrapSectionBlock } from '../shared.js';
import type { BlockRendererInput } from '../types.js';

const gridLogos = (input: BlockRendererInput): string => {
  const items = input.content.items || [];
  return wrapSectionBlock(
    input,
    `
      ${renderSectionHeading(input.content.heading, input.seo?.city || 'Cobertura')}
      ${renderParagraphs(input.content.subheading, 'local-proof__intro')}
      <div class="local-proof__grid">
        ${items.map((item: any) => `
          <article class="proof-card proof-card--logo">
            <span class="proof-card__label">${escapeHtml(item.title)}</span>
            <p>${escapeHtml(item.body)}</p>
            ${renderMeta(item.meta, 'proof-card__meta')}
          </article>
        `).join('')}
      </div>
      ${input.content.mapNote ? `<p class="local-proof__map-note">${escapeHtml(input.content.mapNote)}</p>` : ''}
      ${renderCta(input.content.cta, input.local, input)}
    `,
    'local-proof local-proof--grid'
  );
};

const listDetailed = (input: BlockRendererInput): string => {
  const items = input.content.items || [];
  return wrapSectionBlock(
    input,
    `
      ${renderSectionHeading(input.content.heading, input.seo?.city || 'Cobertura')}
      <div class="local-proof__list-layout">
        <div class="local-proof__lead">
          ${renderParagraphs(input.content.subheading, 'local-proof__intro')}
          ${renderBullets(input.content.bullets, 'local-proof__areas')}
        </div>
        <div class="local-proof__details">
          ${items.map((item: any) => `
            <article class="proof-row">
              <h3>${escapeHtml(item.title)}</h3>
              <p>${escapeHtml(item.body)}</p>
              ${renderMeta(item.meta, 'proof-row__meta')}
            </article>
          `).join('')}
        </div>
      </div>
      ${input.content.mapNote ? `<p class="local-proof__map-note">${escapeHtml(input.content.mapNote)}</p>` : ''}
    `,
    'local-proof local-proof--detailed'
  );
};

const cardsMinimal = (input: BlockRendererInput): string => {
  const items = input.content.items || [];
  return wrapSectionBlock(
    input,
    `
      ${renderSectionHeading(input.content.heading, input.seo?.city || 'Cobertura')}
      ${renderParagraphs(input.content.subheading, 'local-proof__intro')}
      <div class="local-proof__cards-minimal">
        ${items.map((item: any) => `
          <article class="proof-card proof-card--minimal">
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.body)}</p>
          </article>
        `).join('')}
      </div>
      ${renderBullets(input.content.bullets, 'local-proof__areas')}
      ${renderCta(input.content.cta, input.local, input)}
    `,
    'local-proof local-proof--minimal'
  );
};

export const renderLocalProofVariants: Record<string, (input: BlockRendererInput) => string> = {
  grid_logos: gridLogos,
  list_detailed: listDetailed,
  cards_minimal: cardsMinimal
};