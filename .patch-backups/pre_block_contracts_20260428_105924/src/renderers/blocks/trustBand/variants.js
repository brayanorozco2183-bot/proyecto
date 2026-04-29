import { escapeHtml, renderCta, renderInlinePills, renderParagraphs, renderSectionHeading, wrapSectionBlock, safeArray } from '../shared.js';
function resolveTrustLabels(input) {
    const fromContent = safeArray(input.content.bullets || input.content.items?.map((i) => i.title))
        .map((item) => String(item || '').trim())
        .filter(Boolean);
    const fallback = [
        input.local?.labels?.trustEyebrow ? `Atención ${String(input.local.labels.trustEyebrow).toLowerCase()}` : '',
        'Presupuesto claro',
        'Cobertura local'
    ].filter(Boolean);
    const labels = (fromContent.length ? fromContent : fallback)
        .map((item) => item.replace(/\s{2,}/g, ' ').trim())
        .filter((item) => item && item.toLowerCase() !== 'confianza visible');
    return Array.from(new Set(labels)).slice(0, 5);
}
const scrollingStrip = (input) => {
    const labels = resolveTrustLabels(input);
    if (!labels.length)
        return '';
    return wrapSectionBlock(input, `
      ${renderSectionHeading(input.content.heading, input.local?.labels?.trustEyebrow || 'Señales claras')}
      ${renderParagraphs(input.content.subheading, 'trust-band__intro')}
      <div class="trust-band__marquee">
        ${labels.map((item) => `<span class="trust-band__chip">${escapeHtml(item)}</span>`).join('')}
      </div>
      ${renderCta(input.content.cta, input.local, input)}
    `, 'trust-band trust-band--scroll');
};
const staticPills = (input) => {
    const labels = resolveTrustLabels(input);
    if (!labels.length)
        return '';
    return wrapSectionBlock(input, `
      ${renderSectionHeading(input.content.heading, input.local?.labels?.trustEyebrow || 'Confianza visible')}
      ${renderInlinePills(labels, 'trust-band__pills')}
    `, 'trust-band trust-band--pills');
};
const minimalIcons = (input) => {
    const labels = resolveTrustLabels(input);
    if (!labels.length)
        return '';
    return wrapSectionBlock(input, `
      ${renderSectionHeading(input.content.heading, input.local?.labels?.trustEyebrow || 'Confianza visible')}
      <div class="trust-band__icons">
        ${labels.map((item) => `
          <article class="trust-band__item">
            <span class="trust-band__icon" aria-hidden="true">•</span>
            <span>${escapeHtml(item)}</span>
          </article>
        `).join('')}
      </div>
    `, 'trust-band trust-band--icons');
};
export const renderTrustBandVariants = {
    scrolling_strip: scrollingStrip,
    static_pills: staticPills,
    minimal_icons: minimalIcons
};
