# Parche BLE V2.3 — Arquitectura de auto-reparación por fases

Este parche convierte el pipeline en una arquitectura de reparación fase por fase:

1. **Orquestador de reparación**: `src/repair/phaseRepairOrchestrator.ts`.
2. **Kit de reparación de página renderizada**: `src/repair/pageRepairKit.ts`.
3. **Validación técnica reutilizable por fase**: todos los checkpoints usan `analyzeTechnicalIntegrity` como fuente común.
4. **FAQ visible = FAQ schema**: el schema se sincroniza desde las FAQs visibles antes del Quality Gate.
5. **Viewport obligatorio**: se fuerza exactamente un meta viewport válido.
6. **Imágenes obligatorias**: si quedan imágenes vacías o placeholder, se reemplazan por SVG editorial determinista con alt, width y height.
7. **Links `/index.html` corregidos**: se normalizan antes de publicar.
8. **Placeholders visibles bloqueantes y reparables**: `[Ciudad]`, `{{var}}`, `En ,`, `undefined`, `null`, etc.
9. **Quality Gate endurecido**: antes de puntuar se repara y se valida integridad técnica.
10. **Delivery protegido**: antes de escribir/publicar se ejecuta `assertFinalPageReady`.
11. **Auditor CLI**: `scripts/audit_ble_v23_phase_repair.ts`.

## Comprobación recomendada

```bash
node apply_ble_v23_phase_repair_patch.mjs
npm install
npm run typecheck || npx tsc --noEmit
npx tsx scripts/audit_ble_v23_phase_repair.ts output_sites
npx tsx src/experiments/large_learning_run.ts
```

## Criterio de éxito

- Ningún HTML final con `MOBILE_VIEWPORT_MISSING`.
- Ningún `FAQ_SCHEMA_CONTENT_MISMATCH`.
- Ningún `PLACEHOLDER_OR_BROKEN_COPY`.
- Ningún `PRODUCTION_PLACEHOLDER_VISUAL`.
- Ningún `/index.html` interno.
- Páginas con fallos críticos no pueden llegar a delivery en modo publish estricto.
