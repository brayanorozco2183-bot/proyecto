import { escapeHtml, wrapSectionBlock } from '../shared.js';
import type { BlockRendererInput } from '../types.js';

interface InternalLink {
  url: string;
  text: string;
  relation: string;
}

export function renderInternalLinkingBlock(input: BlockRendererInput, links: InternalLink[]): string {
  if (!links || links.length === 0) return '';

  const { variant = 'grid' } = input;
  
  const linksHtml = links.map(link => `
    <div class="link-card" data-relation="${link.relation}">
      <a href="${link.url}" class="link-card__anchor">
        <span class="link-card__text">${escapeHtml(link.text)}</span>
        <span class="link-card__icon" aria-hidden="true">→</span>
      </a>
    </div>
  `).join('');

  const innerHtml = `
    <header class="block__header">
      <h2 class="block__title">${escapeHtml(input.content?.h2 || 'Enlaces de interés')}</h2>
      ${input.content?.eyebrow ? `<span class="block__eyebrow">${escapeHtml(input.content.eyebrow)}</span>` : ''}
    </header>
    <div class="link-container variant-${variant}">
      ${linksHtml}
    </div>
    <style>
      .link-container { display: grid; gap: 1.5rem; margin-top: 2rem; }
      .link-container.variant-grid { grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); }
      .link-container.variant-list { grid-template-columns: 1fr; }
      
      .link-card { 
        background: var(--surface); 
        border: 1px solid var(--border); 
        border-radius: 1rem; 
        transition: all 0.2s ease;
      }
      .link-card:hover { 
        border-color: var(--primary); 
        transform: translateY(-2px); 
        box-shadow: var(--shadow-soft); 
      }
      
      .link-card__anchor { 
        display: flex; 
        align-items: center; 
        justify-content: space-between; 
        padding: 1.5rem; 
        text-decoration: none; 
        color: var(--text); 
        font-weight: 600; 
      }
      .link-card__icon { color: var(--primary); font-size: 1.2rem; }
      
      [data-relation="upward"] { border-left: 4px solid var(--accent); }
      [data-relation="bofu"] { background: var(--surface-alt); border-style: dashed; }
    </style>
  `;

  return wrapSectionBlock(input, innerHtml, 'block--internal-linking');
}