# Parche de limpieza BLE V2.1

## Qué corrige

1. Imports rotos o inconsistentes:
   - `src/experiments/large_learning_run.ts` deja de importar `.ts`.
   - `large_learning_run.ts` raíz queda como wrapper correcto.
   - `scripts/step_mission.ts` apunta a `src/renderers/renderPlanResolver.js`.
   - `scratch/verify_quality.ts` usa `dbManager`, no un módulo inexistente `src/database/sqlite.js`.

2. FAQ/schema:
   - Nuevo `src/utils/faqSanitizer.ts`.
   - Limpia artefactos tipo `¿3¿Cómo...?`, `4) ¿Qué...?` en HTML visible y JSON-LD.
   - PremiumScore y QualityGate ahora penalizan `FAQ_NUMBERING_ARTIFACT` y `SCHEMA_JSON_INVALID`.

3. Experimento:
   - Early stopping más inteligente: no corta por una bajada relativa si la página sigue en rango publicable/premium.
   - Corta por métricas inválidas, contaminación, leaks visibles, schema inválido o score bajo real.

4. Scripts:
   - Añade `npm run typecheck`.
   - Añade `npm run ble:v2`.
   - Añade `npm run audit:cleanup`.
   - Sustituye el test placeholder por typecheck + auditoría estática.

## Cómo aplicar

```bash
node apply_cleanup_patch.mjs
npm install
npm run typecheck
npm run audit:cleanup
npm run ble:v2
```

Cada archivo modificado deja copia `.bak-cleanup`.
