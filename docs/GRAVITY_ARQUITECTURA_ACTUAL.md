# Gravity SEO Pipeline — Documentación Técnica Actualizada
> Versión del sistema: V8.1 (Mayo 2026)  
> Estado: Producción estabilizada — Ejecución determinista activa

---

## 1. Resumen del Sistema

Gravity es un motor de generación de contenido SEO de alta fidelidad. Toma un nicho y una ciudad como entrada, y produce una página HTML semánticamente enriquecida, con imágenes generadas por IA (ComfyUI/Flux) y potencialmente publicada vía SFTP/WordPress.

El sistema corre íntegramente en local: Ollama para los LLM, ComfyUI para las imágenes, SQLite para la persistencia y Express para el dashboard de control.

---

## 2. Arquitectura General

```
MAESTRO DASHBOARD (Next.js, puerto 8085)
        │
        ▼  HTTP REST
DASHBOARD API (Express, puerto 8081)
        │
        ▼
TASK ORCHESTRATOR (orchestrator.ts)
        │ lanza
        ▼
CONTENT GENERATION PIPELINE (contentGenerationPipeline.ts)
        │ delega en
        ▼
CONTENT PIPELINE STATE MACHINE (contentPipelineStateMachine.ts)
        │ fases secuenciales
        ▼
[Research → Normalization → Planning → Render-Plan → Writing → Correction
 → Integrity → Enrichment → SEO-Contract → Assembly → Images → Completeness
 → Technical-Validation → UX-Validation → Quality-Gate → Editorial-Validation
 → Delivery → Post-Audit]
        │
        ▼
output_sites/<niche>_<city>/index.html
```

---

## 3. Cómo Arrancar el Proyecto

### Requisitos previos
- **Ollama** corriendo en `http://localhost:11434` con los modelos descargados
- **ComfyUI** corriendo en `http://127.0.0.1:8000`
- **Redis** (opcional — si no está disponible, el sistema usa modo failsafe secuencial)

### Comandos de inicio

```bash
# Terminal 1 — Backend API
npm run dashboard
# → Escucha en http://localhost:8081

# Terminal 2 — Frontend Dashboard
cd maestro-dashboard
npm run dev
# → Escucha en http://localhost:8085
```

### Para lanzar una misión directamente (sin dashboard)

```bash
# Formato del comando en el dashboard:
# "<nicho> <ciudad>"
# Ejemplo: "electricistas getafe"
# Ejemplo cluster: "cerrajeros madrid, getafe, alcobendas"
```

---

## 4. Fases del Pipeline (en orden)

| # | Fase ID | Descripción | Agentes principales |
|---|---------|-------------|---------------------|
| 0 | `playbook` | Carga configuración del nicho | `playbookLoader` |
| 0.5 | `site-graph` | Construye grafo de interlinking | `buildSiteGraph` |
| 1 | `research` | Investigación SERP, geo, competencia, entidades | SEO_Analyst_01, GeoIntel_Agent, Competitor_Audit_Agent, SERP_Gap_Agent, Entity_Extractor |
| 2 | `normalization` | Normaliza contexto e inputs | ContextNormalizer |
| 3 | `planning` | Arquitectura semántica + visual DNA | Content_Architect_01, Art_Director_01, Layout_Composer_01, Content_Variety_01 |
| 3.5 | `render-plan` | Resolución del plan de renderizado | RenderPlanResolver |
| 4 | `writing` | Redacción editorial de secciones | Content_Writer_01, Niche_Coherence_Auditor |
| 5 | `correction` | Corrección lingüística española | Spanish_Linguistic_Corrector_V2 |
| 6 | `integrity` | Validación de presupuesto de palabras | (proceso determinista) |
| 7 | `enrichment` | Enriquecimiento LSI + contextual | WritingPhase.runEnrichment |
| 7.5 | `seo-contract` | Metadatos SEO, schema.org, interlinking | buildSeoContract |
| 8 | `assembly` | Ensamblaje HTML final | AssemblyPhase |
| 8.2 | `images` | Generación visual con ComfyUI/Flux | QualityPhase.runImagePhase |
| 8.5 | `completeness` | Validación de completitud de la página | QualityPhase.runCompletenessPhase |
| 9 | `technical-validation` | Validación técnica HTML/SEO | Technical_Specialist_05 |
| 9.25 | `ux-validation` | Validación UX | QualityPhase.runUXValidation |
| 9.5 | `quality-gate` | Gate de calidad final (score) | Quality_Auditor_10 |
| 10 | `editorial-validation` | Validación editorial | QualityPhase.runEditorialValidation |
| 11 | `delivery` | Despliegue (SFTP / WordPress / local) | Static_Deploy_09 / WP_Bridge_06 |
| 12 | `post-audit` | Auditoría post-despliegue | DeliveryPhase.runPostAudit |

---

## 5. Agentes del Sistema y Modelos LLM Asignados

El sistema usa un **Model Router** (`src/ai/modelRouter.ts`) que asigna un modelo Ollama a cada agente según su tier de complejidad.

### Modelos configurados actualmente (`.env`)

| Variable | Modelo | Uso |
|---|---|---|
| `OLLAMA_MODEL_FAST` | `qwen2.5:1.5b` | Agentes de utilidad rápidos |
| `OLLAMA_MODEL_STANDARD` | `qwen2.5:1.5b` | Agentes de análisis intermedios |
| `OLLAMA_MODEL_PREMIUM` | `qwen2.5-coder:3b` | Agentes críticos (escritura, arquitectura, QA) |
| `OLLAMA_MODEL_CODER` | `qwen2.5-coder:3b` | Technical_Specialist_05 |
| `OLLAMA_MODEL_RESEARCH` | `qwen2.5:latest` | Fallback de investigación |

### Override específico activo
- `Content_Writer_01` → `qwen2.5-coder:3b` (via `OLLAMA_AGENT_MODEL_CONTENT_WRITER_01`)
- `Spanish_Linguistic_Corrector_V2` → `qwen2.5:latest` (via `AGENT_MODEL_OVERRIDES_JSON`)

### Mapa de agentes por tier

| Tier | Agentes |
|---|---|
| **premium** | Content_Architect_01, Content_Writer_01, Niche_Coherence_Auditor, Quality_Auditor_10 |
| **standard** | SEO_Analyst_01, GeoIntel_Agent, Competitor_Audit_Agent, Art_Director_01, Layout_Composer_01, Spanish_Linguistic_Corrector_V2, Video_Architect_12, Authority_Weaver_13 |
| **fast** | Entity_Extractor, NAP_Guardian_01, Content_Variety_01, ROI_Auditor_15, Linguist_Interpreter_08 |
| **coder** | Technical_Specialist_05 |
| **deterministic** | Static_Deploy_09, WP_Bridge_06, Sentinel_Observer_14 (sin LLM) |

---

## 6. Playbooks de Nicho Disponibles

Los playbooks definen el comportamiento editorial y técnico de cada nicho.  
Ubicación: `src/niches/playbooks/`

| Archivo | Nicho |
|---|---|
| `cerrajeros.json` | Cerrajeros |
| `electricistas.json` | Electricistas |
| `fontaneros.json` | Fontaneros |
| `carpinteros.json` | Carpinteros |
| `pintores.json` | Pintores |
| `reformas_integrales.json` | Reformas Integrales |

> Para agregar un nuevo nicho: crear `src/niches/playbooks/<nicho>.json` siguiendo la estructura de los existentes y registrar el alias en `playbookLoader.ts`.

---

## 7. Generación de Imágenes (ComfyUI + Flux)

### Configuración activa
- **URL ComfyUI**: `http://127.0.0.1:8000`
- **Modelo base**: Flux1-Schnell (GGUF Q2_K, optimizado para 4GB VRAM)
- **LoRA**: Activado (`COMFY_LORA_ENABLED=true`), máx. 2 por imagen, fuerza 0.8
- **Output**: `./assets_generated/page-images/`
- **Workflows**: 
  - Hero: `./workflows/comfy/flux2-klein-hero.json`
  - Editorial: `./workflows/comfy/flux2-klein-editorial.json`

### Política "Trust-First" (activa desde V8.1)
Los assets generados por ComfyUI con `data-image-origin="comfy"` son **canónicos e intocables**.  
Las siguientes lógicas legacy han sido **eliminadas permanentemente**:
- `replaceLowQualityHeroMedia` — ya no existe en `deterministicHtmlSanitizer.ts`
- `ensureHeroIllustrationCss` — eliminado
- Gate `LOW_RES_HERO_NOT_REPLACED` — eliminado de `deterministicProductionGate.ts`
- Check `PREMIUM_LOW_CONFIDENCE_HERO_IMAGE` — eliminado de `premiumPageReadiness.ts`

---

## 8. Control de Ejecución y Stop de Misiones

### Sistema RuntimeControl (`src/utils/runtimeControl.ts`)
**Versión actual: Aislada por missionId** (corregido en V8.1)

Cada misión tiene su propio canal de señales. Detener la Misión A no puede contaminar la Misión B.

```
RuntimeControl.setActiveMission(missionId)  → Inicializa canal
RuntimeControl.check(missionId)             → Lanza PROCESS_ABORTED_BY_USER si detenida
RuntimeControl.stopMission(missionId)       → Detiene solo esa misión
RuntimeControl.stopAll()                    → Pánico global (detiene todo)
RuntimeControl.reset()                      → Limpia señal global
```

### Endpoint Stop del Dashboard
`POST /api/command/stop`
- Marca `missions` → `STOPPED` (estados `PROCESSING` y `PENDING`)
- Marca `city_data` → `STOPPED` (todos excepto `COMPLETED`, `FAILED`, `STATIC_READY`, `PUBLISHED`)
- Llama `orchestrator.stopAllMissions()`

### Reinicio de misiones fantasma
Si el dashboard muestra misiones activas que no deberían existir:

```bash
cmd.exe /c "npx tsx clear_all.ts"
```

---

## 9. Base de Datos (SQLite — `maestro.db`)

### Tablas principales

| Tabla | Descripción |
|---|---|
| `missions` | Una fila por misión lanzada. Estado global de la misión. |
| `city_data` | Una fila por ciudad/destino de la misión. Contiene el estado de fase actual. |
| `agent_logs` | Log de pensamientos de cada agente durante la ejecución. |
| `site_settings` | Configuración del sitio (URL, FTP, WordPress, debug mode). |
| `agent_knowledge` | Reglas persistentes inyectadas en los prompts de los agentes. |
| `learning_exemplars` | Ejemplares curados para el sistema de aprendizaje. |
| `fingerprints` | Fingerprints de estructura para garantizar originalidad. |

### Estados de `missions`
`PENDING` → `PROCESSING` / `running` → `COMPLETED` / `FAILED` / `STOPPED`

### Estados de `city_data` (fases del pipeline)
`PENDING` → `RESEARCH` → `PLANNING` → `WRITING` → `CORRECTION` → `IMAGES` → `COMPLETENESS` → `POST-AUDIT` → `STATIC_READY` / `FAILED` / `STOPPED`

---

## 10. Dashboard API — Endpoints Principales

| Método | Endpoint | Descripción |
|---|---|---|
| POST | `/api/command` | Lanza una misión |
| POST | `/api/command/stop` | Detiene todas las misiones activas |
| GET | `/api/missions` | Lista las últimas 50 entradas de city_data |
| GET | `/api/missions/active` | Misión activa actual |
| GET | `/api/stats` | Conteo de estados de city_data |
| GET | `/api/health` | Estado de Ollama, Redis y DB |
| GET | `/api/settings` | Configuración del sitio actual |
| POST | `/api/settings` | Guarda configuración del sitio |
| GET | `/api/agents` | Lista todos los agentes registrados |
| GET | `/api/logs` | Logs de agentes (filtrable por agente/misión) |
| GET | `/api/seo-master/pages` | Lista páginas generadas en output_sites |
| POST | `/api/agent/interact` | Interactúa con un agente específico (playground) |

---

## 11. Configuración Crítica del `.env`

### Flags de comportamiento del pipeline

| Variable | Valor actual | Efecto |
|---|---|---|
| `PIPELINE_SOFT_MODE` | `true` | Si una fase falla, el pipeline intenta continuar con el HTML parcial |
| `PIPELINE_FAST_DEBUG` | `true` | Modo debug acelerado |
| `QUALITY_GATE_FORCE_PASS` | `false` | El quality gate puede bloquear la entrega |
| `FAIL_ON_DEGRADED_PLAN` | `false` | Un plan degradado no bloquea la ejecución |
| `DEBUG_MODE` | `true` | Activa artefactos de debug en `debug_runs/` |
| `GRAVITY_SUPER_DELIVERY_LOCK` | `true` | Bloqueo de entrega determinista |
| `GRAVITY_PRODUCTION_SAFE_MODE` | `true` | Modo producción seguro |

### Seguridad del dashboard
- Puerto API: `8081`
- Token de autenticación: `DASHBOARD_AUTH_TOKEN`
- Orígenes permitidos: localhost:8081 y localhost:8085

---

## 12. Output y Archivos Generados

```
output_sites/
└── <nicho>_<ciudad>/
    ├── index.html          ← Página HTML final
    └── assets/             ← Assets locales (si aplica)

assets_generated/
└── page-images/
    └── *.webp              ← Imágenes generadas por ComfyUI

debug_runs/
└── <runId>/
    ├── phase_*.json        ← Snapshots de cada fase (si DEBUG_MODE=true)
    └── consolidated.json   ← Resumen consolidado
```

---

## 13. Diagnóstico Rápido de Problemas

| Síntoma | Causa probable | Solución |
|---|---|---|
| `PROCESS_ABORTED_BY_USER` al lanzar nueva misión | Estado de stop no limpiado | Reiniciar el proceso Node + `clear_all.ts` |
| Dashboard muestra N misiones activas al arrancar | Estados fantasma en DB | `cmd.exe /c "npx tsx clear_all.ts"` |
| Imágenes no aparecen en la página final | ComfyUI offline o `COMFY_ENABLED=false` | Verificar que ComfyUI corre en puerto 8000 |
| Error de Redis al lanzar misión | Redis no disponible | El sistema usa modo failsafe automáticamente |
| Página generada sin cambios visibles | Caché del navegador o pipeline en fallback | Forzar reload + revisar logs de fases en debug_runs |
| `WORD_BUDGET_TOO_LOW` | El LLM generó contenido muy corto | Revisar prompts del playbook del nicho |

---

*Documentación generada el 05/05/2026 — Gravity V8.1*
