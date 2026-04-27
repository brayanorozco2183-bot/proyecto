# Plan de Refinamiento Diseño Corporativo (V7.1)

El objetivo es elevar la plantilla generada por `ContentArchitectAgent` de un diseño moderno genérico a un diseño **Premium, Autoridad Nacional y Corporativo Minimalista**.
# Plan: Debugging Interactivo Fase a Fase (Pipeline Gravity)

El usuario desea ejecutar el pipeline de forma individual, deteniéndose tras cada fase. Para lograr esto sin romper la integridad del sistema, implementaremos un controlador de estado persistente que permita pausar y reanudar la misión.

## Cambios Propuestos

### 1. Refactorización del Pipeline
#### [MODIFY] [contentGenerationPipeline.ts](file:///C:/Users/Bryan/Desktop/pruebaGravity/src/pipelines/contentGenerationPipeline.ts)
- Exponer los métodos de fase (e.g., `runResearchPhase`, `runNormalizationPhase`) de forma pública.
- Asegurar que cada fase acepte su input específico y devuelva un objeto transferible.

### 2. Controlador de Misión Persistente
#### [NEW] [missionController.ts](file:///C:/Users/Bryan/Desktop/pruebaGravity/src/orchestrator/missionController.ts)
- Una nueva clase que gestiona un archivo `mission_state.json` en la carpeta de la misión.
- Métodos: `loadState()`, `saveState()`, `executeNextStep()`.

### 3. Script Interactivo CLI
#### [NEW] [interactive_mission.ts](file:///C:/Users/Bryan/Desktop/pruebaGravity/scripts/step_mission.ts)
- Script que permite ejecutar:
  - `npm run step -- --phase research` -> Genera `state_research.json`.
  - `npm run step -- --phase planning` -> Lee el anterior y genera el siguiente.
  - O simplemente un bucle que espera entrada de teclado para continuar.

### 4. Corrección de Etiquetas
- Cambiar la etiqueta `3.1__undefined` a `3.1__planning` en el logger de artefactos.

## Mapa Técnico de Entradas/Salidas

| Fase | Comando Soportado | Entrada Esperada | Salida (Artefacto) |
| :--- | :--- | :--- | :--- |
| **1: Research** | `--phase 1` | `GenerationMission` | `ResearchContext` |
| **2: Normalization** | `--phase 2` | `ResearchContext` | `NormalizedContext` |
| **3: Planning** | `--phase 3` | `NormalizedContext` | `PagePlan` |
| **4: Writing** | `--phase 4` | `PagePlan` + `Context` | `ContentDraft` |
| **5: Correction** | `--phase 5` | `ContentDraft` | `CorrectedDraft` |
| **7: Enrichment** | `--phase 7` | `CorrectedDraft` | `EnrichedDraft` |
| **8: Assembly** | `--phase 8` | `EnrichedDraft` + `Plan` | `RenderedPage` (HTML) |
| **9-12: Audit** | `--phase 9` | `RenderedPage` | `PipelineResult` |

## Plan de Verificación

1. **Ejecución Paso a Paso**: Realizar una misión de "Cerrajeros en Getafe" ejecutando los comandos de fase de 1 al 12 individualmente.
2. **Validación de Persistencia**: Confirmar que los archivos `.json` de estado se crean correctamente entre fases.
3. **Walkthrough**: Documentar el proceso exacto para que el usuario pueda repetirlo.

## Preguntas Abiertas
- ¿Prefieres que el script cree archivos separados para cada fase (ej: `state_p1.json`, `state_p2.json`) o que sobrescriba un único `current_state.json`?

## Cambios Estilísticos a Aplicar (CSS)

1. **Paleta de Colores Corporativa (Menos es Más)**:
   - Primary: `#0A192F` (Navy muy oscuro y serio, no azul eléctrico).
   - Accent: `#D4AF37` (Oro tenue y elegante, no amarillo chillón).
   - Backgrounds: Uso intensivo de espacio negativo (`#FFFFFF`) y descansos muy sutiles (`#F8FAFC`).
   - Textos: `#334155` (Slate oscuro para legibilidad perfecta sin ser negro puro).

2. **Hero de Alta Autoridad**:
   - Eliminar el gradiente llamativo continuo (`linear-gradient(135deg, ...)`) en favor de un fondo sólido `#0A192F`. 
   - Añadir un sutil patrón o pseudo-textura (vía CSS radial-gradient ultra transparente) solo para darle profundidad corporativa sin distraer, o bien mantenerlo flat para máxima elegancia.
   - Tipografía del H1 más "apretada" (letter-spacing: -1.5px) y peso 900.

3. **Refinamiento de las Cards (Minimalismo)**:
   - Reducir el `border-radius` de 16px a 8px (los bordes muy redondeados parecen "apps", los bordes ligeramente cuadrados denotan seriedad e institucionalidad).
   - Sombras ultraligeras: cambiar el `box-shadow: 0 15px 35px rgba(0,0,0,0.06)` a algo más pulcro: `box-shadow: 0 4px 15px rgba(0,0,0,0.03); border: 1px solid #E2E8F0;`.
   - Efecto Hover sutil: Cambiar el pronunciado `translateY(-8px)` a un sofisticado `translateY(-3px); box-shadow: 0 10px 25px rgba(0,0,0,0.06);`.

4. **Botones y CTAs (Foco Cognitivo)**:
   - Eliminar la "escala" agresiva en el hover del CTA (`transform: scale(1.05)`). En lugar de eso, usar una traslación sutil de color o un ligero resplandor (`box-shadow` dorado).
   - Uniformidad: Todos los bordes de botones pasarán de 10px a 6px, alineados con el corporativismo.

5. **Ajuste Tipográfico y de Whitespace**:
   - Mantener `Inter` pero asegurar que el line-height y márgenes de los párrafos sean consistentes.
   - Reducir el padding mastodóntico de `100px` en móvil a `60px`, manteniendo gran respiro en Desktop (`90px`).

## Ejecución Técnica

Se modificará un único archivo:
- `[MODIFY]` `src/agents/architect.ts`: Reescribir el string devuelto en `buildTemplate` y los estilos en línea de los FAQs generados.

## Aprobación
¿Comenzamos a sobreescribir el CSS del `buildTemplate` con estas pautas específicas para lograr el aura corporativa?
