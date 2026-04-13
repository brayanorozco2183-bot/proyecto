import type { BlockContext, BlockRendererInput, BlockSectionBase, HeroBlockPayload, SectionBlockPayload } from './types.js';

export function escapeHtml(value = ''): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function escapeAttribute(value = ''): string {
  return escapeHtml(String(value).replace(/\s+/g, ' ').trim());
}

export function safeArray<T>(value: T[] | undefined | null): T[] {
  return Array.isArray(value) ? value : [];
}

export function sanitizeToken(value: string | undefined | null, fallback = 'default'): string {
  if (!value) return fallback;
  const cleaned = String(value).trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
  return cleaned || fallback;
}

export function toTelHref(phone?: string, fallback = '#contacto'): string {
  if (!phone) return fallback;
  const digits = String(phone).replace(/[^\d+]/g, '');
  return digits ? `tel:${digits}` : fallback;
}

export function resolvePhone(context?: BlockContext, localPhone?: string): string {
  return localPhone || context?.phone || '';
}

export function renderParagraphs(paragraphs: string[] | undefined | null, className = 'block__intro'): string {
  const safeParagraphs = safeArray(paragraphs).filter(Boolean);
  if (!safeParagraphs.length) return '';
  return `<div class="${className}">${safeParagraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}</div>`;
}

export function renderMeta(meta: string[] | undefined | null, className = 'card__meta'): string {
  const items = safeArray(meta).filter(Boolean);
  if (!items.length) return '';
  return `<ul class="${className}">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
}

export function renderBullets(items: string[] | undefined | null, className = 'block__bullets'): string {
  const values = safeArray(items).filter(Boolean);
  if (!values.length) return '';
  return `<ul class="${className}">${values.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
}

export function renderInlinePills(items: string[] | undefined | null, className = 'block__pills'): string {
  const values = safeArray(items).filter(Boolean);
  if (!values.length) return '';
  return `<div class="${className}">${values.map((item) => `<span class="block__pill">${escapeHtml(item)}</span>`).join('')}</div>`;
}

export function renderSectionHeading(heading?: string, eyebrow?: string): string {
  const headingHtml = heading ? `<h2 class="block__title">${escapeHtml(heading)}</h2>` : '';
  const eyebrowHtml = eyebrow ? `<span class="block__eyebrow">${escapeHtml(eyebrow)}</span>` : '';
  if (!headingHtml && !eyebrowHtml) return '';
  return `<header class="block__header">${eyebrowHtml}${headingHtml}</header>`;
}

export function renderCta(
  cta: { text?: string; phone?: string; note?: string; href?: string } | undefined,
  local?: BlockContext,
  input?: BlockRendererInput
): string {
  const phone = cta?.phone || local?.phone;
  const href = cta?.href || local?.ctaHref || toTelHref(phone);
  const text = cta?.text || local?.labels?.primaryCta || 'Contactar ahora';
  
  const theme = input?.design;
  const buttonStyle = theme?.rules.buttonSystem;
  
  const ctaClass = [
    'cta-primary',
    buttonStyle?.fontCase === 'uppercase' ? 'is-uppercase' : '',
    buttonStyle?.primaryFill === 'accent' ? 'is-accent' : ''
  ].filter(Boolean).join(' ');

  const compactPhone = phone ? String(phone).replace(/\D/g, '') : '';
  const compactText = text ? String(text).replace(/\D/g, '') : '';
  const textAlreadyShowsPhone = Boolean(compactPhone && compactText && compactPhone === compactText);
  const noteHtml = cta?.note ? `<span class="block__cta-note">${escapeHtml(cta.note)}</span>` : '';
  const phoneHtml = phone && !textAlreadyShowsPhone && cta?.note
    ? `<span class="block__cta-phone">${escapeHtml(phone)}</span>`
    : '';

  return `
    <div class="block__cta-group">
      <a href="${escapeAttribute(href)}" class="${ctaClass}" aria-label="${escapeAttribute(`${text}${phone ? ` ${phone}` : ''}`)}">
        ${escapeHtml(text)}
      </a>
      ${phoneHtml}
      ${noteHtml}
    </div>
  `;
}

export function wrapSectionBlock(
  input: BlockRendererInput,
  innerHtml: string,
  extraClass = ''
): string {
  const { sectionId, blockType, variant, design } = input;
  const theme = design;
  
  // Resolve strategy weights from theme rules
  const shell = theme.rules.shellUsage[blockType as keyof typeof theme.rules.shellUsage] || theme.rules.shellUsage.default;
  const rhythm = theme.rules.verticalRhythm;
  const cardStyle = theme.rules.cards.variant;
  const density = input.contract?.density || 'standard';
  const emphasis = input.contract?.emphasis || 'content';
  const mobilePattern = input.contract?.mobilePattern || 'stack';

  const className = [
    'block-section',
    `block--${sanitizeToken(blockType)}`,
    `shell--${shell}`,
    `rhythm--${rhythm}`,
    `cards--${cardStyle}`,
    `density--${sanitizeToken(density)}`,
    `emphasis--${sanitizeToken(emphasis)}`,
    `mobile--${sanitizeToken(mobilePattern)}`,
    `variant--${sanitizeToken(variant)}`,
    extraClass
  ].filter(Boolean).join(' ');

  return `
    <section
      id="${escapeAttribute(sectionId || blockType)}"
      class="${className}"
      data-theme-id="${theme.id}"
      data-block-type="${escapeAttribute(blockType)}"
    >
      <div class="el-container">
        <div class="block-section__inner section-shell shell-${sanitizeToken(shell)} density--${sanitizeToken(density)}">
          ${innerHtml}
        </div>
      </div>
    </section>
  `;
}

export function wrapHeroBlock(input: BlockRendererInput, innerHtml: string, extraClass = ''): string {
  const theme = input.design;
  const variant = sanitizeToken(input.variant || 'default');
  const template = theme.rules.hero.template;
  
  const className = [
    'hero-block', 
    `hero--${variant}`, 
    `template--${template}`,
    extraClass
  ].filter(Boolean).join(' ');

  return `
    <section
      class="${className}"
      data-theme-id="${theme.id}"
      data-hero-template="${template}"
    >
      <div class="el-container">
        ${innerHtml}
      </div>
    </section>
  `;
}

export function deriveFallbackItems(
  titles: string[] | undefined | null,
  body = 'Contenido listo para hidratarse desde semantic.items.'
): Array<{ title: string; body: string; meta?: string[] }> {
  return safeArray(titles)
    .filter(Boolean)
    .map((title) => ({ title, body }));
}

export function renderTable(
  table: { columns: string[]; rows: string[][] } | undefined,
  className = 'block-table'
): string {
  if (!table || !safeArray(table.columns).length || !safeArray(table.rows).length) return '';

  const header = table.columns.map((column) => `<th scope="col">${escapeHtml(column)}</th>`).join('');
  const rows = table.rows
    .map(
      (row) =>
        `<tr>${safeArray(row).map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`
    )
    .join('');

  return `
    <div class="${className}" style="max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;">
      <table class="semantic-table" style="min-width:640px;width:100%;table-layout:fixed;">
        <thead><tr>${header}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}