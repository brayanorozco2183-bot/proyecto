# PATCH: Phase Observability

Este parche añade observabilidad estructurada al flujo de generación sin cambiar la lógica principal de generación.

## Archivos nuevos por misión

Cada misión con `persistState` / `debugMode` generará, cuando haya `artifactsDir`:

- `mission_events.jsonl`: eventos estructurados por misión/fase.
- `mission_summary.json`: resumen accionable de estado, fase fallida, error y métricas.
- `mission_summary.md`: resumen humano rápido.
- `phase_timings.json`: duraciones por fase.
- `llm_calls.json`: telemetría de llamadas LLM.
- `block_diagnostics.json`: diagnóstico semántico básico por bloque.

## Eventos principales

- `MISSION_START`
- `PHASE_START`
- `PHASE_END`
- `PHASE_FAILED`
- `MISSION_SUCCESS`
- `MISSION_FAILED`

## Clasificación de errores

`src/observability/errorClassifier.ts` clasifica errores como:

- `ERROR_SCOPE`
- `ERROR_LLM_TIMEOUT`
- `ERROR_LLM_EMPTY_RESPONSE`
- `ERROR_JSON_PARSE`
- `ERROR_SCHEMA_VALIDATION`
- `ERROR_RENDER_BLOCK`
- `ERROR_SANITIZER`
- `ERROR_FILESYSTEM`
- `ERROR_STATE_WRITE`
- `ERROR_DOM_MALFORMED`
- `ERROR_NETWORK`
- `ERROR_UNKNOWN`

## Telemetría LLM

`src/tools/aiFacade.ts` registra:

- agente,
- modelo,
- intento,
- duración,
- tamaño de prompt/respuesta,
- modo JSON,
- timeout configurado,
- llamadas lentas como `SLOW_CALL`.

Las llamadas lentas no se cancelan; solo se marcan. Esto es importante para equipos con hardware limitado.

## Script de análisis rápido

```bash
node scripts/analyze_mission_logs.mjs debug_runs/<mission_dir>
```

El script imprime:

- estado de misión,
- fase fallida,
- tipo de error,
- fases más lentas,
- llamadas LLM lentas,
- bloques débiles,
- eventos de error recientes.

## Verificación

```bash
node scripts/verify_phase_observability_patch.mjs
```
