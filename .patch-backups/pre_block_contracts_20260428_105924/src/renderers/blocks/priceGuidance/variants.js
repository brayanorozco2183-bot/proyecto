import { deriveFallbackItems, escapeHtml, renderBullets, renderCta, renderParagraphs, renderSectionHeading, renderTable, wrapSectionBlock } from '../shared.js';
function resolveItems(input) {
    const items = input.content.items || [];
    return items.length
        ? items
        : deriveFallbackItems(input.content.h3s, 'Criterio transparente listo para hidratarse.');
}
const tableSimple = (input) => {
    return wrapSectionBlock(input, `
      ${renderSectionHeading(input.content.heading, input.local?.labels?.pricingEyebrow || 'Transparencia')}
      ${renderParagraphs(input.content.subheading, 'price-guidance__intro')}
      ${renderTable(input.content.table, 'price-guidance__table')}
      ${renderBullets(input.content.bullets, 'price-guidance__bullets')}
      ${renderCta(input.content.cta, input.local, input)}
    `, 'price-guidance price-guidance--table');
};
const cardsPrice = (input) => {
    const items = resolveItems(input);
    const rows = input.content.table?.rows || [];
    return wrapSectionBlock(input, `
      ${renderSectionHeading(input.content.heading, input.local?.labels?.pricingEyebrow || 'Qué cambia según el caso')}
      ${renderParagraphs(input.content.subheading, 'price-guidance__intro')}
      <div class="price-guidance__cards">
        ${items.map((item, index) => `
          <article class="price-card">
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.body)}</p>
            ${rows[index] ? `<ul class="price-card__facts">${rows[index].map((cell) => `<li>${escapeHtml(cell)}</li>`).join('')}</ul>` : ''}
          </article>
        `).join('')}
      </div>
      ${renderCta(input.content.cta, input.local, input)}
    `, 'price-guidance price-guidance--cards');
};
const listTransparent = (input) => {
    const items = resolveItems(input);
    return wrapSectionBlock(input, `
      ${renderSectionHeading(input.content.heading, input.local?.labels?.pricingEyebrow || 'Cómo valorar el presupuesto')}
      ${renderParagraphs(input.content.subheading, 'price-guidance__intro')}
      ${renderBullets(input.content.bullets, 'price-guidance__bullets')}
      <div class="price-guidance__criteria">
        ${items.map((item) => `
          <article class="criteria-row">
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.body)}</p>
          </article>
        `).join('')}
      </div>
      ${renderCta(input.content.cta, input.local, input)}
    `, 'price-guidance price-guidance--transparent');
};
export const renderPriceGuidanceVariants = {
    table_simple: tableSimple,
    cards_price: cardsPrice,
    list_transparent: listTransparent
};
