import type { BlockContext, BlockRendererInput } from './types.js';
import { technicalClean } from '../../design-system/themes/technicalClean.js';
import type { DesignSystemTheme, OfficialShell } from '../../design-system/types.js';


function resolveBlockTheme(input?: BlockRendererInput): DesignSystemTheme {
  return input?.design || technicalClean;
}

function resolveShellForBlock(theme: DesignSystemTheme, blockType: string): OfficialShell {
  const normalized = sanitizeToken(blockType);
  if (normalized === 'hero_trust') return theme.rules.shellUsage.hero;
  if (normalized === 'trust_band' || normalized === 'local_proof') return theme.rules.shellUsage.trust;
  if (normalized === 'faq') return theme.rules.shellUsage.faq;
  if (normalized === 'comparison_table' || normalized === 'price_guidance') return theme.rules.shellUsage.comparison;
  if (normalized === 'cta_panel' || normalized === 'urgency_panel') {
    return theme.rules.allowedShells.includes('band') ? 'band' : theme.rules.shellUsage.default;
  }
  return theme.rules.shellUsage.default;
}

function normalizeCtaHref(href?: string, phone?: string): string {
  const value = String(href || '').trim();
  if (value) {
    if (/^tel:/i.test(value)) {
      return toTelHref(value.replace(/^tel:/i, ''), '#contacto');
    }
    return value;
  }
  return toTelHref(phone);
}

function normalizeTable(table: unknown): { columns: string[]; rows: string[][] } {
  if (!table || typeof table !== 'object' || Array.isArray(table)) {
    return { columns: [], rows: [] };
  }

  const raw = table as { columns?: unknown; headers?: unknown; rows?: unknown };
  const columns = safeArray(raw.columns || raw.headers)
    .map((column) => String(column || '').trim())
    .filter(Boolean);
  const rows = safeArray(raw.rows)
    .map((row) => safeArray(row).map((cell) => String(cell || '').trim()))
    .filter((row) => row.some(Boolean));

  return { columns, rows };
}

export function getTableRows(table: unknown): string[][] {
  return normalizeTable(table).rows;
}

export function escapeHtml(value: unknown = ''): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function escapeAttribute(value: unknown = ''): string {
  return escapeHtml(String(value).replace(/\s+/g, ' ').trim());
}

export function safeArray<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : [];
}

export function sanitizeToken(value: string | undefined | null, fallback = 'default'): string {
  if (!value) return fallback;
  const cleaned = String(value).trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
  return cleaned || fallback;
}

export function normalizeUsablePhone(phone?: string | number | null): string {
  if (!phone) return '';
  const str = String(phone).trim();
  const lower = str.toLowerCase();
  if (lower === 'no disponible' || lower === 'nodisponible' || lower === 'unknown' || lower === 'undefined') {
    return '';
  }
  return str;
}

export function toTelHref(phone?: string, fallback = '#contacto'): string {
  const safePhone = normalizeUsablePhone(phone);
  if (!safePhone) return fallback;
  const digits = String(safePhone).replace(/[^\d+]/g, '');
  return digits ? `tel:${digits}` : fallback;
}

export function resolvePhone(context?: BlockContext, localPhone?: string): string {
  return normalizeUsablePhone(localPhone) || normalizeUsablePhone(context?.phone) || '';
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
  const href = normalizeCtaHref(cta?.href || local?.ctaHref, phone);
  const text = cta?.text || local?.labels?.primaryCta || 'Contactar ahora';
  
  const theme = resolveBlockTheme(input);
  const buttonStyle = theme.rules.buttonSystem;
  
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
      <a href="${escapeAttribute(href)}" class="${ctaClass}" data-cta="primary" aria-label="${escapeAttribute(`${text}${phone ? ` ${phone}` : ''}`)}">
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
  const { sectionId, blockType, variant } = input;
  const theme = resolveBlockTheme(input);
  
  // Resolve strategy weights from theme rules
  const shell = resolveShellForBlock(theme, blockType);
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
  const theme = resolveBlockTheme(input);
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
  body = 'Explicamos el criterio de trabajo, el alcance real y qué conviene revisar antes de tomar una decisión.'
): Array<{ title: string; body: string; meta?: string[] }> {
  return safeArray<string>(titles)
    .filter(Boolean)
    .map((title) => ({ title, body }));
}

export function renderTable(
  table: unknown,
  className = 'block-table'
): string {
  const normalized = normalizeTable(table);
  if (!normalized.columns.length || !normalized.rows.length) return '';

  const header = normalized.columns.map((column) => `<th scope="col">${escapeHtml(column)}</th>`).join('');
  const rows = normalized.rows
    .map(
      (row) =>
        `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`
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