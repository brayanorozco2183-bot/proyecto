import type { FallbackBlockType } from '../types.js';

export type TemplateShell =
  | 'editorial'
  | 'cards'
  | 'split'
  | 'timeline'
  | 'compact'
  | 'contrast'
  | 'magazine'
  | 'masonry'
  | 'rail'
  | 'matrix'
  | 'accordion'
  | 'spotlight';

export type TemplateDensity = 'compact' | 'balanced' | 'deep' | 'dense';
export type TemplateTone = 'premium' | 'practical' | 'urgent' | 'local' | 'technical' | 'trust';

export type RendererKey =
  | 'hero'
  | 'cards'
  | 'steps'
  | 'faq'
  | 'split'
  | 'band'
  | 'cta'
  | 'table'
  | 'map'
  | 'editorial'
  | 'checklist'
  | 'matrix';

export interface LayoutRecipe {
  id: string;
  blockType: FallbackBlockType;
  shell: TemplateShell;
  rendererKey: RendererKey;
  density: TemplateDensity;
  tone: TemplateTone;
  family: string;
  className: string;
  slots: string[];
  contentStrategy: string;
}
