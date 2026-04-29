# Revisión premium + SEO

Este paquete contiene el proyecto reconstruido a partir del volcado TXT proporcionado y el `index.html` final, con correcciones puntuales para mejorar sensación premium, claridad comercial, SEO editorial y control de placeholders.

## Archivos modificados

### `index.html`
- Se cambió el `title`, la meta description, Open Graph y Twitter para que suenen menos a plantilla y más a landing comercial de cerrajería.
- Se ajustó el JSON-LD para capitalizar `Valencia`, afinar el nombre del servicio y mejorar breadcrumbs.
- Se corrigió la dirección visual del body: fuera la familia editorial serif, y paso a un layout más técnico/panelado.
- Se reescribieron hero, servicios, proceso, cobertura local, FAQ, CTA y urgencias para eliminar headings A/B/C, claims vacíos y copy repetitivo.

### `src/agents/architect.ts`
- Se mejoraron H2/H3 de secciones obligatorias para que suenen menos genéricos.
- Se retocó el fallback de blueprint, H1, meta title y meta description para que no arranquen con fórmulas flojas.
- Para páginas no informacionales, el fallback pasa a `conversion-funnel` en lugar de `editorial-longform`.

### `src/agents/artDirectorAgent.ts`
- Se añadió una selección de familia visual alineada con la misión (`pickMissionAlignedFamily`).
- Se endureció el ADN visual comercial para evitar que páginas transaccionales de oficios locales caigan en un look demasiado editorial/serif.
- El fallback ahora favorece `technical_grid`, `conversion_heavy` o `local_trust` según intención/página.

### `src/agents/contentWriterAgent.ts`
- Se añadió saneado semántico post-LLM para reemplazar títulos genéricos por H3 reales cuando haga falta.
- Se introdujo limpieza de frases débiles (`tiempo récord`, `líderes indiscutibles`, etc.) y normalización de ciudad/teléfono.
- Se reforzó la validación para marcar como fallo títulos placeholder dentro del HTML final.

### `src/niches/blockContent.ts`
- Se suavizaron intros base del playbook para que no parezcan texto puente o comentario interno.

### `src/validators/qualityGate.ts`
- Se añadió una comprobación explícita para detectar headings placeholder tipo `Intervención Técnica Especializada A`.
- Se añadió una alerta de capitalización defectuosa de la ciudad en headings.

## Nota
- El ZIP contiene solo lo que se pudo reconstruir a partir de los archivos que me enviaste. El volcado TXT no incluía dependencias ni algunos assets externos, así que la parte entregable está centrada en `src/` y el `index.html` final.