import { escapeHtml, renderCta, renderInlinePills, renderMeta, renderParagraphs, renderSectionHeading, wrapSectionBlock } from '../shared.js';
import type { BlockRendererInput } from '../types.js';

function normalizeItems(input: BlockRendererInput): Array<{ title: string; body: string; meta?: string[] }> {
  return (input.content.items || [])
    .map((item: any) => ({
      title: String(item?.title || '').trim(),
      body: String(item?.body || '').trim(),
      meta: Array.isArray(item?.meta) ? item.meta.filter(Boolean) : []
    }))
    .filter((item: any) => item.title || item.body);
}

function renderServiceCard(item: { title: string; body: string; meta?: string[] }, index: number, mode: 'clean' | 'compact' = 'clean'): string {
  const kicker = (item.meta || [])[0] || `Bloque ${String(index + 1).padStart(2, '0')}`;
  return `
    <article class="service-card service-card--${mode}">
      <span class="service-card__kicker">${escapeHtml(kicker)}</span>
      ${item.title ? `<h3>${escapeHtml(item.title)}</h3>` : ''}
      ${item.body ? `<p>${escapeHtml(item.body)}</p>` : ''}
      ${renderMeta((item.meta || []).slice(mode === 'compact' ? 1 : 0), 'service-card__meta')}
    </article>
  `;
}

const cleanCards = (input: BlockRendererInput): string => {
  const items = normalizeItems(input);
  const header = renderSectionHeading(input.content.heading, input.local?.labels?.servicesEyebrow || 'Oferta principal');
  const intro = renderParagraphs(input.content.subheading, 'services-grid__intro');
  const trust = renderInlinePills(input.content.bullets, 'services-grid__trust');
  const cta = renderCta(input.content.cta, input.local, input);

  return wrapSectionBlock(
    input,
    `
      ${header}
      ${intro}
      <div class="services-grid__cards services-grid__cards--balanced">
        ${items.map((item: any, index: number) => renderServiceCard(item, index)).join('')}
      </div>
      ${trust}
      ${cta}
    `,
    'services-grid services-grid--clean'
  );
};

const iconTiles = (input: BlockRendererInput): string => {
  const items = normalizeItems(input);
  const header = renderSectionHeading(input.content.heading, input.local?.labels?.servicesEyebrow || 'Capacidades');
  const intro = renderParagraphs(input.content.subheading, 'services-grid__intro');
  const trust = renderInlinePills(input.content.bullets, 'services-grid__trust');

  return wrapSectionBlock(
    input,
    `
      ${header}
      ${intro}
      <div class="services-grid__cards services-grid__cards--numbered">
        ${items.map((item: any, index: number) => `
          <article class="service-card service-card--numbered">
            <span class="service-card__badge">${String(index + 1).padStart(2, '0')}</span>
            <span class="service-card__kicker">${escapeHtml((item.meta || [])[0] || 'Servicio')}</span>
            ${item.title ? `<h3>${escapeHtml(item.title)}</h3>` : ''}
            ${item.body ? `<p>${escapeHtml(item.body)}</p>` : ''}
            ${renderMeta((item.meta || []).slice(1), 'service-card__meta')}
          </article>
        `).join('')}
      </div>
      ${trust}
      ${renderCta(input.content.cta, input.local, input)}
    `,
    'services-grid services-grid--icon-tiles'
  );
};

const editorialColumns = (input: BlockRendererInput): string => {
  const items = normalizeItems(input);
  const header = renderSectionHeading(input.content.heading, input.local?.labels?.servicesEyebrow || 'Especialidades');
  const intro = renderParagraphs(input.content.subheading, 'services-grid__intro');
  const trust = renderInlinePills(input.content.bullets, 'services-grid__trust');

  return wrapSectionBlock(
    input,
    `
      ${header}
      <div class="services-grid__editorial">
        <div class="services-grid__lead">
          ${intro}
          ${trust}
          ${renderCta(input.content.cta, input.local, input)}
        </div>
        <div class="services-grid__column-list">
          ${items.map((item: any, index: number) => `
            <article class="service-row service-row--editorial">
              <span class="service-card__kicker">${escapeHtml((item.meta || [])[0] || `Punto ${index + 1}`)}</span>
              ${item.title ? `<h3>${escapeHtml(item.title)}</h3>` : ''}
              ${item.body ? `<p>${escapeHtml(item.body)}</p>` : ''}
              ${renderMeta((item.meta || []).slice(1), 'service-row__meta')}
            </article>
          `).join('')}
        </div>
      </div>
    `,
    'services-grid services-grid--editorial'
  );
};

const magazinePanels = (input: BlockRendererInput): string => {
  const items = normalizeItems(input);
  const feature = items[0];
  const rest = items.slice(1);
  const intro = renderParagraphs(input.content.subheading, 'services-grid__intro');
  const trust = renderInlinePills(input.content.bullets, 'services-grid__trust');

  return wrapSectionBlock(
    input,
    `
      ${renderSectionHeading(input.content.heading, input.local?.labels?.servicesEyebrow || 'Cobertura de servicio')}
      <div class="services-grid__magazine">
        <div class="services-grid__magazine-lead">
          ${intro}
          ${trust}
          ${feature ? `
            <article class="services-grid__magazine-feature">
              <span class="service-card__kicker">${escapeHtml((feature.meta || [])[0] || 'Servicio destacado')}</span>
              ${feature.title ? `<h3>${escapeHtml(feature.title)}</h3>` : ''}
              ${feature.body ? `<p>${escapeHtml(feature.body)}</p>` : ''}
              ${renderMeta((feature.meta || []).slice(1), 'service-card__meta')}
            </article>
          ` : ''}
          ${renderCta(input.content.cta, input.local, input)}
        </div>
        <div class="services-grid__magazine-stack">
          ${rest.map((item: any, index: number) => renderServiceCard(item, index + 1, 'compact')).join('')}
        </div>
      </div>
    `,
    'services-grid services-grid--magazine'
  );
};

export const renderServicesGridVariants: Record<string, (input: BlockRendererInput) => string> = {
  clean_cards: cleanCards,
  icon_tiles: iconTiles,
  editorial_columns: editorialColumns,
  magazine_panels: magazinePanels
};
