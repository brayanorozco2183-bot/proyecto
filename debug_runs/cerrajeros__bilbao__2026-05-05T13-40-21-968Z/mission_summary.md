# Mission Summary

Status: **success_with_warnings**
Run ID: `cerrajeros__bilbao__2026-05-05T13-40-21-968Z`
Failed phase: **none**
Last stable phase: **post-audit**
Error type: **none**
Error: none

## Phase timings

| Phase | Status | Duration | Warnings |
|---|---:|---:|---:|
| playbook | success | 8ms | 0 |
| site-graph | success | 9ms | 0 |
| research | success | 35s | 0 |
| normalization | success | 43ms | 0 |
| planning | success | 2m 41s | 0 |
| render-plan | success | 19ms | 0 |
| writing | success | 7m 21s | 0 |
| correction | success | 4m 12s | 0 |
| integrity | success | 139ms | 0 |
| enrichment | success | 85ms | 0 |
| seo-contract | success | 28ms | 0 |
| assembly | success | 1s | 0 |
| images | success | 36s | 0 |
| completeness | success | 87ms | 0 |
| technical-validation | degraded | 210ms | 4 |
| ux-validation | success | 12s | 0 |
| quality-gate | degraded | 454ms | 7 |
| editorial-validation | success | 449ms | 0 |
| delivery | success | 55ms | 0 |
| post-audit | success | 38ms | 0 |

## Slow LLM calls

| Agent | Model | Attempt | Duration | Status |
|---|---|---:|---:|---|
| Content_Architect_01 | qwen2.5-coder:3b | 1 | 2m 41s | slow |
| Content_Writer_01 | qwen2.5-coder:3b | 1 | 2m 6s | slow |
| Content_Writer_01 | qwen2.5-coder:3b | 1 | 1m 51s | slow |
| Content_Writer_01 | qwen2.5-coder:3b | 1 | 1m 44s | slow |
| Content_Writer_01 | qwen2.5-coder:3b | 1 | 1m 40s | slow |
| Content_Architect_01 | qwen2.5-coder:3b | 1 | 1m 28s | slow |
| Content_Writer_01 | qwen2.5-coder:3b | 1 | 1m 16s | slow |
| Content_Writer_01 | qwen2.5-coder:3b | 1 | 1m 15s | slow |
| Content_Writer_01 | qwen2.5-coder:3b | 1 | 1m 1s | slow |
| Niche_Coherence_Auditor | qwen2.5-coder:3b | 1 | 1m 1s | slow |

## Fallbacks / degraded events

- PHASE_DEGRADED (technical-validation): PRODUCTION_STABLE_CSS_MISSING; BLOCK_VISUAL_CLASSES_WITHOUT_CSS; TEXT_BLOCK_WITHOUT_VISUAL_STRUCTURE; UNVERIFIED_COMMERCIAL_CLAIM
- PHASE_DEGRADED (quality-gate): No se ha inyectado la capa CSS estable de producción.; Hay clases de bloques renderizadas sin cobertura CSS directa: block__pill, local-proof__signal-list, faq-content-refined, footer__grid-refined; El bloque premium_content_depth tiene contenido visible pero no se detecta estructura visual de tarjeta/layout.; El bloque process_steps tiene contenido visible pero no se detecta estructura visual de tarjeta/layout.; El bloque premium_content_depth tiene contenido visible pero no se detecta estructura visual de tarjeta/layout.; El bloque trust_band tiene contenido visible pero no se detecta estructura visual de tarjeta/layout.; Claim "24h" debe estar respaldado por datos reales antes de publicar.

## Block diagnostics

| Block | Type | Score | Status | Issues |
|---|---|---:|---|---|
| urgency_panel | urgency_panel | 100 | success | none |
| services_grid | services_grid | 78 | warning | unverified_experience_claim, low_decision_depth |
| process_steps | process_steps | 100 | success | none |
| local_proof | local_proof | 88 | success | low_local_specificity |
| donde-estamos | map | 90 | success | low_word_count |
| price_guidance | price_guidance | 100 | success | none |
| faq | faq | 100 | success | none |
| internal-links-contextual | internal_linking | 100 | success | none |
| cta_panel | cta_panel | 90 | success | low_word_count |
| senales-confianza | trust_band | 100 | success | none |

## Recommended next action

No hay acción bloqueante. Revisar warnings y bloques con score bajo si el resultado visual no convence.
