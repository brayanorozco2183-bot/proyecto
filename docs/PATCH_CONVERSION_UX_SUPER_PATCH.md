# PATCH_CONVERSION_UX_SUPER_PATCH

## Objetivo

Mejora sistémica del diseño generado por Gravity para páginas locales por nicho y ciudad, sin fijar el resultado a un único sector.

El parche actúa en tres capas:

1. **Semántica contextual** por nicho: cerrajería, fontanería, electricidad, reformas, carpintería y fallback genérico.
2. **Conversión visual**: hero más claro, prueba de confianza temprana, CTAs más fuertes, sticky CTA móvil y tarjetas menos repetitivas.
3. **CSS de sistema**: se añade encima de los estilos existentes, sin romper familias, skeletons ni variantes.

## Archivos modificados

- `src/design-system/conversionUxPatch.ts`
- `src/design-system/procedural-engine.ts`
- `src/design-system/components/index.ts`
- `src/design-system/proceduralStyles.ts`
- `src/renderers/blocks/servicesGrid/variants.ts`

## Cambios principales

- Trust strip dinámico después del hero.
- Bullets del hero generados desde nicho + ciudad cuando el payload no trae bullets buenos.
- CTA principal más explícito: `Llamar ahora: <teléfono>`.
- Sticky CTA para móvil.
- Testimonios/prueba documental habilitados para todas las familias de páginas locales, no solo `premiumClassic`.
- Iconos contextuales en tarjetas de servicios.
- CSS adicional con mejor jerarquía, separación, tarjetas, precios, FAQ, móvil y accesibilidad.

## Aplicación

Copiar los archivos del parche respetando rutas y ejecutar:

```bash
npm run typecheck
npm run start
```

## Verificación rápida

```bash
node scripts/audit_conversion_ux_patch.mjs
```
