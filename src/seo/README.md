# SEO técnico reutilizable

Este paquete está pensado para encajar con tu pipeline actual:

- `SEOAnalystAgent` ya decide `schemaTypes`, `titleStrategy`, `metaDescriptionStrategy` e `internalLinkTargets`.
- `ContentArchitectAgent` ya genera `seoBrief` dentro del `PagePlan`.
- `runEnrichmentPhase()` hoy calcula canonical simple, mete schema desde `TechnicalLeadAgent` y deja breadcrumbs vacíos.
- `validateRenderedPageTechnically()` hoy solo cubre una parte del contrato técnico.

## Qué introduce

### 1. Separación real entre `seoBrief` y `renderedSeo`

- `seoBrief`: intención editorial/estratégica.
- `renderedSeo`: slug, canonical, title, meta description, robots, breadcrumbs, OG, twitter, schemas e indexation policy ya resueltos.

Usa:

```ts
import { buildSeoForPipeline } from '../seo/index.js';

const { seoBrief, renderedSeo } = buildSeoForPipeline(pagePlan, mission, faqs);
pagePlan.seoBrief = seoBrief;
draft.metadata = {
  ...(draft.metadata || {}),
  seo: renderedSeo,
};
```

### 2. Canonical/slug engine determinista

Reglas aplicadas:

- service -> `/{servicio}/{ciudad}/`
- urgent -> `/urgencias/{servicio}/{ciudad}/`
- service_area -> `/{servicio}/{zona}/{ciudad}/`
- guide -> `/guia/{tema}/{ciudad}/`

### 3. SchemaFactory serio

Usa:

```ts
import { SchemaFactory } from '../seo/index.js';

const schema = SchemaFactory.build(pagePlan, mission, faqs, {
  canonical: renderedSeo.canonical,
  breadcrumbs: renderedSeo.breadcrumbs,
});
```

Soporta:

- LocalBusiness
- Service
- FAQPage
- BreadcrumbList
- WebPage
- Organization
- Article

### 4. Validator técnico ampliado

Reemplaza tu `src/utils/technicalPageValidator.ts` actual por el incluido aquí.

Checks nuevos:

- un solo canonical
- canonical exacto contra slug real esperado
- slug coherente con la intención
- schema obligatorio por tipo de página
- breadcrumb presente
- FAQ schema solo si hay FAQ real
- coherencia de telefonía y NAP
- title/meta con patrones repetitivos bloqueantes

### 5. Sitemap y robots por cluster

Usa:

```ts
import { buildClusterSeoArtifacts } from '../seo/index.js';

const artifacts = buildClusterSeoArtifacts(pages, mission.siteConfig.baseUrl);
```

Genera:

- `sitemap.xml`
- `sitemap-{cluster}.xml`
- `robots.txt`
- `robots-{cluster}.txt`

## Puntos de integración mínimos en tu pipeline

### Enrichment phase

Sustituye la construcción manual actual de canonical/meta/schema por `buildSeoForPipeline()`.

### Assembly phase

Pasa `renderedSeo.breadcrumbs` a `renderPage(...)` en vez de `[]`.

Además, asegúrate de inyectar `renderedSeo.schemaJsonLd` en el `<head>` si el renderer no lo hace aún.

### Technical validation

Pasa al validator:

- `pagePlan`
- `mission`
- `renderedSeo`
- `requiredSchemas: renderedSeo.schemaTypes`
- `expectedBusinessName`
- `expectedAddress`

### Delivery

No envíes más `schema: {}` a deploy. Envía `renderedSeo.schemaJsonLd`.

## Criterio de bloqueo

No publiques si aparece cualquiera de estos casos:

- falta schema obligatorio
- canonical distinto del slug real
- FAQ schema sin FAQ real
- title/meta en patrón repetitivo
