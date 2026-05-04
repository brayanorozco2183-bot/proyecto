# PATCH: Clean Delivery Cascade Lock

Parche quirúrgico de entrega para estabilizar el HTML final sin cambiar el flujo principal de Gravity.

## Motivo

La última misión falló en `completeness` por `PLACEHOLDER_OR_BROKEN_COPY` y mostró un aviso de que faltaba `src/design-system/procedural-global.css`. Además, el HTML final acumulaba muchas capas CSS y podía mostrar navegación desktop y móvil a la vez, listas sin diseño, bloques descolocados o imagen hero local mal enlazada.

## Cambios

- Añade `src/design-system/procedural-global.css` para eliminar el warning de composición.
- Añade `src/design-system/finalDeliveryCascadeLockCss.ts` como última capa CSS compacta y dominante.
- Añade `src/utils/cleanDeliveryHtmlNormalizer.ts` para normalizar el DOM final.
- Integra el normalizador en `sanitizeFinalRenderedHtml()`.
- Integra el normalizador también en `repairRenderedHtmlForPhase()` para que completeness pueda reparar antes de revalidar.
- Normaliza navegación desktop/móvil.
- Cierra el menú móvil por defecto.
- Normaliza rutas de imágenes locales a `./archivo.png`.
- Añade fallback visual si la imagen no carga.
- Da diseño a listas sueltas y elimina listas vacías.
- Repara anchors internos rotos hacia `#contacto`.
- Limpia residuos visibles como `: este bloque...`, `Factor 1`, `Criterio 1`, `en y`, `en puede variar`, `undefined`, `null`.
- Reescribe textos de reseñas/testimonios genéricos a señales de confianza no verificadas.

## Verificación

```bash
npm run verify:clean-delivery-cascade-lock
```

## Variable recomendada

No requiere variable nueva. Se aplica siempre como última normalización de entrega.
