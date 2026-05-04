# Patch: Premium Any-Niche Flow Stabilization

Fecha: 2026-05-04

## Objetivo

Este parche corrige incoherencias del flujo que impedían cumplir de forma robusta el objetivo principal de Gravity: generar páginas premium para un nicho local en cualquier lugar, sin inventar datos y sin bloquearse cuando el nicho no tiene playbook específico.

## Problemas detectados

1. **Dependencia dura de playbooks cerrados**
   - `resolvePlaybookForMission()` podía romper el flujo si el nicho no era uno de los playbooks soportados.
   - Esto contradice el objetivo multi-nicho del proyecto.

2. **Contratos premium con fallback inseguro**
   - `getPremiumNicheContract()` intentaba cargar un playbook obligatorio para nichos no soportados.
   - Nichos nuevos podían fallar antes de llegar a la capa de inteligencia genérica.

3. **Persistencia de estado no atómica**
   - `savePipelineState()` escribía directamente `state.json`.
   - Un corte durante escritura podía dejar el puntero corrupto y dificultar reanudar una misión.

4. **Faltaba una checklist premium transversal**
   - Había validadores técnicos, semánticos y de calidad, pero no una comprobación compacta alineada con la documentación ejecutiva: móvil, SEO básico, NAP honesto, schema prudente, placeholders, footer, FAQ y fallback de emergencia.

## Cambios incluidos

### 1. Playbook genérico para cualquier nicho

Nuevo archivo:

- `src/niches/genericPlaybook.ts`

Construye un `NichePlaybook` compatible a partir de `NicheIntelligenceProfile` cuando no existe playbook específico.

Aporta:

- vocabulario técnico genérico pero contextual,
- servicios base,
- objeciones,
- FAQs,
- criterios de decisión,
- señales de confianza prudentes,
- política legal sin claims absolutos,
- semántica para bloques de servicios, proceso, FAQ y precios orientativos.

### 2. Agent adapters tolerantes a nichos nuevos

Modificado:

- `src/niches/agentAdapters.ts`

Ahora:

- carga playbook específico si existe,
- si no existe, usa `buildGenericNichePlaybook(niche)`,
- mantiene briefs para Analyst, Architect, Writer y Technical,
- `resolveFaqSeed()`, `getRequiredSchemaTypesForNiche()` y `getNicheAliases()` ya no rompen por nicho desconocido.

### 3. Contrato premium con fallback genérico

Modificado:

- `src/niches/premiumContracts.ts`

Ahora `getPremiumNicheContract()` usa playbook específico o playbook genérico. Esto permite evaluar cobertura premium también en nichos no predefinidos.

### 4. State store atómico y recuperable

Modificado:

- `src/pipeline-state/pipelineStateStore.ts`

Ahora:

- `state.json` se escribe mediante `tmp + rename`,
- cada guardado crea también snapshots `state_XXX_phase_status.json`,
- `loadPipelineState()` intenta recuperar el último snapshot válido si `state.json` está corrupto.

### 5. Premium readiness guard

Nuevo archivo:

- `src/quality/premiumPageReadiness.ts`

Comprueba:

- HTML no vacío,
- `lang` español,
- viewport,
- title, description y canonical,
- un único H1,
- ciudad y nicho visibles,
- contenido mínimo,
- secciones diferenciadas,
- placeholders y fugas internas,
- enlaces `/index.html`,
- `tel:` sin teléfono validado,
- schema de reseñas sin evidencia,
- contenido después del footer,
- artefactos de numeración en FAQs,
- fallback de emergencia.

### 6. Integración en validación técnica

Modificado:

- `src/pipelines/phases/quality.phase.ts`

La fase `technical-validation` añade el resultado de `premium_readiness` a `metadata` y convierte incidencias bloqueantes en `validation_errors` con prefijo `[PREMIUM:...]`.

### 7. Quality policy entiende incidencias premium

Modificado:

- `src/quality/policy/qualityIssueAdapters.ts`

Los errores `[PREMIUM:...]` se tratan como incidencias técnicas de publicación y pueden bloquear delivery bajo perfil `publish`.

## Qué cumple mejor después del parche

- Multi-nicho real: el flujo ya no depende exclusivamente de cinco playbooks.
- Honestidad NAP: no permite publicar `tel:` sin teléfono validado.
- Schema prudente: bloquea reseñas o `aggregateRating` no verificados.
- Diseño/HTML premium: añade checklist de estructura, móvil, H1, canonical, footer y secciones.
- Recuperación: reduce el riesgo de romper el proyecto por `state.json` corrupto.

## Limitaciones restantes

- Un nicho sin playbook específico puede generar páginas correctas, pero el nivel máximo de especialización seguirá siendo menor que con un playbook sectorial curado.
- La calidad premium final depende de modelos IA disponibles, datos de misión, revisión humana y configuración real.
- Si no hay `node_modules`, `npm run typecheck` fallará hasta ejecutar `npm install` correctamente.
