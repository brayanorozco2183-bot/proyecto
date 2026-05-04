# Niche playbooks

Esta carpeta convierte el proyecto en multi-nicho con una base de conocimiento estructurada, reutilizable y verificable.

## Qué añade
- 3 playbooks piloto completos:
  - `cerrajeros.json`
  - `fontaneros.json`
  - `electricistas.json`
- Loader tipado y resolución por alias.
- Inyecciones preparadas para `SEOAnalystAgent`, `ContentArchitectAgent`, `ContentWriterAgent` y `TechnicalLeadAgent`.
- Capa semiestructurada para `services_grid`, `process_steps`, `faq` y `price_guidance`.
- Validación técnica contra vocabulario cruzado y claims prohibidos.

## Objetivo de integración
1. Resolver el playbook al principio de la misión.
2. Pasar el contexto del playbook al analista, arquitecto y writer.
3. Validar HTML + schema con `validateContentAgainstNichePlaybook(...)`.
4. Hidratar bloques semiestructurados desde `hydrateSemanticDraftFromPlaybook(...)`.

## Idea clave
Tu proyecto ya usa guardarraíles persistentes y packs verticales, pero siguen siendo demasiado abiertos. Esta capa cierra:
- vocabulario permitido,
- riesgos legales,
- señales de confianza,
- FAQs reales,
- servicios y variantes BOFU,
- semántica por bloque.
