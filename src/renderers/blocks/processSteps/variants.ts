import { escapeHtml, renderBullets, renderCta, renderParagraphs, renderSectionHeading, renderMeta, wrapSectionBlock } from '../shared.js';
import type { BlockRendererInput } from '../types.js';

const timelineVertical = (input: BlockRendererInput): string => {
  const items = input.content.items || [];
  return wrapSectionBlock(
    input,
    `
      ${renderSectionHeading(input.content.heading, input.local?.labels?.processEyebrow || 'Proceso')}
      ${renderParagraphs(input.content.subheading, 'process-steps__intro')}
      <div class="process-steps__timeline">
        ${items.map((item: any, index: number) => `
          <article class="step-card">
            <span class="step-card__index">${index + 1}</span>
            <div class="step-card__body">
              <h3>${escapeHtml(item.title)}</h3>
              <p>${escapeHtml(item.body)}</p>
              ${renderMeta(item.meta, 'step-card__meta')}
            </div>
          </article>
        `).join('')}
      </div>
      ${renderCta(input.content.cta, input.local, input)}
    `,
    'process-steps process-steps--timeline'
  );
};

const gridSteps = (input: BlockRendererInput): string => {
  const items = input.content.items || [];
  return wrapSectionBlock(
    input,
    `
      ${renderSectionHeading(input.content.heading, input.local?.labels?.processEyebrow || 'Cómo se ejecuta')}
      ${renderParagraphs(input.content.subheading, 'process-steps__intro')}
      <div class="process-steps__grid">
        ${items.map((item: any, index: number) => `
          <article class="step-tile">
            <span class="step-tile__index">${String(index + 1).padStart(2, '0')}</span>
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.body)}</p>
          </article>
        `).join('')}
      </div>
      ${renderBullets(input.content.bullets, 'process-steps__bullets')}
    `,
    'process-steps process-steps--grid'
  );
};

const numberedList = (input: BlockRendererInput): string => {
  const items = input.content.items || [];
  return wrapSectionBlock(
    input,
    `
      ${renderSectionHeading(input.content.heading, input.local?.labels?.processEyebrow || 'Pasos')}
      <ol class="process-steps__list">
        ${items.map((item: any) => `
          <li>
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.body)}</p>
            ${renderMeta(item.meta, 'step-row__meta')}
          </li>
        `).join('')}
      </ol>
      ${renderCta(input.content.cta, input.local, input)}
    `,
    'process-steps process-steps--list'
  );
};

export const renderProcessStepsVariants: Record<string, (input: BlockRendererInput) => string> = {
  timeline_vertical: timelineVertical,
  grid_steps: gridSteps,
  numbered_list: numberedList
};