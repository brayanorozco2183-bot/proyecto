# PATCH_ENRICHMENT_SCOPE_FIX

Este parche corrige el fallo detectado en misiones reales donde la fase `enrichment` fallaba con:

```txt
mission is not defined
```

## Cambios aplicados

1. `runEnrichment` ahora recibe `mission?: GenerationMission` y crea una misión segura de respaldo con `context`, `plan` y `draft`.
2. `contentGenerationPipeline.runEnrichmentPhase()` pasa la misión real al motor de escritura.
3. El host de la state machine también pasa la misión real al enrichment.
4. La fase 7 añade logs `START`, `END` y `ENRICHMENT_DEGRADED`.
5. Cada bloque se enriquece con `try/catch` propio para que un bloque roto no tumbe toda la página.
6. La inyección de enlaces internos también queda protegida con fallback.
7. Si enrichment falla globalmente, devuelve el `correctedDraft` con metadata `enrichment.status = degraded` para permitir que el pipeline continúe hacia SEO, assembly y delivery.

## Resultado esperado

Una misión no debería volver a detenerse en Phase 7 por una variable `mission` fuera de scope. Si hay un error de enrichment, el log debería mostrar:

```txt
[Phase 7] ENRICHMENT_DEGRADED ... Continuing with corrected draft.
```

Y la misión debería avanzar hacia:

```txt
[Phase 7.5] Building SEO contract and metadata...
[Phase 8] START Final procedural composition...
MISSION_SUCCESS html_path=...
```
