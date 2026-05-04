# Patch: Final Delivery Emergency Lock

Este parche es una capa de entrega final para evitar que las páginas salgan visualmente rotas cuando ya no hay tiempo para rediseñar el sistema completo.

## Qué corrige

- Evita que el nav de escritorio y el nav móvil se vean a la vez.
- Fuerza una navegación móvil cerrada por defecto.
- Añade una capa CSS final, compacta y con máxima prioridad de entrega.
- Normaliza hero, grids, CTAs, FAQ, listas, cards, mapa y footer.
- Oculta/remueve listas vacías y wrappers vacíos.
- Elimina estilos experimentales `paradigm-bento_grid_system` / `paradigm-cinematic_scroll` del HTML final.
- Normaliza imágenes locales del hero a `./nombre-archivo.ext` para que apunten a imágenes en la misma carpeta que el HTML.
- Añade fallback visual si la imagen del hero no carga.
- Repara anchors internos rotos a `#contacto`.

## Alcance

No cambia el flujo del proyecto. Se integra en `sanitizeFinalRenderedHtml()`, justo antes de entregar el HTML final.

## Verificación

```bash
npm run verify:final-delivery-lock
```
