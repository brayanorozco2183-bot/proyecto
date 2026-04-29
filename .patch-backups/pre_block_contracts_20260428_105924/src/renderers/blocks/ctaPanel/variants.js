import { renderBullets, renderCta, renderInlinePills, renderParagraphs, renderSectionHeading, wrapSectionBlock } from '../shared.js';
function uniqueStrings(values) {
    return Array.from(new Set(values.filter(Boolean).map((value) => value.trim()).filter(Boolean)));
}
function resolveTrustBullets(input) {
    return uniqueStrings([
        ...(Array.isArray(input.content?.trustBullets) ? input.content.trustBullets : []),
        ...(Array.isArray(input.content?.bullets) ? input.content.bullets : []),
        ...(Array.isArray(input.content?.h3s) ? input.content.h3s : [])
    ]).slice(0, 3);
}
function resolveActionBullets(input) {
    return uniqueStrings([
        ...(Array.isArray(input.content?.bullets) ? input.content.bullets : []),
        ...(Array.isArray(input.content?.h3s) ? input.content.h3s : [])
    ]).slice(0, 3);
}
const minimalPhoneBar = (input) => {
    return wrapSectionBlock(input, `
      <div class="cta-panel__bar">
        <div class="cta-panel__copy">
          ${renderSectionHeading(input.content.heading, input.local?.labels?.ctaEyebrow || 'Siguiente paso')}
          ${renderParagraphs(input.content.subheading, 'cta-panel__intro')}
        </div>
        ${renderCta(input.content.cta, input.local, input)}
      </div>
    `, 'cta-panel cta-panel--bar');
};
const luxuryBanner = (input) => {
    const trustBullets = resolveTrustBullets(input);
    const actionBullets = resolveActionBullets(input);
    return wrapSectionBlock(input, `
      <div class="cta-panel__banner">
        <div class="cta-panel__banner-copy">
          ${renderSectionHeading(input.content.heading, input.local?.labels?.ctaEyebrow || 'Contacto directo')}
          ${renderParagraphs(input.content.subheading, 'cta-panel__intro')}
        </div>
        <div class="cta-panel__banner-actions">
          ${renderInlinePills(trustBullets, 'cta-panel__trust')}
          ${renderBullets(actionBullets, 'cta-panel__bullets')}
          ${renderCta(input.content.cta, input.local, input)}
        </div>
      </div>
    `, 'cta-panel cta-panel--luxury');
};
export const renderCtaPanelVariants = {
    minimal_phone_bar: minimalPhoneBar,
    luxury_banner: luxuryBanner
};
