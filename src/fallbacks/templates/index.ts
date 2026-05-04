import { Hero_RECIPES } from './hero.recipes.js';
import { ServicesGrid_RECIPES } from './servicesGrid.recipes.js';
import { ProcessSteps_RECIPES } from './processSteps.recipes.js';
import { PriceGuidance_RECIPES } from './priceGuidance.recipes.js';
import { Faq_RECIPES } from './faq.recipes.js';
import { TrustBand_RECIPES } from './trustBand.recipes.js';
import { LocalProof_RECIPES } from './localProof.recipes.js';
import { CtaPanel_RECIPES } from './ctaPanel.recipes.js';
import { UrgencyPanel_RECIPES } from './urgencyPanel.recipes.js';
import { ComparisonTable_RECIPES } from './comparisonTable.recipes.js';
import { Map_RECIPES } from './map.recipes.js';
import { Content_RECIPES } from './content.recipes.js';

export type { LayoutRecipe, RendererKey, TemplateDensity, TemplateShell, TemplateTone } from './types.js';

export const TEMPLATE_RECIPES = {
  hero: Hero_RECIPES,
  servicesGrid: ServicesGrid_RECIPES,
  processSteps: ProcessSteps_RECIPES,
  priceGuidance: PriceGuidance_RECIPES,
  faq: Faq_RECIPES,
  trustBand: TrustBand_RECIPES,
  localProof: LocalProof_RECIPES,
  ctaPanel: CtaPanel_RECIPES,
  urgencyPanel: UrgencyPanel_RECIPES,
  comparisonTable: ComparisonTable_RECIPES,
  map: Map_RECIPES,
  content: Content_RECIPES,
} as const;
