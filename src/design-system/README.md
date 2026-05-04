# Design System cerrado para tu pipeline

Este paquete cambia el modelo de **"estilo sugerido"** a **design system consistente y reusable**.

## Qué contiene

### Tokens
- `src/design-system/tokens/colors.ts`
- `src/design-system/tokens/typography.ts`
- `src/design-system/tokens/spacing.ts`
- `src/design-system/tokens/radius.ts`
- `src/design-system/tokens/shadow.ts`
- `src/design-system/tokens/breakpoints.ts`
- `src/design-system/tokens/motion.ts`

### Themes
- `src/design-system/themes/premiumClassic.ts`
- `src/design-system/themes/modernTrust.ts`
- `src/design-system/themes/localAuthority.ts`
- `src/design-system/themes/editorialLuxury.ts`
- `src/design-system/themes/technicalClean.ts`

## Qué cierra respecto a tu sistema actual

Tu pipeline ya decide cosas como:
- `family`
- `heroTreatment`
- `pageComposition`
- `cadencePattern`
- `cardTreatment`
- `spacingScale`
- `fingerprint`

Aquí esas señales ya no terminan en decisiones abiertas, sino en un **theme oficial** con reglas fuertes:
- 1 sistema de botones por theme
- 1 tratamiento de cards por theme
- 1 política de shadow por theme
- 1 ritmo vertical por theme
- 1 regla de hero por theme

## Paso a paso

### Paso 1
Usa `resolveThemeFromDna(dna)` desde `src/design-system/themes/index.ts`.

Ejemplo:

```ts
import { resolveThemeFromDna } from './design-system/themes/index.js';

const theme = resolveThemeFromDna(pageDesignDna);
```

### Paso 2
Usa `theme.tokens` para pintar UI:
- `theme.tokens.colors`
- `theme.tokens.typography`
- `theme.tokens.spacing`
- `theme.tokens.radius`
- `theme.tokens.shadow`
- `theme.tokens.breakpoints`
- `theme.tokens.motion`

### Paso 3
Usa `theme.rules` para limitar libertad visual:
- `theme.rules.buttonSystem`
- `theme.rules.cards`
- `theme.rules.shadowPolicy`
- `theme.rules.verticalRhythm`
- `theme.rules.hero`
- `theme.rules.allowedShells`
- `theme.rules.shellUsage`

### Paso 4
Haz que cada renderer de bloque lea **shell + theme + rules**, no estilos libres.

## Mapeo recomendado con tus familias actuales

- `editorial` -> `editorialLuxury`
- `conversion_heavy` -> `modernTrust`
- `local_trust` -> `localAuthority`
- `technical_grid` -> `technicalClean`
- `asymmetric_premium` -> `premiumClassic`
- `minimal_authority` -> `technicalClean`

## Decisiones intencionales

### Tokens primarios
Se definen de forma explícita:
- `color.bg`
- `color.surface`
- `color.text`
- `color.muted`
- `color.primary`
- `color.accent`
- `color.success`
- `color.warning`

### Tipografía cerrada
Se definen únicamente estas escalas:
- `heroTitle`
- `h1`
- `h2`
- `h3`
- `bodyLg`
- `bodyMd`
- `caption`
- `button`

### Spacing por sección
Solo existen:
- `compact`
- `standard`
- `spacious`
- `editorial`

### Shells oficiales
Solo existen:
- `plain`
- `panel`
- `band`
- `feature`
- `editorial`
- `comparison`

Esto evita que cada bloque vuelva a inventar superficies, ritmos y jerarquías.
