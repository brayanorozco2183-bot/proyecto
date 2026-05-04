# Checklist de producción BLE V2.4

## Antes de ejecutar batch grande

- [ ] `npm run typecheck` pasa.
- [ ] `npm run audit:security` pasa.
- [ ] `npm run audit:hardening` no muestra críticos.
- [ ] `.env` tiene `NODE_ENV=production` solo en producción real.
- [ ] `DASHBOARD_AUTH_TOKEN` está definido si el dashboard se expone.
- [ ] `DEBUG_MODE=false`.
- [ ] `PIPELINE_SOFT_MODE=false`.
- [ ] `QUALITY_AUDIT_FAIL_OPEN=false`.
- [ ] `AI_FACADE_ALLOW_MOCKS=false`.
- [ ] No hay `.js` duplicados con `.ts` equivalente en `src/`.
- [ ] `output_sites/`, `scratch/`, DBs y backups están fuera del paquete principal.

## Reglas de publicación

Una página no debe publicarse si hay:

- FAQ visible distinta del FAQ schema.
- placeholders visibles.
- falta `meta viewport`.
- links internos a `/index.html`.
- imágenes placeholder.
- fugas de sistema visibles.
- score premium inferior al mínimo definido.

## Uso recomendado

Laboratorio:

```bash
npm run ble:v2
npm run audit:hardening
```

Producción:

```bash
npm run test:hardening
npm run start:prod
```
