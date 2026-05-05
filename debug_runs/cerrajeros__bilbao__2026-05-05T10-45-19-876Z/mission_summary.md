# Mission Summary

Status: **success**
Run ID: `cerrajeros__bilbao__2026-05-05T10-45-19-876Z`
Failed phase: **none**
Last stable phase: **post-audit**
Error type: **none**
Error: none

## Phase timings

| Phase | Status | Duration | Warnings |
|---|---:|---:|---:|
| playbook | success | 10ms | 0 |
| site-graph | success | 10ms | 0 |
| research | success | 25s | 0 |
| normalization | success | 17ms | 0 |
| planning | success | 2m 35s | 0 |
| render-plan | success | 35ms | 0 |
| writing | success | 7m 31s | 0 |
| correction | success | 4m 58s | 0 |
| integrity | success | 182ms | 0 |
| enrichment | success | 116ms | 0 |
| seo-contract | success | 36ms | 0 |
| assembly | success | 2s | 0 |
| images | success | 1m 21s | 0 |
| completeness | success | 81ms | 0 |
| technical-validation | degraded | 241ms | 4 |
| ux-validation | success | 8s | 5 |
| quality-gate | degraded | 530ms | 6 |
| editorial-validation | success | 403ms | 0 |
| delivery | success | 71ms | 0 |
| post-audit | success | 44ms | 0 |

## Slow LLM calls

| Agent | Model | Attempt | Duration | Status |
|---|---|---:|---:|---|
| Content_Writer_01 | qwen2.5-coder:3b | 1 | 2m 57s | slow |
| Content_Architect_01 | qwen2.5-coder:3b | 1 | 2m 35s | slow |
| Niche_Coherence_Auditor | qwen2.5-coder:3b | 1 | 1m 46s | slow |
| Content_Writer_01 | qwen2.5-coder:3b | 1 | 1m 36s | slow |
| Content_Writer_01 | qwen2.5-coder:3b | 1 | 1m 34s | slow |
| Content_Writer_01 | qwen2.5-coder:3b | 1 | 1m 23s | slow |

## Fallbacks / degraded events

- PHASE_DEGRADED (technical-validation): PRODUCTION_STABLE_CSS_MISSING; BLOCK_VISUAL_CLASSES_WITHOUT_CSS; TEXT_BLOCK_WITHOUT_VISUAL_STRUCTURE; UNVERIFIED_COMMERCIAL_CLAIM
- PHASE_DEGRADED (quality-gate): No se ha inyectado la capa CSS estable de producción.; Hay clases de bloques renderizadas sin cobertura CSS directa: block__cta-note, footer__grid-refined; El bloque process_steps tiene contenido visible pero no se detecta estructura visual de tarjeta/layout.; El bloque cta_panel tiene contenido visible pero no se detecta estructura visual de tarjeta/layout.; El bloque trust_band tiene contenido visible pero no se detecta estructura visual de tarjeta/layout.; Claim "24h" debe estar respaldado por datos reales antes de publicar.

## Block diagnostics

| Block | Type | Score | Status | Issues |
|---|---|---:|---|---|
| urgency_panel | urgency_panel | 100 | success | none |
| services_grid | services_grid | 88 | success | unverified_experience_claim |
| process_steps | process_steps | 88 | success | unverified_experience_claim |
| local_proof | local_proof | 88 | success | low_local_specificity |
| donde-estamos | map | 90 | success | low_word_count |
| price_guidance | price_guidance | 100 | success | none |
| faq | faq | 100 | success | none |
| internal-links-contextual | internal_linking | 100 | success | none |
| cta_panel | cta_panel | 90 | success | low_word_count |
| senales-confianza | trust_band | 100 | success | none |

## Recommended next action

No hay acción bloqueante. Revisar warnings y bloques con score bajo si el resultado visual no convence.
