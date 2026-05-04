# Gravity Final Delivery Unblock Patch

Este parche corrige dos bloqueos detectados en la última misión:

1. `assembly` caía a fallback de emergencia porque `copyGuard` podía crear issues sin `code` válido.
2. `images` fallaba con `SCHEMA_MISSING` y bloqueaba la entrega aunque no hubiese imágenes que generar.

## Cambios

- `src/guards/types.ts`
  - `createIssue()` ahora acepta `unknown`, normaliza `code`, `message` y `severity`, y nunca genera un issue inválido por `code: undefined`.

- `src/guards/domains/copy.ts`
  - Copy guard dividido en subpasos protegidos.
  - Si falla un subpaso, se registra warning y se devuelve el HTML actual en vez de romper `assembly`.
  - Issues de `contentGuard` y `semanticContentGuard` se normalizan con fallback seguro.

- `src/repair/pageRepairKit.ts`
  - Añadido `ensureMinimumJsonLd()` para crear un JSON-LD mínimo `LocalBusiness` si no existe ninguno.
  - Esto evita que una fase no relacionada con schema, como `images`, bloquee por `SCHEMA_MISSING`.

- `src/pipelines/phases/quality.phase.ts`
  - `runImagePhase()` devuelve un schema/metadata válido aunque las imágenes estén desactivadas u omitidas.
  - Si la fase de imágenes falla, se degrada y continúa en vez de tumbar la misión.

- `src/pipeline-state/contentPipelineStateMachine.ts`
  - Si `assembly` usa `emergency_fallback`, la fase queda marcada como `degraded` con warning `ASSEMBLY_EMERGENCY_FALLBACK`, no como success limpio.

## Resultado esperado

La misión debería poder avanzar más allá de:

```txt
images failed after 3 attempt(s): SCHEMA_MISSING
```

Y si no hay imágenes, debería seguir con:

```txt
images: degraded
warnings: IMAGES_SKIPPED
```

Si `assembly` cae a emergencia, el resumen debería mostrarlo como degradado, no como éxito limpio.
