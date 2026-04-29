# Patch: Niche Intelligence Layer

Este parche añade una capa central para que el pipeline no dependa solo de texto genérico por bloque. El objetivo es clasificar el nicho, detectar intención, cargar señales verticales y pasar ese perfil a los contratos de bloque antes del render.

## Archivos nuevos

- `src/niche-intelligence/types.ts`
- `src/niche-intelligence/text.ts`
- `src/niche-intelligence/verticalProfiles.ts`
- `src/niche-intelligence/classifyNiche.ts`
- `src/niche-intelligence/buildNicheProfile.ts`
- `src/niche-intelligence/index.ts`
- `scripts/verify_niche_intelligence_patch.mjs`

## Integraciones principales

- `src/renderers/blocks/types.ts` ahora permite transportar `nicheProfile` en `BlockRendererInput`.
- `src/renderers/blocks/contracts.ts` resuelve o crea el perfil de nicho y lo usa para:
  - títulos fallback,
  - servicios fallback,
  - respuestas FAQ fallback,
  - trust bullets,
  - CTA por intención,
  - readiness checks de vocabulario técnico,
  - seguridad de claims en verticales sensibles.
- `src/design-system/blockPayloadAdapter.ts` crea `nicheProfile` antes de adaptar la sección al renderer.
- `src/niches/premiumContracts.ts` usa el perfil como fallback para nichos que no tienen contrato premium dedicado.
- `src/niches/index.ts` reexporta la capa `niche-intelligence`.

## Verticales incluidas

- home_services
- healthcare
- legal
- education
- automotive
- hospitality
- beauty
- real_estate
- finance
- b2b_services
- local_retail
- generic_services

## Overrides concretos incluidos

- cerrajeros
- fontaneros
- electricistas
- abogados
- dentistas

La lógica sigue siendo extensible: se pueden añadir más overrides sin tocar los renderers.

## Verificación incluida

Ejecutar:

```bash
npm run verify:niche-intelligence
```

o directamente:

```bash
node scripts/verify_niche_intelligence_patch.mjs
```

Resultado esperado:

```txt
Niche Intelligence patch verification passed. Profiles, classifier, adapter integration, block readiness checks, and premium fallback integration are present.
```

## Nota de validación

La verificación incluida comprueba presencia e integración del parche. En este entorno el `tsc --noEmit` completo no llegó a finalizar dentro del límite de ejecución disponible, por lo que la validación completa de TypeScript debe ejecutarse en el entorno local del proyecto con dependencias instaladas.
