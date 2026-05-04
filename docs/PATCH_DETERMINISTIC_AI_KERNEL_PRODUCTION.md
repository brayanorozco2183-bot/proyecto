
# Patch: Determinismo + IA controlada para producción masiva

Este parche implementa la arquitectura recomendada para Gravity:

> Estructura determinista, contenido variable con IA y validación bloqueante.

## Qué cambia

1. **Kernel determinista de producción**
   - Archivo: `src/design-system/deterministicAiKernel.ts`
   - Define orden estable de bloques.
   - Define variantes visuales estables por tipo de bloque.
   - Normaliza secciones antes de renderizar.
   - En producción se activa por defecto con `NODE_ENV=production`.
   - También puede forzarse con `GRAVITY_DETERMINISTIC_AI_KERNEL=true`.
   - Puede desactivarse para experimentación con `GRAVITY_AI_CREATIVE_MODE=true`.

2. **CSS premium estable**
   - Archivo: `src/design-system/deterministicPremiumCss.ts`
   - Evita que los bloques salgan como wireframes.
   - Unifica hero, cards, mapas, procesos, FAQs, CTAs y grids.
   - Resuelve gran parte de los conflictos visuales de parches anteriores.

3. **Sanitizador HTML determinista**
   - Archivo: `src/utils/deterministicHtmlSanitizer.ts`
   - Limpia copy roto: `: este bloque`, `en y`, `en puede variar`.
   - Elimina listas vacías.
   - Sustituye lenguaje de reseñas/testimonios sin evidencia.
   - Reemplaza hero de baja resolución por fallback visual premium.

4. **Quality gate de producción**
   - Archivo: `src/quality/deterministicProductionGate.ts`
   - Bloquea publicación si faltan estilos deterministas, hay residuos visibles, listas vacías, copy local roto o reseñas no verificadas.

5. **Integración sin romper el flujo**
   - `planning.phase.ts`: normaliza el plan, no sustituye el flujo.
   - `renderPlanResolver.ts`: aplica contratos visuales estables al plan resuelto.
   - `assembly.phase.ts`: limpia HTML final antes de semantic sealing.
   - `quality.phase.ts`: añade gate determinista a las validaciones existentes.
   - `finalDocumentSanitizer.ts`: aplica la última limpieza determinista al documento final.

## Reglas de arquitectura

- La IA puede variar copy, enfoque, objeciones, ejemplos y microcopy.
- La IA no puede inventar estructura visual libre en producción.
- Los bloques se renderizan con variantes cerradas y testeables.
- Si la IA entrega campos incompletos, Gravity normaliza o degrada a fallback premium.
- Si queda HTML roto, el quality gate bloquea o degrada según `PIPELINE_SOFT_MODE`.

## Variables recomendadas en `.env` para producción masiva

```env
NODE_ENV=production
GRAVITY_DETERMINISTIC_AI_KERNEL=true
GRAVITY_AI_CREATIVE_MODE=false
PIPELINE_SOFT_MODE=false
QUALITY_AUDIT_FAIL_OPEN=false
DEBUG_MODE=false
```

Para hacer pruebas creativas fuera de producción:

```env
GRAVITY_AI_CREATIVE_MODE=true
```

## Validación recomendada

```bash
npm install
npm run typecheck
npm run audit:security
npm run audit:hardening
```

El `.bat` incluido aplica el parche, crea backup e intenta ejecutar `npm run typecheck` si existen dependencias.
