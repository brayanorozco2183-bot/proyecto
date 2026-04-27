import { normalizeUsablePhone, renderBullets, renderCta, renderInlinePills, renderParagraphs, renderSectionHeading, wrapSectionBlock } from '../shared.js';
import type { BlockRendererInput } from '../types.js';

function renderUrgencySignals(input: BlockRendererInput): string {
  const items = (input.content.bullets || input.content.trustBullets || []).filter(Boolean).slice(0, 3);
  return items.length ? renderInlinePills(items, 'urgency-banner__pills') : '';
}

const sidebarAlert = (input: BlockRendererInput): string => {
  const phone = normalizeUsablePhone(input.content?.cta?.phone || input.local?.phone || '');
  return wrapSectionBlock(
    input,
    `
      <div class="urgency-layout urgency-layout--stack">
        <div class="urgency-layout__copy card--strong-border">
          ${renderSectionHeading(input.content.heading, input.local?.labels?.urgencyEyebrow || 'Atención inmediata')}
          ${renderParagraphs(input.content.subheading, 'urgency-layout__intro')}
          ${renderBullets(input.content.bullets || input.content.trustBullets, 'urgency-layout__bullets')}
        </div>
        <aside class="urgency-layout__action">
          <div class="section-cta section-cta--high section-cta--terminal card--strong-border">
            ${renderCta({ text: phone ? 'Llamar ahora' : 'Solicitar atención', phone }, input.local, input)}
          </div>
        </aside>
      </div>
    `,
    'urgency-panel urgency-panel--sidebar'
  );
};

const statusBanner = (input: BlockRendererInput): string => {
  const phone = normalizeUsablePhone(input.content?.cta?.phone || input.local?.phone || '');
  return wrapSectionBlock(
    input,
    `
      <div class="urgency-banner urgency-banner--inline card--strong-border">
        <div class="urgency-banner__rail"></div>
        <div class="urgency-banner__content">
          <div class="urgency-banner__status">
            <span class="urgency-banner__dot" aria-hidden="true"></span>
            <span class="urgency-banner__kicker">Disponibilidad activa</span>
          </div>
          ${renderSectionHeading(input.content.heading, input.local?.labels?.urgencyEyebrow || 'Disponibilidad activa')}
          ${renderParagraphs(input.content.subheading, 'urgency-layout__intro')}
          ${renderUrgencySignals(input)}
        </div>
        <div class="urgency-banner__cta">
          ${renderCta({ text: phone ? 'Llamar ahora' : 'Solicitar atención', phone }, input.local, input)}
        </div>
      </div>
    `,
    'urgency-panel urgency-panel--inline'
  );
};

const commandCenter = (input: BlockRendererInput): string => {
  const phone = normalizeUsablePhone(input.content?.cta?.phone || input.local?.phone || '');
  return wrapSectionBlock(
    input,
    `
      <div class="urgency-banner urgency-banner--command card--strong-border">
        <div class="urgency-banner__rail"></div>
        <div class="urgency-banner__content">
          <div class="urgency-banner__status">
            <span class="urgency-banner__dot" aria-hidden="true"></span>
            <span class="urgency-banner__kicker">Guardia operativa</span>
          </div>
          ${renderSectionHeading(input.content.heading, input.local?.labels?.urgencyEyebrow || 'Respuesta inmediata')}
          ${renderParagraphs(input.content.subheading, 'urgency-layout__intro')}
          ${renderUrgencySignals(input)}
        </div>
        <div class="urgency-banner__statbox">
          <span class="urgency-banner__statlabel">Estado</span>
          <strong class="urgency-banner__statvalue">Alta</strong>
          <span class="urgency-banner__statnote">disponibilidad</span>
        </div>
        <div class="urgency-banner__cta">
          ${renderCta({ text: phone ? 'Llamar ahora' : 'Solicitar atención', phone }, input.local, input)}
        </div>
      </div>
    `,
    'urgency-panel urgency-panel--command'
  );
};

export const renderUrgencyPanelVariants: Record<string, (input: BlockRendererInput) => string> = {
  sidebar_alert: sidebarAlert,
  status_banner: statusBanner,
  command_center: commandCenter
};
