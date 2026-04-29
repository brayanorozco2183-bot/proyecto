import { escapeHtml, renderCta, renderParagraphs, renderSectionHeading, wrapSectionBlock } from '../shared.js';
import type { BlockFaqItem, BlockRendererInput } from '../types.js';

const accordionClean = (input: BlockRendererInput): string => {
  const faqItems = input.content.faqItems || [];
  return wrapSectionBlock(
    input,
    `
      ${renderSectionHeading(input.content.heading, input.local?.labels?.faqEyebrow || 'Resolvemos dudas')}
      ${renderParagraphs(input.content.subheading, 'faq-block__intro')}
      <div class="faq-block__accordion faq-block__accordion--refined">
        ${faqItems.map((item: BlockFaqItem, index: number) => `
          <details class="faq-item faq-item-refined" data-faq-item="true">
            <summary class="faq-summary-refined">
              <span class="faq-summary-refined__count">${String(index + 1).padStart(2, '0')}</span>
              <span class="faq-summary-refined__text">${escapeHtml(item.question)}</span>
              <span class="faq-icon-arrow" aria-hidden="true"></span>
            </summary>
            <div class="faq-content-refined"><p>${escapeHtml(item.answer)}</p></div>
          </details>
        `).join('')}
      </div>
      ${renderCta(input.content.cta, input.local, input)}
    `,
    'faq-block faq-block--accordion'
  );
};

const editorialList = (input: BlockRendererInput): string => {
  const faqItems = input.content.faqItems || [];
  return wrapSectionBlock(
    input,
    `
      ${renderSectionHeading(input.content.heading, input.local?.labels?.faqEyebrow || 'Preguntas frecuentes')}
      ${renderParagraphs(input.content.subheading, 'faq-block__intro')}
      <div class="faq-block__editorial-list">
        ${faqItems.map((item: BlockFaqItem, index: number) => `
          <article class="faq-entry" data-faq-item="true">
            <span class="service-card__kicker">Pregunta ${String(index + 1).padStart(2, '0')}</span>
            <h3>${escapeHtml(item.question)}</h3>
            <p>${escapeHtml(item.answer)}</p>
          </article>
        `).join('')}
      </div>
      ${renderCta(input.content.cta, input.local, input)}
    `,
    'faq-block faq-block--editorial'
  );
};

export const renderFaqVariants: Record<string, (input: BlockRendererInput) => string> = {
  accordion_clean: accordionClean,
  editorial_list: editorialList
};
