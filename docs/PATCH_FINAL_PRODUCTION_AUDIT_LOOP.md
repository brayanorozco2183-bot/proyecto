# Patch: Final Production Audit Loop

Este parche añade una capa final de auditoría de producción antes y después de escribir la página final.

## Objetivo

Evitar que Gravity entregue páginas que visualmente parecen correctas pero todavía contienen problemas de producción:

- enlaces CTA a `#contacto` sin destino real;
- listas vacías;
- residuos de plantilla;
- copy local incompleto (`en y`, `en puede variar`);
- lenguaje de reseñas/testimonios sin evidencia;
- falta de H1 único;
- pocas secciones o pocos H2;
- hero de baja resolución sin fallback;
- demasiadas capas CSS que pueden pisarse;
- cards demasiado finas o wireframe.

## Archivos añadidos

- `src/quality/finalProductionAudit.ts`
- `scripts/audit_final_html.ts`
- `docs/PATCH_FINAL_PRODUCTION_AUDIT_LOOP.md`
- `aplicar_parche_final_production_audit_loop.bat`

## Archivos modificados

- `src/utils/deterministicHtmlSanitizer.ts`
- `src/quality/deterministicProductionGate.ts`
- `src/pipelines/phases/quality.phase.ts`
- `src/pipelines/phases/delivery.phase.ts`
- `package.json`

## Qué cambia en el flujo

### Quality phase

Después de la sanitización determinista, se ejecuta `runFinalProductionAudit()` y sus incidencias se agregan al resultado de calidad.

### Delivery phase

Antes de escribir `index.html`, se vuelve a ejecutar el sanitizador determinista y se genera:

- `production_audit.json`
- `production_audit.md`

junto al HTML final.

Por defecto, Delivery no se bloquea para no romper flujos existentes. Si se quiere bloqueo estricto, activar:

```env
GRAVITY_DELIVERY_BLOCK_ON_FINAL_AUDIT=true
```

## Nuevo comando

```bash
npm run audit:final-html
```

Audita los HTML existentes en `output_sites` y genera reportes `.production_audit.json` y `.production_audit.md` junto a cada archivo.

También queda disponible:

```bash
npm run audit:production
```

que combina typecheck, auditorías existentes y auditoría final de HTML.

## Por qué este parche era el siguiente más conveniente

Después del kernel determinista + IA controlada, el siguiente punto débil era la observabilidad final: detectar de forma repetible si una página está lista para producción masiva. Este parche no cambia el objetivo del pipeline; añade una inspección final explicable y archivos de reporte para que cada misión deje evidencia clara de su calidad.
