# Gravity BLE V2.2 Definitive Technical Integrity Patch

Corrige la desincronización entre scoring, Quality Gate y ensamblado final.

## Validación

```bash
npm install
npm run typecheck || npx tsc --noEmit
npx tsx scripts/audit_ble_v22_integrity.ts output_sites
npx tsx src/experiments/large_learning_run.ts
```

## Criterio

No se publica como premium si technicalIntegrity.hardBlock=true.
