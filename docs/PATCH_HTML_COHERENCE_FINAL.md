# PATCH HTML Coherence Final

Este parche añade una capa final de coherencia de página completa antes de publicar el HTML.

## Objetivos

- Evitar CTA final tipo urgencia cuando ya existe `urgency_panel`.
- Convertir breadcrumbs visibles en texto para evitar enlaces rotos; el JSON-LD mantiene las URLs canónicas.
- Limpiar FAQ schema para que solo incluya preguntas reales del bloque FAQ, filtrando navegación como `Menú`.
- Reescribir `local_proof` cuando promete testimonios/reseñas sin mostrar reviews reales.
- Reducir claims no verificados: años de experiencia inventados, garantías absolutas, gratuidad y certificaciones no aportadas.
- Normalizar tono hacia tuteo consistente.
- Evitar desviaciones semánticas en electricistas: `aparatos eléctricos` pasa a `instalaciones eléctricas`.
- Deduplicar pills y normalizar CTAs demasiado largos o repetidos.
- Reclasificar `services_grid` excedentes como `technical_scenarios` para que la página no parezca una repetición de servicios.

## Archivos principales

- `src/utils/pageCoherenceGuard.ts`
- `src/pipelines/phases/assembly.phase.ts`
- `src/design-system/procedural-engine.ts`
- `scripts/verify_html_coherence_final_patch.mjs`

## Flujo aplicado

La limpieza se ejecuta al final de `AssemblyPhase`, después de los guards de dominio y antes de `finalizeRenderedPageSemantics()`.

```txt
renderPage
↓
domain guards
↓
editorial post-process
↓
domain guards finales
↓
page coherence cleanup
↓
finalizeRenderedPageSemantics
```

## Notas de producción

Este parche no cambia prompts ni llamadas LLM. Actúa como una barrera determinista antes de entregar HTML.
