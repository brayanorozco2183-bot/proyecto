# Parche: Delivery Editorial Hardening

Este parche es quirúrgico y está pensado para entrega inmediata. No cambia el orquestador, los agentes ni el flujo por fases. Añade una última capa editorial antes de publicar el HTML final.

## Objetivo

Reducir errores visibles que hacen que una página parezca generada o rota:

- residuos como `: este bloque resume...`;
- fragmentos incompletos tipo `en y`, `en puede variar`, `en conviene`;
- listas vacías que dejan huecos visuales;
- CTAs repetidos con el mismo texto;
- lenguaje de reseñas/clientes sin evidencia real;
- claims delicados como `gratis`, `24h`, `garantizado` sin matiz;
- tokens técnicos visibles como `undefined`, `null` o `[object Object]`.

## Archivos añadidos

- `src/utils/deliveryEditorialHardening.ts`
- `scripts/verify_delivery_editorial_hardening.mjs`
- `docs/PATCH_DELIVERY_EDITORIAL_HARDENING.md`

## Archivos modificados

- `src/utils/finalDocumentSanitizer.ts`
- `package.json`

## Integración

`sanitizeFinalRenderedHtml()` ahora ejecuta `hardenDeliveryEditorialHtml()` justo antes de la sanitización legal y determinista final.

Esto permite mantener el flujo actual, pero endurecer el HTML publicado.

## Verificación

```bash
npm run verify:delivery-editorial-hardening
```

Si tienes dependencias instaladas, después puedes ejecutar:

```bash
npm run typecheck
```

## Nota

Este parche no intenta añadir auditoría visual ni Playwright. Su propósito es estabilizar la entrega actual con cambios de bajo riesgo.
