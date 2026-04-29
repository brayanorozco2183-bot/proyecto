# Guía de implantación en tu proyecto

## Qué problema resuelve

Hoy tu proyecto ya tiene dos piezas parciales:

1. `GenerationMission` ya acepta `cluster_data.geo`, `cluster_data.topical`, `siteConfig` y `subPath`.
2. `SEOAnalystAgent` ya devuelve `internalLinkTargets`.
3. El pipeline actual solo añade un bloque tardío de proximidad al final del HTML, así que todavía no hay una arquitectura interna estable.

La implantación correcta es:

- construir el grafo una vez por misión
- identificar la página actual dentro del grafo
- pasar los links disponibles al arquitecto antes de escribir
- inyectar bloques automáticos de enlazado antes del render final
- validar cobertura mínima antes de publicar

---

## 1) Añade el nuevo módulo

Copia `src/internal-linking/` dentro de tu repo.

---

## 2) Extiende `PagePlan` y tipos de pipeline

En `src/types/pipeline_v2.ts` añade un campo nuevo dentro de `PagePlan`:

```ts
internalLinking?: {
  graph?: any;
  currentNodeId?: string;
  architectContext?: any;
  linkPlan?: any;
};
```

Puedes tiparlo mejor importando desde `src/internal-linking/types.ts`, pero este cambio mínimo ya te desbloquea la integración.

Mira el snippet listo en `PATCHES/pipeline_v2.integration.snippet.ts`.

---

## 3) Inicializa el cluster antes del arquitecto

En `ContentGenerationPipeline`, justo antes de `this.architect.execute(...)`, prepara el cluster:

```ts
const cluster = prepareClusterArtifacts(
  mission,
  research.intentModel?.pageType || 'service',
  research.intentModel?.primaryKeyword || mission.niche,
  research.strategicAnalysis?.internalLinkTargets || [],
);
```

Después:

- pasa `cluster.architectContext` al arquitecto
- guarda `cluster.graph`, `cluster.currentNodeId` y `cluster.linkPlan` dentro de `successfulPlan.internalLinking`

Mira `PATCHES/contentGenerationPipeline.integration.snippet.ts`.

---

## 4) Haz que el arquitecto reciba links disponibles antes de escribir

En `src/agents/architect.ts`:

### A. Amplía `ArchitectInput`

Añade:

```ts
linkingContext?: {
  currentNodeId: string;
  availableLinks: Array<{
    slug: string;
    anchor: string;
    keyword: string;
    targetType: string;
    direction: string;
    reason: string;
  }>;
  mandatoryLinkGoals: string[];
};
```

### B. Mételo en el prompt

Dentro del `planPrompt`, añade un bloque como:

```ts
LINKS DISPONIBLES PARA ESTA PÁGINA:
${JSON.stringify(input.linkingContext || {}, null, 2)}

REGLAS DE ENLAZADO INTERNO:
- Debes planificar anchors contextuales hacia los links disponibles.
- No inventes URLs fuera de este contexto.
- Si la página es TOFU o MOFU, reserva al menos un enlace hacia la money page BOFU.
```

### C. Guarda la info en el blueprint

Después de `blueprint.intentModel = input.intentModel;` añade:

```ts
if (input.linkingContext) {
  blueprint.internalLinking = {
    currentNodeId: input.linkingContext.currentNodeId,
    architectContext: input.linkingContext,
  };
}
```

Mira `PATCHES/architect.integration.snippet.ts`.

---

## 5) Sustituye el interlinking tardío de proximidad por bloques programáticos

Ahora mismo tienes un añadido tardío tipo “neighborUrls + weaver.generateInterlinking(...)” al final de enriquecimiento.

Debes mantenerlo solo como fallback, no como sistema principal.

En `runEnrichmentPhase(...)` o justo antes del ensamblado:

```ts
const cluster = prepareClusterArtifacts(...);
draft = injectAutomaticLinkBlocks(draft, cluster.autoBlocks);
```

Eso te genera automáticamente bloques como:

- `Servicios relacionados`
- `Zonas relacionadas`
- `Guías útiles`
- `Preguntas frecuentes relacionadas`

De esta forma el enlazado deja de depender solo del HTML final y pasa a existir en la planificación.

---

## 6) Valida el criterio de aceptación antes de publicar

Dentro de `validateRenderedPageTechnically(...)` o justo después de esa llamada, añade:

```ts
const linkingIssues = validatePlanInternalLinking(plan, renderedPage.html);
issues.push(...linkingIssues);
```

Debe bloquear publicación si:

- hay menos de 3 enlaces útiles
- falta enlace ascendente
- falta enlace lateral
- una TOFU/MOFU no empuja a BOFU

Mira `PATCHES/technicalPageValidator.integration.snippet.ts`.

---

## 7) Qué campos debes empezar a usar de verdad

### Desde `GenerationMission`
- `cluster_data.geo`
- `cluster_data.topical`
- `subPath`

### Desde `SEOAnalystAgent`
- `internalLinkTargets`

### Nuevo en `PagePlan`
- `internalLinking.graph`
- `internalLinking.currentNodeId`
- `internalLinking.architectContext`
- `internalLinking.linkPlan`

---

## 8) Orden recomendado de implantación

1. Copia `src/internal-linking/`
2. Añade el campo `internalLinking` a `PagePlan`
3. Integra `prepareClusterArtifacts(...)` en pipeline
4. Pasa `linkingContext` al arquitecto
5. Inyecta `autoBlocks`
6. Añade validación bloqueante
7. Deja tu interlinking de proximidad anterior como fallback temporal

---

## 9) Qué cambia funcionalmente

Antes:
- enlaces parciales
- interlinking tardío
- sin garantía de arquitectura

Después:
- toda página nace dentro de un grafo
- el arquitecto ya sabe qué puede enlazar
- los bloques de enlazado se renderizan de forma programática
- la validación impide publicar páginas huérfanas
