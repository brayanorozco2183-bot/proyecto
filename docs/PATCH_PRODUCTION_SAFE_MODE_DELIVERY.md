# Patch: Production Safe Mode Delivery

Este parche estabiliza la salida visual de Gravity sin cambiar el flujo principal del proyecto.

## Objetivo

Priorizar páginas publicables, limpias y predecibles sobre variantes experimentales. La IA puede seguir variando contenido por nicho y ciudad, pero el sistema fuerza variantes visuales maduras para evitar layouts comprimidos, CTAs flotando, secciones tipo wireframe o bloques demasiado complejos.

## Qué cambia

- Nuevo kernel de configuración: `src/config/productionSafeMode.ts`.
- `productionVariants.ts` usa esa configuración como fuente única de verdad.
- `deterministicAiKernel.ts` alinea planning/render plan con el modo seguro.
- `contracts.ts` normaliza variantes inseguras justo antes de renderizar.
- Nuevo comando de verificación:

```bash
npm run verify:production-safe-mode
```

## Variantes forzadas en modo seguro

| Bloque | Variante segura |
|---|---|
| hero_trust | centered_clean |
| urgency_panel | status_banner |
| services_grid | clean_cards |
| process_steps | numbered_list |
| local_proof | cards_minimal |
| map | boxed_with_text |
| price_guidance | cards_price |
| faq | accordion_clean |
| cta_panel | minimal_phone_bar |
| trust_band | static_pills |
| comparison_table | matrix_clean |

## Variables recomendadas

```env
GRAVITY_PRODUCTION_SAFE_MODE=true
GRAVITY_PRODUCTION_VISUAL_STABILITY=true
GRAVITY_AI_CREATIVE_MODE=false
```

Para experimentar con variantes visuales:

```env
GRAVITY_DISABLE_PRODUCTION_SAFE_MODE=true
```

## Nota

Este parche no elimina variantes experimentales. Solo evita que se usen en producción inmediata. Así no rompe el flujo ni bloquea trabajo futuro de diseño.
