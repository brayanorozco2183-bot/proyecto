# Parche Gravity Premium Any-Niche Flow

Copia el contenido de este ZIP sobre la raíz del proyecto Gravity, respetando rutas.

## Archivos incluidos

- `src/niches/genericPlaybook.ts`
- `src/niches/agentAdapters.ts`
- `src/niches/premiumContracts.ts`
- `src/pipeline-state/pipelineStateStore.ts`
- `src/quality/premiumPageReadiness.ts`
- `src/quality/policy/qualityIssueAdapters.ts`
- `src/pipelines/phases/quality.phase.ts`
- `docs/PATCH_PREMIUM_ANY_NICHE_FLOW.md`

## Después de aplicar

```bash
npm install
npm run typecheck
npm run audit:security
npm run audit:hardening
```

Nota: en el entorno donde se creó este ZIP no se pudo instalar `node_modules` porque el registry devolvió 403 para `@types/sqlite3`; por eso el typecheck local queda condicionado a que tus dependencias estén instaladas correctamente.
