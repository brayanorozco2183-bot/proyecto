# Mission Summary

Status: **success_with_warnings**
Run ID: `cerrajeros__barcelona__2026-05-05T11-54-45-543Z`
Failed phase: **none**
Last stable phase: **post-audit**
Error type: **none**
Error: none

## Phase timings

| Phase | Status | Duration | Warnings |
|---|---:|---:|---:|
| playbook | success | 12ms | 0 |
| site-graph | success | 11ms | 0 |
| research | success | 28s | 0 |
| normalization | success | 17ms | 0 |
| planning | success | 1m 21s | 0 |
| render-plan | success | 35ms | 0 |
| writing | success | 4m 1s | 0 |
| correction | success | 1m 33s | 0 |
| integrity | success | 133ms | 0 |
| enrichment | success | 115ms | 0 |
| seo-contract | success | 41ms | 0 |
| assembly | success | 1s | 0 |
| images | success | 1m 11s | 0 |
| completeness | success | 92ms | 0 |
| technical-validation | degraded | 239ms | 4 |
| ux-validation | success | 9s | 5 |
| quality-gate | degraded | 381ms | 6 |
| editorial-validation | success | 330ms | 0 |
| delivery | success | 49ms | 0 |
| post-audit | success | 40ms | 0 |

## Slow LLM calls

| Agent | Model | Attempt | Duration | Status |
|---|---|---:|---:|---|
| Content_Architect_01 | qwen2.5-coder:3b | 1 | 1m 21s | slow |
| Content_Writer_01 | qwen2.5-coder:3b | 1 | 1m 5s | slow |
| Content_Writer_01 | qwen2.5-coder:3b | 1 | 1m 1s | slow |

## Fallbacks / degraded events

- PHASE_DEGRADED (technical-validation): UNDEFINED_CSS_VARS:--text,--muted,--primary,--primary-rgb,--accent,--font-body,--font-display,--shadow-lift,--shadow-soft,--shadow-dramatic,--bg,--text-on-surface; PRODUCTION_STABLE_CSS_MISSING; TEXT_BLOCK_WITHOUT_VISUAL_STRUCTURE; UNVERIFIED_COMMERCIAL_CLAIM
- PHASE_DEGRADED (quality-gate): Incumplimiento de Playbook (cerrajeros): Schema recomendado ausente para el nicho: FAQPage; No se ha inyectado la capa CSS estable de producción.; El bloque process_steps tiene contenido visible pero no se detecta estructura visual de tarjeta/layout.; El bloque cta_panel tiene contenido visible pero no se detecta estructura visual de tarjeta/layout.; El bloque trust_band tiene contenido visible pero no se detecta estructura visual de tarjeta/layout.; Claim "24h" debe estar respaldado por datos reales antes de publicar.

## Block diagnostics

| Block | Type | Score | Status | Issues |
|---|---|---:|---|---|
| urgency-panel | urgency_panel | 100 | success | none |
| services-grid | services_grid | 88 | success | unverified_experience_claim |
| process-steps | process_steps | 100 | success | none |
| local-proof | local_proof | 76 | warning | generic_heading_prueba_local, low_local_specificity |
| donde-estamos | map | 90 | success | low_word_count |
| price-guidance | price_guidance | 100 | success | none |
| faq | faq | 100 | success | none |
| internal-links-contextual | internal_linking | 100 | success | none |
| cta-panel | cta_panel | 90 | success | low_word_count |
| senales-confianza | trust_band | 100 | success | none |

## Recommended next action

No hay acción bloqueante. Revisar warnings y bloques con score bajo si el resultado visual no convence.
