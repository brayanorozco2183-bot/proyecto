# Patch: Block Contracts + Payload Quality

Este parche añade una capa central de contratos de bloque antes del renderizado. El objetivo es que las páginas de cualquier nicho y ciudad no dependan de HTML aceptable pero contenido débil.

## Cambios principales

- Nuevo `src/renderers/blocks/contracts.ts`.
- Nuevo contrato Zod común `BlockRendererInputSchema`.
- Normalización previa al render con `normalizeBlockRendererInput()`.
- Cálculo de `quality`/`readiness` por bloque: `ready`, `score`, `missing`, `repaired`.
- Contratos específicos para bloques críticos:
  - hero
  - services_grid
  - local_proof
  - trust_band
  - faq
  - price_guidance
  - cta_panel
  - map
- Sustitución de guards permisivos `return true` por validación Zod del input de renderer.
- Sustitución de `z.any()` por `z.unknown()` en schemas de bloques.
- Tipado más explícito de `BlockRendererInput`, `BlockContent`, `BlockContentItem`, `BlockFaqItem`, `BlockSeoData`, `BlockLocalData` y `BlockReadiness`.
- Enlaces internos revisados para dejar de usar `as any` en el renderer compartido.

## Flujo después del parche

```txt
semantic draft
↓
blockPayloadAdapter
↓
renderBlock
↓
normalizeBlockRendererInput
↓
Zod contract + readiness score
↓
renderer específico del bloque
↓
HTML final
```

## Verificación incluida

Ejecutar:

```bash
node scripts/verify_block_contracts_patch.mjs
```

Esta verificación comprueba que:

- existe la capa central de contratos,
- `renderBlock` normaliza antes de renderizar,
- los guards ya no devuelven `true` sin validar,
- los schemas de bloques ya no usan `z.any()`,
- los renderers centrales no usan `as any`.

## Nota de compatibilidad

El parche es conservador: no bloquea de forma agresiva los renderers existentes. Si un bloque llega incompleto, se normaliza con mínimos reutilizables para cualquier nicho/ciudad: diagnóstico, alcance, criterios de decisión, cobertura, CTA y comprobación final.
