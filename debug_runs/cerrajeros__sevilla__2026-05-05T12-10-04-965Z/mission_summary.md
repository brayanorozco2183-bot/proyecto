# Mission Summary

Status: **success_with_warnings**
Run ID: `cerrajeros__sevilla__2026-05-05T12-10-04-965Z`
Failed phase: **none**
Last stable phase: **post-audit**
Error type: **none**
Error: none

## Phase timings

| Phase | Status | Duration | Warnings |
|---|---:|---:|---:|
| playbook | success | 10ms | 0 |
| site-graph | success | 14ms | 0 |
| research | success | 49s | 0 |
| normalization | success | 14ms | 0 |
| planning | success | 2m 29s | 0 |
| render-plan | success | 28ms | 0 |
| writing | success | 7m 52s | 0 |
| correction | success | 4m 3s | 0 |
| integrity | success | 120ms | 0 |
| enrichment | success | 89ms | 0 |
| seo-contract | success | 34ms | 0 |
| assembly | success | 1s | 0 |
| images | success | 1m 21s | 0 |
| completeness | success | 92ms | 0 |
| technical-validation | degraded | 234ms | 4 |
| ux-validation | success | 8s | 5 |
| quality-gate | degraded | 404ms | 5 |
| editorial-validation | success | 411ms | 0 |
| delivery | success | 50ms | 0 |
| post-audit | success | 39ms | 0 |

## Slow LLM calls

| Agent | Model | Attempt | Duration | Status |
|---|---|---:|---:|---|
| Content_Architect_01 | qwen2.5-coder:3b | 1 | 2m 29s | slow |
| Content_Writer_01 | qwen2.5-coder:3b | 1 | 2m 27s | slow |
| Content_Writer_01 | qwen2.5-coder:3b | 1 | 2m 25s | slow |
| Content_Writer_01 | qwen2.5-coder:3b | 1 | 1m 35s | slow |
| Content_Writer_01 | qwen2.5-coder:3b | 1 | 1m 25s | slow |
| Content_Architect_01 | qwen2.5-coder:3b | 1 | 1m 21s | slow |
| Content_Writer_01 | qwen2.5-coder:3b | 1 | 1m 5s | slow |
| Niche_Coherence_Auditor | qwen2.5-coder:3b | 1 | 1m 3s | slow |
| Content_Writer_01 | qwen2.5-coder:3b | 1 | 1m 1s | slow |

## Fallbacks / degraded events

- PHASE_DEGRADED (technical-validation): UNDEFINED_CSS_VARS:--text,--muted,--primary,--primary-rgb,--accent,--font-body,--font-display,--shadow-lift,--shadow-soft,--shadow-dramatic,--bg,--text-on-surface; PRODUCTION_STABLE_CSS_MISSING; TEXT_BLOCK_WITHOUT_VISUAL_STRUCTURE; UNVERIFIED_COMMERCIAL_CLAIM
- PHASE_DEGRADED (quality-gate): No se ha inyectado la capa CSS estable de producción.; El bloque process_steps tiene contenido visible pero no se detecta estructura visual de tarjeta/layout.; El bloque cta_panel tiene contenido visible pero no se detecta estructura visual de tarjeta/layout.; El bloque trust_band tiene contenido visible pero no se detecta estructura visual de tarjeta/layout.; Claim "24h" debe estar respaldado por datos reales antes de publicar.

## Block diagnostics

| Block | Type | Score | Status | Issues |
|---|---|---:|---|---|
| urgency_panel | urgency_panel | 100 | success | none |
| services_grid | services_grid | 100 | success | none |
| process_steps | process_steps | 100 | success | none |
| local_proof | local_proof | 76 | warning | generic_heading_prueba_local, low_local_specificity |
| donde-estamos | map | 90 | success | low_word_count |
| price_guidance | price_guidance | 100 | success | none |
| faq | faq | 100 | success | none |
| internal-links-contextual | internal_linking | 100 | success | none |
| cta_panel | cta_panel | 90 | success | low_word_count |
| senales-confianza | trust_band | 100 | success | none |

## Recommended next action

No hay acción bloqueante. Revisar warnings y bloques con score bajo si el resultado visual no convence.
