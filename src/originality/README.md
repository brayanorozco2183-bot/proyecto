# Site Originality / Anti-Repetition

Esta capa convierte tu anti-repetición actual en un sistema de escala sitio con tres memorias persistentes:

- `visualMemory`: héroe, variantes, nav y CTA.
- `editorialMemory`: arranques de H2, firmas de párrafo, FAQ y local proof.
- `siteStructureMemory`: secuencia completa de bloques, firma FAQ y combo hero/nav/CTA.

## Qué hace

1. **Antes del render** evalúa riesgo de clonación dentro del cluster.
2. **Durante planificación** genera constraints para el arquitecto.
3. **En QualityGate** compara la página contra memoria del cluster.
4. **Después del render/publish** persiste memorias nuevas.

## Reglas clave implementadas

- no repetir el mismo hero 3 veces seguidas
- no repetir la misma secuencia de secciones en páginas vecinas
- no repetir los mismos inicios de FAQ y local proof
- bloquear si una página comparte:
  - misma secuencia completa de bloques
  - mismo hero + misma nav + mismo CTA final
  - demasiadas firmas editoriales repetidas

## Flujo recomendado

1. `installOriginalitySchema()` al arrancar la app o en `db/index.ts`.
2. `prepareOriginalityConstraints(...)` antes de `architect.execute(...)` o inmediatamente después del primer blueprint.
3. inyectar `architectDirective` al prompt del arquitecto si hay colisiones.
4. `runSiteOriginalityGate(...)` dentro de `runQualityGate()`.
5. `recordOriginalityAfterRender(...)` tras pasar validaciones.
