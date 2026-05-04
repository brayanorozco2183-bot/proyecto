# Patch: Simple Delivery Quality Gate

Este parche añade un quality gate simple y bloqueante para producción inmediata, sin auditoría visual compleja ni cambios en el flujo principal.

## Objetivo

Evitar que lleguen a delivery páginas con errores claros que ya se han visto en salidas reales:

- CTAs a `#contacto` sin ancla real.
- Enlaces internos `#...` rotos.
- H1 ausente o vacío.
- `title` ausente o demasiado corto.
- HTML sin estructura básica.
- Listas o cards vacías.
- Residuos de plantilla como `: este bloque`, `undefined`, `null`, `[object Object]`.
- Frases locales rotas como `en y`, `en puede variar`, `en conviene`.
- Ciudad esperada no visible.
- Lenguaje de clientes/reseñas/testimonios sin evidencia.
- Enlaces `tel:` sin teléfono real.
- Schema `LocalBusiness.telephone` sin teléfono verificado.
- Imágenes sin `src`.

## Archivos

- `src/quality/simpleDeliveryQualityGate.ts`
- `src/pipelines/phases/quality.phase.ts`
- `scripts/verify_simple_delivery_quality_gate.mjs`
- `docs/PATCH_SIMPLE_DELIVERY_QUALITY_GATE.md`
- `aplicar_parche_simple_delivery_quality_gate.bat`

## Variable de entorno

Activado por defecto. Para desactivarlo temporalmente:

```env
GRAVITY_SIMPLE_DELIVERY_GATE=false
```

Recomendado para entrega:

```env
GRAVITY_SIMPLE_DELIVERY_GATE=true
```

## Verificación

```bash
npm run verify:simple-delivery-gate
```

## Nota de alcance

Este parche no usa Playwright, screenshots ni heurísticas visuales complejas. Solo revisa HTML final y contexto de misión con reglas deterministas simples.
