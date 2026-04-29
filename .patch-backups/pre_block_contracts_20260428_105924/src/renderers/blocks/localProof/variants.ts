import { escapeHtml, renderCta, renderParagraphs, renderSectionHeading, renderMeta, safeArray, wrapSectionBlock } from '../shared.js';
import type { BlockRendererInput } from '../types.js';

function normalizeItems(input: BlockRendererInput): Array<{ title: string; body: string; meta?: string[] }> {
  return safeArray(input.content.items)
    .map((item: any) => ({
      title: String(item?.title || '').trim(),
      body: String(item?.body || '').trim(),
      meta: safeArray(item?.meta).filter(Boolean)
    }))
    .filter((item) => item.title || item.body);
}

function renderSignals(items: string[] | undefined | null): string {
  const values = safeArray(items)
    .map((item) => String(item || '').replace(/\s+/g, ' ').trim().replace(/[.;:,]+$/g, ''))
    .filter(Boolean)
    .slice(0, 4);

  if (!values.length) return '';

  const secondaryCopy = (label: string): string => {
    const normalized = label.toLowerCase();
    if (/cobertura/.test(normalized)) return 'Se coordina con cobertura real, no como una promesa genérica.';
    if (/zona|desplazamiento/.test(normalized)) return 'Ayuda a ordenar desplazamientos, franjas y acceso antes de intervenir.';
    if (/seguimiento|revisi[oó]n/.test(normalized)) return 'Permite dar continuidad al servicio cuando el caso requiere más de una fase.';
    if (/presupuesto|proceso/.test(normalized)) return 'Aclara alcance, orden de trabajo y expectativas antes de empezar.';
    return 'Aporta contexto operativo y una planificación más clara del servicio.';
  };

  return `
    <div class="local-proof__signal-list">
      ${values.map((item, index) => `
        <article class="local-proof__signal">
          <span class="local-proof__signal-index">${String(index + 1).padStart(2, '0')}</span>
          <div class="local-proof__signal-copy">
            <strong>${escapeHtml(item)}</strong>
            <span>${escapeHtml(secondaryCopy(item))}</span>
          </div>
        </article>
      `).join('')}
    </div>
  `;
}

const gridLogos = (input: BlockRendererInput): string => {
  const items = normalizeItems(input);
  return wrapSectionBlock(
    input,
    `
      ${renderSectionHeading(input.content.heading, input.local?.labels?.proofEyebrow || 'Resultados verificados')}
      <div class="local-proof__grid">
        ${items.slice(0, 6).map((item: any) => `
          <div class="proof-card">
            <span class="proof-card__label">${escapeHtml(item.title || item.body)}</span>
          </div>
        `).join('')}
      </div>
      ${renderCta(input.content.cta, input.local, input)}
    `,
    'local-proof local-proof--grid'
  );
};

const listDetailed = (input: BlockRendererInput): string => {
  const items = normalizeItems(input);
  return wrapSectionBlock(
    input,
    `
      ${renderSectionHeading(input.content.heading, input.local?.labels?.proofEyebrow || 'Metodología local')}
      <div class="local-proof__list-layout">
        <div class="local-proof__lead">
          ${renderParagraphs(input.content.subheading, 'local-proof__intro')}
          ${renderSignals(input.content.bullets)}
        </div>
        <div class="local-proof__details">
          ${items.map((item: any) => `
            <article class="proof-row">
              ${item.title ? `<h3>${escapeHtml(item.title)}</h3>` : ''}
              ${item.body ? `<p>${escapeHtml(item.body)}</p>` : ''}
              ${renderMeta(item.meta, 'proof-row__meta')}
            </article>
          `).join('')}
        </div>
      </div>
      ${renderCta(input.content.cta, input.local, input)}
    `,
    'local-proof local-proof--list'
  );
};

const cardsMinimal = (input: BlockRendererInput): string => {
  const items = normalizeItems(input);
  return wrapSectionBlock(
    input,
    `
      ${renderSectionHeading(input.content.heading, input.local?.labels?.proofEyebrow || 'Evidencia directa')}
      <div class="local-proof__minimal-grid">
        ${items.map((item: any) => `
          <article class="proof-card-minimal">
            ${item.title ? `<h3>${escapeHtml(item.title)}</h3>` : ''}
            ${item.body ? `<p>${escapeHtml(item.body)}</p>` : ''}
          </article>
        `).join('')}
      </div>
      ${renderSignals(input.content.bullets)}
      ${renderCta(input.content.cta, input.local, input)}
    `,
    'local-proof local-proof--minimal'
  );
};

const evidenceStack = (input: BlockRendererInput): string => {
  const items = normalizeItems(input);
  return wrapSectionBlock(
    input,
    `
      ${renderSectionHeading(input.content.heading, input.seo?.city || 'Cobertura')}
      <div class="local-proof__evidence-layout">
        <div class="local-proof__lead">
          ${renderParagraphs(input.content.subheading, 'local-proof__intro')}
          ${renderSignals(input.content.bullets)}
          ${input.content.mapNote ? `<p class="local-proof__map-note">${escapeHtml(input.content.mapNote)}</p>` : ''}
        </div>
        <div class="local-proof__evidence-stack">
          ${items.map((item: any, index: number) => `
            <article class="proof-row proof-row--stacked">
              <span class="proof-row__ordinal">${String(index + 1).padStart(2, '0')}</span>
              <div class="proof-row__content">
                ${item.title ? `<h3>${escapeHtml(item.title)}</h3>` : ''}
                ${item.body ? `<p>${escapeHtml(item.body)}</p>` : ''}
                ${renderMeta(item.meta, 'proof-row__meta')}
              </div>
            </article>
          `).join('')}
        </div>
      </div>
    `,
    'local-proof local-proof--evidence'
  );
};

const coverageSplit = (input: BlockRendererInput): string => {
  const items = normalizeItems(input);
  const primary = items.slice(0, 2);
  const secondary = items.slice(2);
  return wrapSectionBlock(
    input,
    `
      ${renderSectionHeading(input.content.heading, input.seo?.city || input.local?.labels?.proofEyebrow || 'Cobertura operativa')}
      <div class="local-proof__coverage">
        <div class="local-proof__coverage-copy">
          ${renderParagraphs(input.content.subheading, 'local-proof__intro')}
          ${renderSignals(input.content.bullets)}
          ${renderCta(input.content.cta, input.local, input)}
        </div>
        <div class="local-proof__coverage-cards">
          ${primary.map((item: any, index: number) => `
            <article class="proof-card proof-card--coverage">
              <span class="service-card__kicker">${escapeHtml((item.meta || [])[0] || `Cobertura ${index + 1}`)}</span>
              ${item.title ? `<h3>${escapeHtml(item.title)}</h3>` : ''}
              ${item.body ? `<p>${escapeHtml(item.body)}</p>` : ''}
            </article>
          `).join('')}
          ${secondary.length ? `<div class="local-proof__coverage-list">${secondary.map((item: any) => `
            <article class="proof-row">
              ${item.title ? `<h3>${escapeHtml(item.title)}</h3>` : ''}
              ${item.body ? `<p>${escapeHtml(item.body)}</p>` : ''}
              ${renderMeta(item.meta, 'proof-row__meta')}
            </article>
          `).join('')}</div>` : ''}
        </div>
      </div>
    `,
    'local-proof local-proof--coverage'
  );
};

export const renderLocalProofVariants: Record<string, (input: BlockRendererInput) => string> = {
  grid_logos: gridLogos,
  list_detailed: listDetailed,
  cards_minimal: cardsMinimal,
  evidence_stack: evidenceStack,
  coverage_split: coverageSplit
};
