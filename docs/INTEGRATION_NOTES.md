# Integration notes

## Qué corrige respecto al estado actual

1. `seoBrief` deja de ser casi el resultado final y pasa a ser solo la intención estratégica.
2. `renderedSeo` concentra el output técnico cerrado de la página.
3. `SchemaFactory` deja de depender del `TechnicalLeadAgent` como único generador de schema.
4. El validator técnico deja de revisar solo title/meta/canonical/H1/H2 y pasa a bloquear incoherencias reales de publicación.
5. El deploy puede recibir `schemaJsonLd` real en vez de `{}`.
6. El sistema puede generar `sitemap.xml` y `robots.txt` por cluster.

## Sustituciones mínimas sugeridas

- Añadir `src/seo/*`
- Sustituir `src/utils/technicalPageValidator.ts`
- En `runEnrichmentPhase()` usar `buildSeoForPipeline()`
- En `renderPage(...)` pasar `renderedSeo.breadcrumbs`
- En deploy enviar `renderedSeo.schemaJsonLd`

## Criterio de bloqueo

No publiques si `validateRenderedPageTechnically(...)` devuelve issues.
