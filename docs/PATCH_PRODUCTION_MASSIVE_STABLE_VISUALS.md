# Patch: Production Massive Stable Visuals

Este parche estabiliza Gravity para producción masiva de páginas locales premium sin romper el flujo por fases.

## Problemas que corrige

- Bloques renderizados con clases nuevas pero sin contrato visual completo.
- Variantes experimentales que producían cards comprimidas, espacios vacíos o layouts descompensados.
- Hero con imagen de baja confianza o baja resolución dominando la página.
- Residuos visibles de plantilla, por ejemplo `: este bloque...`, `en y`, `en puede variar` o CTAs duplicados.
- Listas estructurales vacías como `step-row__meta` sin elementos.
- Lenguaje de reseñas/clientes sin prueba validada.
- Conflictos entre familias visuales, hotfixes y recovery CSS.

## Enfoque

1. **Variantes estables por defecto**  
   Los guards de bloques pasan por `productionVariants.ts`, que fuerza un subconjunto de variantes maduras para producción. Puede desactivarse con:

   ```bash
   GRAVITY_PRODUCTION_VISUAL_STABILITY=false
   ```

2. **Capa visual final de producción**  
   `productionStableVisualCss.ts` añade una capa CSS cerrada y responsive, activada con la clase `gravity-production-stable` en el body.

3. **Sanitización final reforzada**  
   `finalDocumentSanitizer.ts` ahora:
   - inyecta la capa CSS estable al final del head;
   - añade la clase de producción al body;
   - limpia residuos de copy y fragmentos locales rotos;
   - elimina listas vacías;
   - convierte claims de reseñas no verificadas en criterios de comprobación;
   - sustituye hero visual de baja confianza por un fallback premium textual/visual.

4. **Quality gates más estrictos**  
   `premiumPageReadiness.ts` y `blockVisualCoverageGuard.ts` bloquean HTML con residuos visibles, listas vacías, capa CSS ausente, hero de baja confianza no tratado o lenguaje de reseñas sin evidencia.

## Archivos principales

- `src/design-system/productionStableVisualCss.ts`
- `src/renderers/blocks/productionVariants.ts`
- `src/utils/finalDocumentSanitizer.ts`
- `src/design-system/proceduralStyles.ts`
- `src/design-system/procedural-engine.ts`
- `src/quality/premiumPageReadiness.ts`
- `src/quality/blockVisualCoverageGuard.ts`
- Guards de renderers en `src/renderers/blocks/*/guards.ts`

## Validación recomendada

```bash
npm install
npm run typecheck
npm run audit:security
npm run audit:hardening
npm run start -- "electricistas en Sevilla"
```

Después de generar una página, comprobar:

- El body contiene `gravity-production-stable`.
- El head contiene `gravity-production-stable-visual`.
- No aparecen textos como `: este bloque`, `en y`, `en puede variar`, `servicios gratuitos`.
- No hay `ul:empty` ni `ol:empty`.
- No se usa lenguaje de reseñas si la misión no aporta reseñas verificadas.

