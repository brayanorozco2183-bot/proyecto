# src/renderers/blocks

Librería de bloques visuales controlados para sustituir la generación libre de HTML.

## Qué resuelve

Tu `architect.ts` ya decide:

- `block_type`
- `preferred_format`
- `layout_hint`
- `visual_variant`

Esta carpeta hace que ese contrato termine en renderers estables y reutilizables.

## Mapa de carpetas

- `hero` -> `hero_trust`
- `servicesGrid` -> `services_grid`
- `localProof` -> `local_proof`
- `trustBand` -> `trust_band`
- `processSteps` -> `process_steps`
- `priceGuidance` -> `price_guidance`
- `faq` -> `faq`
- `ctaPanel` -> `cta_panel`
- `comparisonTable` -> `comparison_table`
- `map` -> `map`

## Contrato por bloque

Cada bloque tiene siempre:

- `schema.ts`: shape de entrada con `zod`
- `guards.ts`: type guards + normalización contra `BLOCK_VISUAL_SPECS`
- `variants.ts`: implementaciones visuales premium controladas
- `render.ts`: selector de variante y punto único de render
- `index.ts`: descriptor exportable del bloque

## Integración mínima

```ts
import { renderHeroBlock, renderSectionBlock } from './renderers/blocks/index.js';

const heroHtml = renderHeroBlock({
  hero: {
    ...plan.hero,
    visual_variant: plan.hero?.visual_variant || resolvedPlan.hero.template
  },
  contract: resolvedPlan.hero,
  context: {
    city: research.city,
    niche: research.niche,
    phone: research.local_nap.phone
  }
});

const sectionsHtml = sectionResults.map((result, index) =>
  renderSectionBlock({
    section: {
      ...plan.sections[index],
      visual_variant: result.visual_variant
    },
    semantic: result.semantic,
    contract: resolvedPlan.sections[index],
    context: {
      city: research.city,
      niche: research.niche,
      phone: research.local_nap.phone,
      mapEmbedUrl: result.mapEmbedUrl
    }
  })
);
```

## Orden recomendado para conectarlo en tu pipeline

1. Mantener `architect.ts` como fuente de verdad de `block_type`.
2. Resolver el plan visual con `RenderPlanResolver`.
3. Generar `semantic` por sección con `ContentWriterAgent`.
4. Sustituir el render libre por `renderSectionBlock`.
5. Dejar `sectionSemanticRenderer.ts` como fallback legacy hasta terminar la migración.

## Nota

Las importaciones usan rutas de tu proyecto actual (`src/config`, `src/types`, `src/agents`), así que esta carpeta está pensada para copiarse dentro de tu repo.
