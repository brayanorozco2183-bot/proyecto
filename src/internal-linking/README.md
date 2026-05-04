# Internal Linking Engine

Motor programático para pasar de páginas sueltas a clusters enlazados.

## Módulos

- `siteGraph.ts`: genera nodos y slugs base del cluster.
- `linkRules.ts`: crea aristas heurísticas del sitio.
- `linkPlanner.ts`: resuelve el plan mínimo de enlaces por página.
- `autoBlocks.ts`: crea bloques automáticos de enlazado.
- `pipelineAdapters.ts`: helpers para conectarlo a tu pipeline actual.
- `validator.ts`: valida el criterio de aceptación.

## Criterio cubierto

- mínimo 3 enlaces internos útiles
- mínimo 1 enlace ascendente
- mínimo 1 enlace lateral
- mínimo 1 enlace BOFU si la página es TOFU/MOFU

## Nota importante

He mantenido `SiteNode.type` como en tu especificación (`service`, `service_area`, `guide`, `faq`, `comparison`, `home_local`) y he representado las urgencias con `type: 'service'` + `pageSubtype: 'urgent'` para no romper el contrato base.
