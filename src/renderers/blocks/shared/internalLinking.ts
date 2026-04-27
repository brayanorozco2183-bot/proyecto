import type { BlockRendererInput } from '../types.js';
import { escapeHtml, wrapSectionBlock } from '../shared.js';

type InternalLink = {
  text?: string;
  url?: string;
  relation?: string;
  description?: string;
  badge?: string;
};

function sanitizeInternalHref(href: string): string {
  let output = String(href || '').trim();
  if (!output) return './index.html';
  if (/^https?:\/\//i.test(output) || /^mailto:/i.test(output) || /^tel:/i.test(output) || output.startsWith('#')) {
    return output;
  }

  output = output.replace(/\\/g, '/').replace(/\s+/g, '');

  const isRelative = output.startsWith('./') || output.startsWith('../');
  const hasHtml = /\.html?(?:[#?]|$)/i.test(output);

  if (!hasHtml) {
    if (output.endsWith('/')) output += 'index.html';
    else output += '/index.html';
  }

  output = output.replace(/([^:])\/\/+/g, '$1/');

  if (!isRelative && !output.startsWith('/')) {
    output = `/${output}`;
  }

  return output || './index.html';
}

function relationLabel(relation: string): string {
  switch (relation) {
    case 'money': return 'Página principal';
    case 'supporting': return 'Página relacionada';
    case 'upward': return 'Resumen';
    default: return 'Navegación adicional';
  }
}

function relationCopy(relation: string): string {
  switch (relation) {
    case 'money':
      return 'Empieza por la página principal para ver la referencia general del servicio, la cobertura y la información esencial del proyecto.';
    case 'supporting':
      return 'Abre esta página para ampliar contexto con otra pieza ya generada del mismo proyecto.';
    case 'upward':
      return 'Vuelve al nivel principal del proyecto para mantener una navegación clara y coherente.';
    default:
      return 'Consulta esta página complementaria para seguir navegando entre contenidos relacionados del mismo proyecto con un hilo más natural.';
  }
}

function normalizeLinks(input: BlockRendererInput, links: InternalLink[]): InternalLink[] {
  const fromContent = Array.isArray((input.content as any)?.links) ? (input.content as any).links : [];
  const fromSeo = Array.isArray((input.seo as any)?.metadata?.internalLinks) ? (input.seo as any).metadata.internalLinks : [];
  const merged = [...links, ...fromContent, ...fromSeo]
    .map((item: any) => ({
      text: String(item?.text || item?.label || '').trim(),
      url: String(item?.url || item?.href || '').trim(),
      relation: String(item?.relation || 'related').trim(),
      description: String(item?.description || '').trim(),
      badge: String(item?.badge || '').trim(),
    }))
    .filter((item) => item.text && item.url);

  const seen = new Set<string>();
  return merged.filter((item) => {
    const key = `${item.url}|${item.text.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 3);
}

export function renderInternalLinkingBlock(input: BlockRendererInput, links: InternalLink[]): string {
  const normalized = normalizeLinks(input, links);
  if (!normalized.length) return '';

  const cards = normalized.map((link) => {
    const relation = String(link.relation || 'related').trim();
    const badge = link.badge || relationLabel(relation);
    const description = link.description || relationCopy(relation);

    return `
      <li class="internal-links-item internal-links-item--${escapeHtml(relation)}">
        <span class="internal-links-item__kicker">${escapeHtml(badge)}</span>
        <strong class="internal-links-item__title">${escapeHtml(link.text || '')}</strong>
        <p class="internal-links-item__description">${escapeHtml(description)}</p>
        <a href="${escapeHtml(sanitizeInternalHref(link.url || ''))}" class="internal-links-item__anchor">
          <span class="internal-links-item__cta">Abrir página <span aria-hidden="true">→</span></span>
        </a>
      </li>
    `;
  }).join('');

  const heading = (input.content as any)?.heading || (input.content as any)?.h2 || 'Páginas recomendadas dentro del proyecto';
  const eyebrow = (input.content as any)?.eyebrow || 'Navegación interna';
  const subtitle = (input.content as any)?.subheading || 'Mantén una navegación clara con la página principal del proyecto y, si existen, hasta dos páginas relacionadas ya generadas.';
  const gridModifier = normalized.length === 1 ? ' internal-links-grid--single' : '';

  const innerHtml = `
    <header class="block__header internal-links-hub__header">
      <span class="block__eyebrow">${escapeHtml(String(eyebrow))}</span>
      <h2 class="block__title">${escapeHtml(String(heading))}</h2>
      <p class="block__subtitle">${escapeHtml(String(subtitle))}</p>
    </header>
    <ul class="internal-links-grid${gridModifier}" role="list">
      ${cards}
    </ul>
  `;

  return wrapSectionBlock(input, innerHtml, 'block--internal-linking');
}
