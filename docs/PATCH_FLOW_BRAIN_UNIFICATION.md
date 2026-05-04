# Patch: Flow Brain Unification & Safety Hardening

Este parche corrige cuatro puntos de fricción detectados tras los parches previos.

## 1. Legal sanitizer sincronizado con Niche Intelligence

`src/utils/legalClaimSanitizer.ts` ahora usa `NicheIntelligenceProfile` como fuente principal de claims prohibidos y alternativas seguras. Mantiene los playbooks antiguos solo como fallback de compatibilidad.

Nuevas capacidades:

- `sanitizeLegalRiskClaims(html, { niche, city, intent, profile })`
- `sanitizeLegalRiskClaimsWithProfile(html, profile)`
- `source` en el reporte: `niche-intelligence`, `playbook-fallback`, `base-only` o `mixed`

Esto cierra el riesgo de que salud, legal o finanzas permitan claims que la capa nueva ya sabe bloquear.

## 2. Perfil de nicho compartido por página

`src/design-system/blockPayloadAdapter.ts` ya no reconstruye el perfil de inteligencia por cada bloque de forma aislada.

Ahora prioriza:

1. `nicheProfile` explícito
2. `data.nicheProfile`
3. `data.missionContext.nicheProfile`
4. `data.runtimeContext.nicheProfile`
5. cache compartida por clave de página

Así todos los bloques de una misma página usan la misma vertical, vocabulario, CTAs y trust assets.

## 3. MissionController con escritura atómica y recuperación

`src/orchestrator/missionController.ts` escribe estado y puntero mediante archivo temporal + rename atómico.

Además, si el puntero queda corrupto o falta por un corte justo durante la ejecución, `loadLastState()` busca el último `state_XX_phase.json` válido y reanuda desde ahí.

Esto reduce el riesgo de repetir una fase completa y gastar tokens por una interrupción entre escritura de estado y puntero.

## 4. QualityScoreAgent con evidencia DOM graduada

`src/agents/quality_score.ts` ya no presenta la autopsia DOM como verdad absoluta en todos los casos.

Ahora calcula:

- `confidence: high | medium | low`
- warnings de HTML corto, sin body/html, placeholders, secciones ausentes, múltiples H1/title

Si la confianza es baja o media, el prompt indica al auditor que lo trate como problema de render/HTML y evite bucles de reparación de copy.

## Verificación

Ejecutar:

```bash
node scripts/verify_flow_brain_unification_patch.mjs
npm run typecheck
```

Si `typecheck` tarda por el entorno local, el verificador confirma las invariantes estructurales del parche.
