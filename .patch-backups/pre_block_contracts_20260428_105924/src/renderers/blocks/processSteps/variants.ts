import { escapeHtml, renderBullets, renderCta, renderParagraphs, renderSectionHeading, renderMeta, wrapSectionBlock } from '../shared.js';
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

const timelineVertical = (input: BlockRendererInput): string => {
  const items = normalizeItems(input);
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
              ${item.title ? `<h3>${escapeHtml(item.title)}</h3>` : ''}
              ${item.body ? `<p>${escapeHtml(item.body)}</p>` : ''}
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
  const items = normalizeItems(input);
  return wrapSectionBlock(
    input,
    `
      ${renderSectionHeading(input.content.heading, input.local?.labels?.processEyebrow || 'Cómo se ejecuta')}
      ${renderParagraphs(input.content.subheading, 'process-steps__intro')}
      <div class="process-steps__grid">
        ${items.map((item: any, index: number) => `
          <article class="step-tile">
            <span class="step-tile__index">${String(index + 1).padStart(2, '0')}</span>
            ${item.title ? `<h3>${escapeHtml(item.title)}</h3>` : ''}
            ${item.body ? `<p>${escapeHtml(item.body)}</p>` : ''}
          </article>
        `).join('')}
      </div>
      ${renderBullets(input.content.bullets, 'process-steps__bullets')}
    `,
    'process-steps process-steps--grid'
  );
};

const numberedList = (input: BlockRendererInput): string => {
  const items = normalizeItems(input);
  return wrapSectionBlock(
    input,
    `
      ${renderSectionHeading(input.content.heading, input.local?.labels?.processEyebrow || 'Pasos')}
      <ol class="process-steps__list">
        ${items.map((item: any, index: number) => `
          <li>
            <span class="step-card__index">${index + 1}</span>
            <div class="step-card__body">
              ${item.title ? `<h3>${escapeHtml(item.title)}</h3>` : ''}
              ${item.body ? `<p>${escapeHtml(item.body)}</p>` : ''}
              ${renderMeta(item.meta, 'step-row__meta')}
            </div>
          </li>
        `).join('')}
      </ol>
      ${renderCta(input.content.cta, input.local, input)}
    `,
    'process-steps process-steps--list'
  );
};

const steppedRail = (input: BlockRendererInput): string => {
  const items = normalizeItems(input);
  return wrapSectionBlock(
    input,
    `
      ${renderSectionHeading(input.content.heading, input.local?.labels?.processEyebrow || 'Cómo se organiza el trabajo')}
      <div class="process-steps__rail-layout">
        <div class="process-steps__rail-copy">
          ${renderParagraphs(input.content.subheading, 'process-steps__intro')}
          ${renderBullets(input.content.bullets, 'process-steps__bullets')}
          ${renderCta(input.content.cta, input.local, input)}
        </div>
        <div class="process-steps__rail">
          ${items.map((item: any, index: number) => `
            <article class="process-step-rail">
              <span class="process-step-rail__index">${String(index + 1).padStart(2, '0')}</span>
              <div class="process-step-rail__body">
                ${item.title ? `<h3>${escapeHtml(item.title)}</h3>` : ''}
                ${item.body ? `<p>${escapeHtml(item.body)}</p>` : ''}
                ${renderMeta(item.meta, 'step-row__meta')}
              </div>
            </article>
          `).join('')}
        </div>
      </div>
    `,
    'process-steps process-steps--rail'
  );
};

export const renderProcessStepsVariants: Record<string, (input: BlockRendererInput) => string> = {
  timeline_vertical: timelineVertical,
  grid_steps: gridSteps,
  numbered_list: numberedList,
  stepped_rail: steppedRail
};
