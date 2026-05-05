# Final UX Delivery Guard

Capa final de entrega para evitar páginas visualmente rotas cuando los renderers no transmiten clases/estilos suficientes.

## Se conecta en

- `src/utils/finalDocumentSanitizer.ts`
- `src/repair/pageRepairKit.ts`
- `src/pipelines/phases/delivery.phase.ts`

## Corrige globalmente

- Navegación desktop/móvil.
- Breadcrumbs.
- Listas sin clase.
- Píldoras y metadatos.
- Listas de proceso.
- Cards de servicios, confianza, precios, FAQ, interlinking y profundidad premium.
- CTAs con texto demasiado largo.
- Espaciados generales.
- Textos visibles rotos frecuentes.

## Marcas esperadas en HTML final

- `GRAVITY_FINAL_UX_DELIVERY_GUARD_APPLIED`
- `gravity-final-ux-delivery-guard-css`
- `data-gravity-ux-guard="final-v1"`

## Verificación

```bash
npm run verify:final-ux-delivery-guard
```
