import { escapeHtml, renderCta, renderInlinePills, renderMeta, renderParagraphs, renderSectionHeading, wrapSectionBlock } from '../shared.js';
function renderCards(input, numbered = false) {
    const items = input.content.items || [];
    return `
    <div class="services-grid__cards">
      ${items.map((item, index) => `
        <article class="service-card">
          ${numbered ? `<span class="service-card__badge">${String(index + 1).padStart(2, '0')}</span>` : ''}
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.body)}</p>
          ${renderMeta(item.meta, 'service-card__meta')}
        </article>
      `).join('')}
    </div>
  `;
}
const cleanCards = (input) => {
    const header = renderSectionHeading(input.content.heading, input.local?.labels?.servicesEyebrow || 'Oferta principal');
    const intro = renderParagraphs(input.content.subheading, 'services-grid__intro');
    const trust = renderInlinePills(input.content.bullets, 'services-grid__trust');
    const cta = renderCta(input.content.cta, input.local, input);
    return wrapSectionBlock(input, `
      ${header}
      ${intro}
      ${renderCards(input)}
      ${trust}
      ${cta}
    `, 'services-grid services-grid--clean');
};
const iconTiles = (input) => {
    const header = renderSectionHeading(input.content.heading, input.local?.labels?.servicesEyebrow || 'Capacidades');
    const intro = renderParagraphs(input.content.subheading, 'services-grid__intro');
    const trust = renderInlinePills(input.content.bullets, 'services-grid__trust');
    return wrapSectionBlock(input, `
      ${header}
      ${intro}
      ${renderCards(input, true)}
      ${trust}
      ${renderCta(input.content.cta, input.local, input)}
    `, 'services-grid services-grid--icon-tiles');
};
const editorialColumns = (input) => {
    const items = input.content.items || [];
    const header = renderSectionHeading(input.content.heading, input.local?.labels?.servicesEyebrow || 'Especialidades');
    const intro = renderParagraphs(input.content.subheading, 'services-grid__intro');
    const trust = renderInlinePills(input.content.bullets, 'services-grid__trust');
    return wrapSectionBlock(input, `
      ${header}
      <div class="services-grid__editorial">
        <div class="services-grid__lead">
          ${intro}
          ${trust}
          ${renderCta(input.content.cta, input.local, input)}
        </div>
        <div class="services-grid__column-list">
          ${items.map((item) => `
            <article class="service-row">
              <h3>${escapeHtml(item.title)}</h3>
              <p>${escapeHtml(item.body)}</p>
              ${renderMeta(item.meta, 'service-row__meta')}
            </article>
          `).join('')}
        </div>
      </div>
    `, 'services-grid services-grid--editorial');
};
export const renderServicesGridVariants = {
    clean_cards: cleanCards,
    icon_tiles: iconTiles,
    editorial_columns: editorialColumns
};
