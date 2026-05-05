# Mission Summary

Status: **success_with_warnings**
Run ID: `cerrajeros__bilbao__2026-05-05T12-31-24-091Z`
Failed phase: **none**
Last stable phase: **post-audit**
Error type: **none**
Error: none

## Phase timings

| Phase | Status | Duration | Warnings |
|---|---:|---:|---:|
| playbook | success | 27ms | 0 |
| site-graph | success | 12ms | 0 |
| research | success | 28s | 0 |
| normalization | success | 25ms | 0 |
| planning | success | 1m 28s | 0 |
| render-plan | success | 39ms | 0 |
| writing | success | 4m 26s | 0 |
| correction | success | 1m 41s | 0 |
| integrity | success | 135ms | 0 |
| enrichment | success | 118ms | 0 |
| seo-contract | success | 48ms | 0 |
| assembly | success | 2s | 0 |
| images | success | 46s | 0 |
| completeness | success | 72ms | 0 |
| technical-validation | degraded | 201ms | 4 |
| ux-validation | success | 5s | 0 |
| quality-gate | degraded | 461ms | 10 |
| editorial-validation | success | 387ms | 0 |
| delivery | success | 56ms | 0 |
| post-audit | success | 52ms | 0 |

## Slow LLM calls

| Agent | Model | Attempt | Duration | Status |
|---|---|---:|---:|---|
| Content_Architect_01 | qwen2.5-coder:3b | 1 | 1m 28s | slow |
| Content_Writer_01 | qwen2.5-coder:3b | 1 | 1m 16s | slow |
| Content_Writer_01 | qwen2.5-coder:3b | 1 | 1m 15s | slow |
| Content_Writer_01 | qwen2.5-coder:3b | 1 | 1m 1s | slow |

## Fallbacks / degraded events

- PHASE_DEGRADED (technical-validation): PRODUCTION_STABLE_CSS_MISSING; BLOCK_VISUAL_CLASSES_WITHOUT_CSS; TEXT_BLOCK_WITHOUT_VISUAL_STRUCTURE; UNVERIFIED_COMMERCIAL_CLAIM
- PHASE_DEGRADED (quality-gate): Los títulos internos repiten una plantilla demasiado genérica. Apariciones: 1.; No se ha inyectado la capa CSS estable de producción.; Hay clases de bloques renderizadas sin cobertura CSS directa: block__pill, local-proof__signal-list, faq-content-refined, footer__grid-refined; El bloque premium_content_depth tiene contenido visible pero no se detecta estructura visual de tarjeta/layout.; El bloque process_steps tiene contenido visible pero no se detecta estructura visual de tarjeta/layout.; El bloque premium_content_depth tiene contenido visible pero no se detecta estructura visual de tarjeta/layout.; El bloque premium_content_depth tiene contenido visible pero no se detecta estructura visual de tarjeta/layout.; El bloque cta_panel tiene contenido visible pero no se detecta estructura visual de tarjeta/layout.; El bloque trust_band tiene contenido visible pero no se detecta estructura visual de tarjeta/layout.; Claim "24h" debe estar respaldado por datos reales antes de publicar.

## Block diagnostics

| Block | Type | Score | Status | Issues |
|---|---|---:|---|---|
| urgency-panel | urgency_panel | 100 | success | none |
| services-grid | services_grid | 100 | success | none |
| process-steps | process_steps | 88 | success | generic_heading_prueba_local |
| local-proof | local_proof | 76 | warning | generic_heading_prueba_local, low_local_specificity |
| donde-estamos | map | 90 | success | low_word_count |
| price-guidance | price_guidance | 100 | success | none |
| faq | faq | 100 | success | none |
| internal-links-contextual | internal_linking | 100 | success | none |
| cta-panel | cta_panel | 90 | success | low_word_count |
| senales-confianza | trust_band | 100 | success | none |

## Recommended next action

No hay acción bloqueante. Revisar warnings y bloques con score bajo si el resultado visual no convence.
