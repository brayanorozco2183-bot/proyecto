import { deriveFallbackItems, escapeHtml, getTableRows, renderBullets, renderCta, renderParagraphs, renderSectionHeading, renderTable, wrapSectionBlock } from '../shared.js';
import type { BlockRendererInput } from '../types.js';

function resolveItems(input: BlockRendererInput) {
  const items = input.content.items || [];
  return items.length
    ? items
    : deriveFallbackItems(input.content.h3s, 'Explicación clara del criterio que conviene revisar antes de comparar propuestas.');
}

const tableSimple = (input: BlockRendererInput): string => {
  return wrapSectionBlock(
    input,
    `
      ${renderSectionHeading(input.content.heading, input.local?.labels?.pricingEyebrow || 'Transparencia')}
      ${renderParagraphs(input.content.subheading, 'price-guidance__intro')}
      ${renderTable(input.content.table, 'price-guidance__table')}
      ${renderBullets(input.content.bullets, 'price-guidance__bullets')}
      ${renderCta(input.content.cta, input.local, input)}
    `,
    'price-guidance price-guidance--table'
  );
};

const cardsPrice = (input: BlockRendererInput): string => {
  const items = resolveItems(input);
  const rows = getTableRows(input.content.table);

  return wrapSectionBlock(
    input,
    `
      ${renderSectionHeading(input.content.heading, input.local?.labels?.pricingEyebrow || 'Qué cambia según el caso')}
      ${renderParagraphs(input.content.subheading, 'price-guidance__intro')}
      <div class="price-guidance__cards">
        ${items.map((item: any, index: number) => `
          <article class="price-card">
            <span class="service-card__kicker">${escapeHtml(((rows[index] as string[] | undefined)?.[0]) || `Criterio ${index + 1}`)}</span>
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.body)}</p>
            ${rows[index] ? `<ul class="price-card__facts">${(rows[index] as string[]).map((cell) => `<li>${escapeHtml(cell)}</li>`).join('')}</ul>` : ''}
          </article>
        `).join('')}
      </div>
      ${renderCta(input.content.cta, input.local, input)}
    `,
    'price-guidance price-guidance--cards'
  );
};

const listTransparent = (input: BlockRendererInput): string => {
  const items = resolveItems(input);
  return wrapSectionBlock(
    input,
    `
      ${renderSectionHeading(input.content.heading, input.local?.labels?.pricingEyebrow || 'Cómo valorar el presupuesto')}
      ${renderParagraphs(input.content.subheading, 'price-guidance__intro')}
      ${renderBullets(input.content.bullets, 'price-guidance__bullets')}
      <div class="price-guidance__criteria">
        ${items.map((item: any, index: number) => `
          <article class="criteria-row">
            <span class="service-card__kicker">${escapeHtml((item.meta || [])[0] || `Clave ${index + 1}`)}</span>
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.body)}</p>
          </article>
        `).join('')}
      </div>
      ${renderCta(input.content.cta, input.local, input)}
    `,
    'price-guidance price-guidance--transparent'
  );
};

const insightPanels = (input: BlockRendererInput): string => {
  const items = resolveItems(input);
  return wrapSectionBlock(
    input,
    `
      ${renderSectionHeading(input.content.heading, input.local?.labels?.pricingEyebrow || 'Qué influye en el presupuesto')}
      <div class="price-guidance__insight">
        <div class="price-guidance__insight-copy">
          ${renderParagraphs(input.content.subheading, 'price-guidance__intro')}
          ${renderBullets(input.content.bullets, 'price-guidance__bullets')}
          ${renderCta(input.content.cta, input.local, input)}
        </div>
        <div class="price-guidance__insight-panels">
          ${items.map((item: any, index: number) => `
            <article class="price-card price-card--insight">
              <span class="service-card__kicker">${escapeHtml((item.meta || [])[0] || `Factor ${String(index + 1).padStart(2, '0')}`)}</span>
              <h3>${escapeHtml(item.title)}</h3>
              <p>${escapeHtml(item.body)}</p>
            </article>
          `).join('')}
        </div>
      </div>
    `,
    'price-guidance price-guidance--insight'
  );
};

export const renderPriceGuidanceVariants: Record<string, (input: BlockRendererInput) => string> = {
  table_simple: tableSimple,
  cards_price: cardsPrice,
  list_transparent: listTransparent,
  insight_panels: insightPanels
};
