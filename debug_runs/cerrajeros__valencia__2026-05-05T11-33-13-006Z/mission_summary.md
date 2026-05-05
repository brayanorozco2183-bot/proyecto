# Mission Summary

Status: **success_with_warnings**
Run ID: `cerrajeros__valencia__2026-05-05T11-33-13-006Z`
Failed phase: **none**
Last stable phase: **post-audit**
Error type: **none**
Error: none

## Phase timings

| Phase | Status | Duration | Warnings |
|---|---:|---:|---:|
| playbook | success | 9ms | 0 |
| site-graph | success | 11ms | 0 |
| research | success | 26s | 0 |
| normalization | success | 20ms | 0 |
| planning | success | 2m 36s | 0 |
| render-plan | success | 22ms | 0 |
| writing | success | 6m 50s | 0 |
| correction | success | 3m 55s | 0 |
| integrity | success | 111ms | 0 |
| enrichment | success | 94ms | 0 |
| seo-contract | success | 29ms | 0 |
| assembly | success | 1s | 0 |
| images | success | 1m 56s | 0 |
| completeness | success | 91ms | 0 |
| technical-validation | degraded | 205ms | 5 |
| ux-validation | success | 5s | 5 |
| quality-gate | degraded | 430ms | 7 |
| editorial-validation | success | 351ms | 0 |
| delivery | success | 72ms | 0 |
| post-audit | success | 50ms | 0 |

## Slow LLM calls

| Agent | Model | Attempt | Duration | Status |
|---|---|---:|---:|---|
| Content_Writer_01 | qwen2.5-coder:3b | 1 | 2m 57s | slow |
| Content_Architect_01 | qwen2.5-coder:3b | 1 | 2m 36s | slow |
| Content_Architect_01 | qwen2.5-coder:3b | 1 | 2m 35s | slow |
| Content_Writer_01 | qwen2.5-coder:3b | 1 | 2m 11s | slow |
| Niche_Coherence_Auditor | qwen2.5-coder:3b | 1 | 1m 46s | slow |
| Content_Writer_01 | qwen2.5-coder:3b | 1 | 1m 36s | slow |
| Content_Writer_01 | qwen2.5-coder:3b | 1 | 1m 34s | slow |
| Content_Writer_01 | qwen2.5-coder:3b | 1 | 1m 34s | slow |
| Content_Writer_01 | qwen2.5-coder:3b | 1 | 1m 33s | slow |
| Content_Writer_01 | qwen2.5-coder:3b | 1 | 1m 32s | slow |
| Content_Architect_01 | qwen2.5-coder:3b | 1 | 1m 23s | slow |
| Content_Writer_01 | qwen2.5-coder:3b | 1 | 1m 23s | slow |
| Content_Writer_01 | qwen2.5-coder:3b | 1 | 1m 10s | slow |

## Fallbacks / degraded events

- PHASE_DEGRADED (technical-validation): UNEXPECTED_INTERNAL_LINK_TARGETS:/jesus; PRODUCTION_STABLE_CSS_MISSING; BLOCK_VISUAL_CLASSES_WITHOUT_CSS; TEXT_BLOCK_WITHOUT_VISUAL_STRUCTURE; UNVERIFIED_COMMERCIAL_CLAIM
- PHASE_DEGRADED (quality-gate): Los títulos internos repiten una plantilla demasiado genérica. Apariciones: 1.; No se ha inyectado la capa CSS estable de producción.; Hay clases de bloques renderizadas sin cobertura CSS directa: block__cta-note, footer__grid-refined; El bloque process_steps tiene contenido visible pero no se detecta estructura visual de tarjeta/layout.; El bloque cta_panel tiene contenido visible pero no se detecta estructura visual de tarjeta/layout.; El bloque trust_band tiene contenido visible pero no se detecta estructura visual de tarjeta/layout.; Claim "24h" debe estar respaldado por datos reales antes de publicar.

## Block diagnostics

| Block | Type | Score | Status | Issues |
|---|---|---:|---|---|
| urgency_panel | urgency_panel | 100 | success | none |
| services_grid | services_grid | 100 | success | none |
| process_steps | process_steps | 88 | success | unverified_experience_claim |
| local_proof | local_proof | 76 | warning | generic_heading_prueba_local, low_local_specificity |
| donde-estamos | map | 90 | success | low_word_count |
| price_guidance | price_guidance | 88 | success | unverified_experience_claim |
| faq | faq | 100 | success | none |
| internal-links-contextual | internal_linking | 100 | success | none |
| cta_panel | cta_panel | 90 | success | low_word_count |
| senales-confianza | trust_band | 100 | success | none |

## Recommended next action

No hay acción bloqueante. Revisar warnings y bloques con score bajo si el resultado visual no convence.
