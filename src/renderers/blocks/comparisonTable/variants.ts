import { deriveFallbackItems, escapeHtml, renderBullets, renderCta, renderParagraphs, renderSectionHeading, renderTable, wrapSectionBlock } from '../shared.js';
import type { BlockRendererInput } from '../types.js';

function resolveItems(input: BlockRendererInput) {
  const items = input.content.items || [];
  return items.length
    ? items
    : deriveFallbackItems(input.content.h3s, 'Criterio comparativo listo para hidratarse.');
}

const matrixClean = (input: BlockRendererInput): string => {
  return wrapSectionBlock(
    input,
    `
      ${renderSectionHeading(input.content.heading, input.local?.labels?.comparisonEyebrow || 'Comparativa')}
      ${renderParagraphs(input.content.subheading, 'comparison-table__intro')}
      ${renderTable(input.content.table, 'comparison-table__matrix')}
      ${renderBullets(input.content.bullets, 'comparison-table__bullets')}
      ${renderCta(input.content.cta, input.local, input)}
    `,
    'comparison-table comparison-table--clean'
  );
};

const matrixBold = (input: BlockRendererInput): string => {
  const items = resolveItems(input);
  return wrapSectionBlock(
    input,
    `
      ${renderSectionHeading(input.content.heading, input.local?.labels?.comparisonEyebrow || 'Qué cambia')}
      ${renderParagraphs(input.content.subheading, 'comparison-table__intro')}
      <div class="comparison-table__cards">
        ${items.map((item: any) => `
          <article class="comparison-card">
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.body)}</p>
          </article>
        `).join('')}
      </div>
      ${renderTable(input.content.table, 'comparison-table__matrix comparison-table__matrix--secondary')}
      ${renderCta(input.content.cta, input.local, input)}
    `,
    'comparison-table comparison-table--bold'
  );
};

export const renderComparisonTableVariants: Record<string, (input: BlockRendererInput) => string> = {
  matrix_clean: matrixClean,
  matrix_bold: matrixBold
};