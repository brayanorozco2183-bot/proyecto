# Patch: Delivery Stable CSS

## Objetivo

Este parche implementa el segundo paso de estabilización para entrega inmediata: una capa CSS final, compacta y conservadora que normaliza el aspecto de las páginas sin cambiar el flujo principal de Gravity.

La intención no es introducir una nueva arquitectura visual, sino hacer que lo existente salga más presentable y consistente en producción.

## Qué añade

- `src/design-system/deliveryStableCss.ts`
  - Capa CSS final `Gravity Delivery Stable CSS v1`.
  - Normaliza contenedores, secciones, hero, cards, grids, CTAs, FAQ, mapa, footer y responsive.
  - Oculta listas o nodos vacíos que generan huecos visuales.
  - Reduce conflictos visuales al aplicar reglas bajo la clase `body.gravity-delivery-stable`.

- `src/design-system/proceduralStyles.ts`
  - Inyecta la nueva capa cuando se construyen los estilos globales procedurales.

- `src/utils/finalDocumentSanitizer.ts`
  - Inyecta `<style id="gravity-delivery-stable-css">` en el HTML final.
  - Añade la clase `gravity-delivery-stable` al `<body>`.
  - Compacta artefactos visuales vacíos antes de entregar el HTML.

- `scripts/verify_delivery_stable_css.mjs`
  - Verifica que los archivos y marcadores críticos están instalados.

- `package.json`
  - Añade el comando:

```bash
npm run verify:delivery-stable-css
```

## Qué problemas ataca

- Páginas que parecen wireframe.
- Cards blancas repetidas sin jerarquía.
- Grids inestables en desktop/móvil.
- CTAs con poco peso visual.
- Hero mal integrado.
- Secciones con demasiado aire o elementos vacíos.
- Mapa/FAQ/footer desalineados con el resto del diseño.
- Conflictos de CSS globales mediante una capa final acotada a clase de body.

## Qué no toca

- Orquestador.
- Agentes.
- Fases del pipeline.
- DB.
- Redis/BullMQ.
- Lógica SEO.
- Playbooks de nicho.

## Variables sugeridas

El `.bat` añade a `.env.example`:

```env
GRAVITY_DELIVERY_STABLE_CSS=true
```

La clase y el CSS se inyectan desde el sanitizador final para no depender de configuración externa durante la entrega.

## Instalación

Desde la raíz del proyecto:

```bat
aplicar_parche_delivery_stable_css.bat
```

O manualmente:

1. Copiar `src/`, `scripts/`, `docs/` y `package.json` sobre la raíz del proyecto.
2. Ejecutar:

```bash
npm run verify:delivery-stable-css
```

## Recomendación de entrega

Usar este parche junto con el modo de producción seguro anterior. La combinación recomendada es:

```env
GRAVITY_PRODUCTION_SAFE_MODE=true
GRAVITY_PRODUCTION_VISUAL_STABILITY=true
GRAVITY_DELIVERY_STABLE_CSS=true
GRAVITY_AI_CREATIVE_MODE=false
```

