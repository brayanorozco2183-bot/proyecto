import { escapeHtml, renderCta, renderParagraphs, renderSectionHeading, wrapSectionBlock } from '../shared.js';
const accordionClean = (input) => {
    const faqItems = input.content.faqItems || [];
    return wrapSectionBlock(input, `
      ${renderSectionHeading(input.content.heading, input.local?.labels?.faqEyebrow || 'Resolvemos dudas')}
      ${renderParagraphs(input.content.subheading, 'faq-block__intro')}
        <div class="faq-block__accordion">
          ${faqItems.map((item, index) => `
          <details class="faq-item faq-item-refined" data-faq-item="true" ${index === 0 ? 'open' : ''}>
            <summary class="faq-summary-refined">
              <span>${escapeHtml(item.question)}</span>
              <span class="faq-icon-arrow" aria-hidden="true"></span>
            </summary>
            <div class="faq-content-refined"><p>${escapeHtml(item.answer)}</p></div>
          </details>
        `).join('')}
        </div>
      ${renderCta(input.content.cta, input.local, input)}
    `, 'faq-block faq-block--accordion');
};
const editorialList = (input) => {
    const faqItems = input.content.faqItems || [];
    return wrapSectionBlock(input, `
      ${renderSectionHeading(input.content.heading, input.local?.labels?.faqEyebrow || 'Preguntas frecuentes')}
      ${renderParagraphs(input.content.subheading, 'faq-block__intro')}
      <div class="faq-block__editorial-list">
        ${faqItems.map((item) => `
          <article class="faq-entry" data-faq-item="true">
            <h3>${escapeHtml(item.question)}</h3>
            <p>${escapeHtml(item.answer)}</p>
          </article>
        `).join('')}
      </div>
      ${renderCta(input.content.cta, input.local, input)}
    `, 'faq-block faq-block--editorial');
};
export const renderFaqVariants = {
    accordion_clean: accordionClean,
    editorial_list: editorialList
};
