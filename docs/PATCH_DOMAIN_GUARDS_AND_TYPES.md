# Patch: reducción de `any` y unificación progresiva de guards/sanitizers

Este parche añade una capa central en `src/guards/` para ordenar los validadores y sanitizers por dominio sin eliminar de golpe los módulos históricos.

## Nuevos dominios

- `legal`: afirmaciones legales, garantías absolutas y claims de riesgo.
- `copy`: copy visible, coherencia semántica y clichés premium.
- `html`: pulido final HTML, head, media, FAQ y sanitización final.
- `layout`: estructura visual, anchors, responsive y reparaciones de layout.
- `links`: anchors internos rotos y textos ancla genéricos.
- `nap`: señales de ciudad, teléfono y nombre comercial.
- `schema`: JSON-LD válido y normalización de nodos.
- `seo`: QualityGate + PremiumScore como auditoría final.

## Punto de entrada recomendado

```ts
import { applyFinalHtmlDomainGuards, applyDomainGuards } from '../guards/index.js';
```

- `applyFinalHtmlDomainGuards(...)`: para producción antes de guardar/publicar HTML.
- `applyDomainGuards(...)`: para auditoría completa incluyendo SEO.

## Migración

El pipeline de assembly ya usa `applyFinalHtmlDomainGuards`. Los módulos existentes se mantienen como compatibilidad, pero el código nuevo debería entrar por `src/guards/`.

## Tipado

Se añadió `src/guards/types.ts` con Zod para validar `GuardContext`, dominios, severidades e issues. También se sustituyeron varios `any` por `unknown`, `JsonValue`, `JsonObject` y payloads tipados donde era seguro hacerlo sin rediseñar todo el pipeline.
