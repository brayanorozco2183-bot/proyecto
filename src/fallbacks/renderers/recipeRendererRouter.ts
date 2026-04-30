import type { LayoutRecipe } from '../templates/types.js';

export interface RecipeRenderPayload {
  h2: string;
  kicker: string;
  lead: string;
  cards: Array<{ title: string; text: string }>;
  list: string[];
  faqs: Array<{ q: string; a: string }>;
  ctaHtml: string;
  city: string;
  nicheLabel: string;
}

type Renderer = (recipe: LayoutRecipe, payload: RecipeRenderPayload) => string;

function esc(value: unknown): string {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function cards(items: RecipeRenderPayload['cards']): string {
  return `<div class="pfb__cards">${items.map((x) => `<article class="pfb__card"><h3>${esc(x.title)}</h3><p>${esc(x.text)}</p></article>`).join('')}</div>`;
}

const renderers: Record<string, Renderer> = {
  hero: (r, p) => `<div class="pfb__main"><p class="pfb__lead">${esc(p.lead)}</p>${cards(p.cards.slice(0, 3))}</div><aside class="pfb__aside">${p.ctaHtml}</aside>`,
  cards: (_r, p) => `<p class="pfb__lead">${esc(p.lead)}</p>${cards(p.cards)}`,
  steps: (_r, p) => `<p class="pfb__lead">${esc(p.lead)}</p>${cards(p.cards.map((x, i) => ({ ...x, title: `${i + 1}. ${x.title}` })))}`,
  faq: (_r, p) => `<div class="pfb__faq">${p.faqs.map((f) => `<details class="pfb__faq-item"><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}</div>`,
  split: (_r, p) => `<div class="pfb__main"><p class="pfb__lead">${esc(p.lead)}</p>${cards(p.cards.slice(0, 2))}</div><aside class="pfb__aside"><ul>${p.list.slice(0, 5).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>${p.ctaHtml}</aside>`,
  band: (_r, p) => `<p class="pfb__lead">${esc(p.lead)}</p><div class="pfb__band">${p.list.slice(0, 4).map((x) => `<strong>${esc(x)}</strong>`).join('')}</div>`,
  cta: (_r, p) => `<p class="pfb__lead">${esc(p.lead)}</p>${p.ctaHtml}`,
  table: (_r, p) => `<p class="pfb__lead">${esc(p.lead)}</p><div class="pfb__table">${p.cards.slice(0, 5).map((x) => `<div><strong>${esc(x.title)}</strong><span>${esc(x.text)}</span></div>`).join('')}</div>`,
  map: (_r, p) => `<p class="pfb__lead">${esc(p.lead)}</p>${cards(p.cards.slice(0, 4))}`,
  editorial: (_r, p) => `<p class="pfb__lead">${esc(p.lead)}</p><p>${esc(p.list.slice(0, 3).join(' · '))}</p>${cards(p.cards.slice(0, 3))}`,
  checklist: (_r, p) => `<p class="pfb__lead">${esc(p.lead)}</p><ul class="pfb__list">${p.list.slice(0, 7).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`,
  matrix: (_r, p) => `<p class="pfb__lead">${esc(p.lead)}</p>${cards(p.cards.slice(0, 6))}`,
};

export function renderRecipeBody(recipe: LayoutRecipe, payload: RecipeRenderPayload): string {
  const renderer = renderers[recipe.rendererKey] || renderers.editorial;
  return renderer(recipe, payload);
}
